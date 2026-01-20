"""
Save forecasts to Supabase database.

Usage:
    python save_to_supabase.py
    python save_to_supabase.py --days=3
    python save_to_supabase.py --zones=southeast

Environment variables required:
    SUPABASE_URL - Your Supabase project URL
    SUPABASE_SERVICE_KEY - Your Supabase service role key (not anon key)
"""

import os
import sys
import re
import argparse
from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple
from dataclasses import asdict
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Check for Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables required")
    print("Set these in a .env file or as environment variables")
    sys.exit(1)

try:
    from supabase import create_client, Client
except ImportError:
    print("Error: supabase package not installed")
    print("Run: pip install supabase")
    sys.exit(1)

from cbac_api_scraper import (
    scrape_all_zones,
    scrape_zone_forecasts,
    Forecast,
    ZONES,
)

# Danger level to text mapping
DANGER_TEXT = {
    1: "Low",
    2: "Moderate",
    3: "Considerable",
    4: "High",
    5: "Extreme",
}


def analyze_trend_from_text(bottom_line: str, discussion: str) -> str:
    """
    Analyze forecast text to determine trend based on keywords.
    Used as fallback when danger levels are unchanged.

    Returns:
        trend string
    """
    text = f"{bottom_line or ''} {discussion or ''}"
    text_lower = text.lower()

    # Storm incoming indicators
    storm_patterns = [
        "storm expected", "storm approaching", "storm arriving",
        "snow expected", "snow arriving", "inches expected",
        "accumulation expected", "danger is expected to rise",
        "loading will", "new load"
    ]
    if any(pattern in text_lower for pattern in storm_patterns):
        return "storm_incoming"

    # Worsening indicators
    if any(kw in text_lower for kw in [
        "dangerous avalanche conditions", "heightened avalanche conditions",
        "increasing", "elevated danger"
    ]):
        return "worsening"

    # Improving indicators
    if any(kw in text_lower for kw in [
        "adjusting", "stabiliz", "decreased", "isolated",
        "stubborn", "unlikely", "slowly improved", "conditions have improved"
    ]):
        return "improving"

    return "steady"


def calculate_trend(
    current_danger: int,
    current_problems: int,
    prev_danger: Optional[int],
    prev_problems: Optional[int],
    bottom_line: str,
    discussion: str
) -> str:
    """
    Calculate trend by comparing danger levels between days.

    Primary signal: danger level change
    Secondary signal: problem count change
    Tertiary signal: text analysis

    Returns:
        trend string: 'improving', 'steady', 'worsening', 'storm_incoming'
    """
    # If no previous data, use text analysis
    if prev_danger is None:
        return analyze_trend_from_text(bottom_line, discussion)

    # Check for storm incoming in text first (takes priority)
    text_trend = analyze_trend_from_text(bottom_line, discussion)
    if text_trend == "storm_incoming":
        return "storm_incoming"

    # Compare danger levels (primary signal)
    danger_change = current_danger - prev_danger

    if danger_change < 0:
        # Danger decreased = improving
        return "improving"
    elif danger_change > 0:
        # Danger increased = worsening
        return "worsening"

    # Danger same - check problem count (secondary signal)
    if prev_problems is not None:
        problem_change = current_problems - prev_problems
        if problem_change < 0:
            # Fewer problems = improving
            return "improving"
        elif problem_change > 0:
            # More problems = worsening (or new_problem)
            return "worsening"

    # Danger and problems same - use text analysis (tertiary signal)
    return text_trend


def extract_key_message(bottom_line: str, discussion: str) -> Optional[str]:
    """Extract the most actionable sentence from forecast text."""
    text = f"{bottom_line or ''} {discussion or ''}"
    sentences = re.split(r'[.!]', text)

    key_patterns = [
        r'expect\s+\w+',
        r'avoid\s+\w+',
        r'stay\s+(below|under|off|away)',
        r'do\s+not',
        r'give\s+yourself.*margin',
        r'safest.*terrain',
        r'you can trigger',
        r'dangerous\s+\w+',
    ]

    for sentence in sentences:
        sentence = sentence.strip()
        if len(sentence) < 15:
            continue
        for pattern in key_patterns:
            if re.search(pattern, sentence.lower()):
                return sentence[:300]

    # If no key pattern found, use first meaningful sentence
    for sentence in sentences:
        sentence = sentence.strip()
        if len(sentence) > 30:
            return sentence[:300]

    return None


def extract_travel_advice(bottom_line: str, discussion: str) -> Optional[str]:
    """Extract travel/terrain advice from forecast text."""
    text = f"{bottom_line or ''} {discussion or ''}"

    travel_patterns = [
        r'(the safest[^.]+\.)',
        r'(you can reduce[^.]+\.)',
        r'(avoid[^.]+\.)',
        r'(lower elevation[^.]+\.)',
        r'(wind.protected[^.]+\.)',
        r'(best.*riding[^.]+\.)',
    ]

    for pattern in travel_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()[:300]

    return None


def get_previous_forecast(client: Client, zone: str, valid_date: str) -> Optional[Dict[str, Any]]:
    """
    Fetch the previous day's forecast for comparison.

    Returns:
        Dict with danger_level and problem_count, or None if not found
    """
    from datetime import datetime, timedelta

    try:
        # Parse the date and get previous day
        current_date = datetime.strptime(valid_date, "%Y-%m-%d")
        prev_date = (current_date - timedelta(days=1)).strftime("%Y-%m-%d")

        # Fetch previous forecast
        result = client.table("forecasts").select(
            "danger_alpine, danger_treeline, danger_below_treeline"
        ).eq("zone_id", zone).eq("valid_date", prev_date).execute()

        if result.data and len(result.data) > 0:
            prev = result.data[0]
            prev_danger = max(
                prev["danger_alpine"],
                prev["danger_treeline"],
                prev["danger_below_treeline"]
            )

            # Get problem count
            prob_result = client.table("avalanche_problems").select(
                "id", count="exact"
            ).eq("forecast_id", result.data[0].get("id", "")).execute()

            # Try to get problem count from a join instead
            prob_result = client.table("forecasts").select(
                "id"
            ).eq("zone_id", zone).eq("valid_date", prev_date).execute()

            prev_problems = 0
            if prob_result.data and len(prob_result.data) > 0:
                forecast_id = prob_result.data[0]["id"]
                prob_count = client.table("avalanche_problems").select(
                    "id"
                ).eq("forecast_id", forecast_id).execute()
                prev_problems = len(prob_count.data) if prob_count.data else 0

            return {
                "danger_level": prev_danger,
                "problem_count": prev_problems
            }

        return None

    except Exception as e:
        print(f"    Warning: Could not fetch previous forecast: {e}")
        return None


def get_supabase_client() -> Client:
    """Create and return a Supabase client."""
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def save_forecast(client: Client, forecast: Forecast) -> Optional[str]:
    """
    Save a forecast to Supabase.

    Uses upsert to update existing forecasts for the same zone/date.

    Returns:
        The forecast ID if successful, None otherwise
    """
    try:
        # Calculate overall danger level (max of the three)
        danger_level = max(
            forecast.danger_alpine,
            forecast.danger_treeline,
            forecast.danger_below_treeline
        )

        # Get previous day's forecast for trend comparison
        prev_forecast = get_previous_forecast(client, forecast.zone, forecast.valid_date)

        # Calculate trend by comparing to previous day
        current_problems = len(forecast.problems) if forecast.problems else 0
        trend = calculate_trend(
            current_danger=danger_level,
            current_problems=current_problems,
            prev_danger=prev_forecast["danger_level"] if prev_forecast else None,
            prev_problems=prev_forecast["problem_count"] if prev_forecast else None,
            bottom_line=forecast.bottom_line or "",
            discussion=forecast.discussion or ""
        )

        # Extract key message and travel advice
        key_message = extract_key_message(
            forecast.bottom_line or "",
            forecast.discussion or ""
        )
        travel_advice = extract_travel_advice(
            forecast.bottom_line or "",
            forecast.discussion or ""
        )

        # Prepare forecast data
        forecast_data = {
            "zone_id": forecast.zone,
            "zone_name": forecast.zone_name,
            "issue_date": forecast.issue_date,
            "valid_date": forecast.valid_date,
            "danger_level": danger_level,
            "danger_text": DANGER_TEXT.get(danger_level, "Unknown"),
            "danger_alpine": forecast.danger_alpine,
            "danger_treeline": forecast.danger_treeline,
            "danger_below_treeline": forecast.danger_below_treeline,
            "bottom_line": forecast.bottom_line,
            "discussion": forecast.discussion,
            "forecast_url": forecast.forecast_url,
            "trend": trend,
            "key_message": key_message,
            "travel_advice": travel_advice,
            "raw_data": {
                "scraped_at": datetime.now().isoformat(),
                "weather": forecast.weather,
            },
        }

        # Upsert forecast (update if exists, insert if not)
        result = client.table("forecasts").upsert(
            forecast_data,
            on_conflict="zone_id,valid_date"
        ).execute()

        if result.data and len(result.data) > 0:
            forecast_id = result.data[0]["id"]
            print(f"  Saved forecast for {forecast.zone_name} ({forecast.valid_date})")
            if prev_forecast:
                print(f"    Danger: {prev_forecast['danger_level']} → {danger_level} | Trend: {trend}")
            else:
                print(f"    Danger: {danger_level} | Trend: {trend} (no previous day)")

            # Delete existing problems for this forecast (to handle updates)
            client.table("avalanche_problems").delete().eq(
                "forecast_id", forecast_id
            ).execute()

            # Save avalanche problems if any
            if forecast.problems:
                for problem in forecast.problems:
                    problem_data = {
                        "forecast_id": forecast_id,
                        "problem_number": problem.get("problem_number", 1),
                        "problem_type": problem.get("problem_type", "unknown"),
                        "likelihood": problem.get("likelihood"),
                        "size": problem.get("size"),
                        "aspect_elevation_rose": problem.get("aspect_elevation_rose"),
                        "details": problem.get("details"),
                    }
                    client.table("avalanche_problems").insert(problem_data).execute()
                print(f"    Saved {len(forecast.problems)} avalanche problems")

            # Save weather data if available
            if forecast.weather:
                weather_data = {
                    "zone_id": forecast.zone,
                    "forecast_date": forecast.valid_date,
                    "metrics": {
                        "temperature": forecast.weather.get("temperature"),
                        "cloud_cover": forecast.weather.get("cloud_cover"),
                        "wind_speed": forecast.weather.get("wind_speed"),
                        "wind_direction": forecast.weather.get("wind_direction"),
                        "snowfall_12hr": forecast.weather.get("snowfall_12hr"),
                        "snowfall_24hr": forecast.weather.get("snowfall_24hr"),
                    },
                    "raw_text": forecast.weather.get("discussion", ""),
                }
                client.table("weather_forecasts").upsert(
                    weather_data,
                    on_conflict="zone_id,forecast_date"
                ).execute()
                print(f"    Saved weather data")

            return forecast_id

        return None

    except Exception as e:
        print(f"  Error saving forecast: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    """Main entry point for the Supabase save script."""
    parser = argparse.ArgumentParser(description="Scrape CBAC forecasts and save to Supabase")
    parser.add_argument("--days", type=int, default=1,
                        help="Number of days to scrape (default: 1)")
    parser.add_argument("--zones", type=str, default="southeast,northwest",
                        help="Comma-separated zones to scrape (default: southeast,northwest)")
    args = parser.parse_args()

    print("=" * 60)
    print("CBAC Forecast to Supabase (API)")
    print("=" * 60)

    zones = [z.strip() for z in args.zones.split(",")]

    # Scrape forecasts
    print(f"\n1. Scraping {args.days} day(s) of forecasts for {', '.join(zones)}...")

    # Scrape using API
    forecasts = []
    for zone in zones:
        if zone in ZONES:
            zone_forecasts = scrape_zone_forecasts(zone, args.days)
            forecasts.extend(zone_forecasts)
        else:
            print(f"Unknown zone: {zone}")

    if not forecasts:
        print("No forecasts found. Exiting.")
        sys.exit(1)

    print(f"   Scraped {len(forecasts)} forecast(s)")

    # Connect to Supabase
    print("\n2. Connecting to Supabase...")
    try:
        client = get_supabase_client()
        print("   Connected successfully")
    except Exception as e:
        print(f"   Error connecting: {e}")
        sys.exit(1)

    # Save forecasts
    print("\n3. Saving forecasts to database...")
    saved_count = 0
    for forecast in forecasts:
        forecast_id = save_forecast(client, forecast)
        if forecast_id:
            saved_count += 1

    print(f"\n4. Done! Saved {saved_count}/{len(forecasts)} forecast(s)")

    if saved_count != len(forecasts):
        print("   Some forecasts may have failed to save. Check logs above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
