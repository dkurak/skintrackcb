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


def analyze_trend(bottom_line: str, discussion: str) -> Tuple[str, Optional[str], Optional[str]]:
    """
    Analyze forecast text to determine trend, key message, and travel advice.

    Returns:
        Tuple of (trend, key_message, travel_advice)
    """
    text = f"{bottom_line or ''} {discussion or ''}"
    text_lower = text.lower()

    # Determine trend based on keywords
    trend = "steady"  # default

    # Storm incoming indicators
    storm_patterns = [
        "storm expected", "storm approaching", "storm arriving",
        "snow expected", "snow arriving", "inches expected",
        "accumulation expected", "danger is expected to rise",
        "loading will", "new load"
    ]
    if any(pattern in text_lower for pattern in storm_patterns):
        trend = "storm_incoming"

    # Worsening indicators (if not already storm)
    elif any(kw in text_lower for kw in [
        "dangerous avalanche conditions", "heightened avalanche conditions",
        "increasing", "elevated danger"
    ]):
        trend = "worsening"

    # Improving indicators
    elif any(kw in text_lower for kw in [
        "adjusting", "stabiliz", "decreased", "isolated",
        "stubborn", "unlikely", "slowly improved", "conditions have improved"
    ]):
        trend = "improving"

    # Extract key message - look for actionable sentences
    key_message = None
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
                key_message = sentence[:300]  # Limit length
                break
        if key_message:
            break

    # If no key message found, use first meaningful sentence
    if not key_message:
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) > 30:
                key_message = sentence[:300]
                break

    # Extract travel advice
    travel_advice = None
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
            travel_advice = match.group(1).strip()[:300]
            break

    return trend, key_message, travel_advice


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

        # Analyze trend and extract key message
        trend, key_message, travel_advice = analyze_trend(
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
            print(f"    Trend: {trend}")

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
