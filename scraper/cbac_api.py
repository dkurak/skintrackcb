"""
CBAC API Client

Fetches avalanche forecast data from the public avalanche.org API.

The public API provides:
- Overall danger level (1-5)
- Travel advice
- Valid dates
- Zone geometry

Detailed data (elevation-specific danger, problems) requires either:
1. Scraping the website (JavaScript-rendered)
2. API access from CBAC/AFP
"""

import requests
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict, field

API_URL = "https://api.avalanche.org/v2/public/products/map-layer/CBAC"

HEADERS = {
    "User-Agent": "CBAC-Forecast-Tracker/1.0 (educational project)",
    "Accept": "application/json",
}

# Default rose for when we don't have detailed data
DEFAULT_ROSE = {
    "N": {"alpine": False, "treeline": False, "below_treeline": False},
    "NE": {"alpine": False, "treeline": False, "below_treeline": False},
    "E": {"alpine": False, "treeline": False, "below_treeline": False},
    "SE": {"alpine": False, "treeline": False, "below_treeline": False},
    "S": {"alpine": False, "treeline": False, "below_treeline": False},
    "SW": {"alpine": False, "treeline": False, "below_treeline": False},
    "W": {"alpine": False, "treeline": False, "below_treeline": False},
    "NW": {"alpine": False, "treeline": False, "below_treeline": False},
}


@dataclass
class AvalancheProblem:
    """Represents a single avalanche problem."""
    problem_number: int
    problem_type: str
    likelihood: str
    size: str
    aspect_elevation_rose: dict = field(default_factory=lambda: DEFAULT_ROSE.copy())
    details: Optional[str] = None


@dataclass
class Forecast:
    """Represents a complete avalanche forecast."""
    id: str
    zone: str
    zone_name: str
    center: str
    issue_date: str
    valid_date: str
    expires_date: str
    danger_level: int  # Overall danger (1-5)
    danger_text: str   # "low", "moderate", etc.
    danger_alpine: int     # Detailed - may be same as overall if not available
    danger_treeline: int
    danger_below_treeline: int
    travel_advice: str
    bottom_line: str
    discussion: str
    problems: List[Dict]
    forecast_url: str
    created_at: str


def fetch_forecasts() -> List[Forecast]:
    """
    Fetch current forecasts from the avalanche.org API.

    Returns:
        List of Forecast objects for all CBAC zones
    """
    try:
        response = requests.get(API_URL, headers=HEADERS, timeout=15)
        response.raise_for_status()
        data = response.json()

        forecasts = []
        for feature in data.get("features", []):
            props = feature.get("properties", {})
            zone_id = str(feature.get("id", ""))

            # Parse dates
            start_date = props.get("start_date", "")
            end_date = props.get("end_date", "")

            # Convert to ISO date format
            issue_date = start_date[:10] if start_date else datetime.now().strftime("%Y-%m-%d")
            valid_date = issue_date  # Same as issue date
            expires_date = end_date[:10] if end_date else ""

            # Map zone name to our internal zone ID
            zone_name = props.get("name", "")
            zone = "northwest" if "northwest" in zone_name.lower() else "southeast"

            danger_level = props.get("danger_level", 2)

            forecast = Forecast(
                id=zone_id,
                zone=zone,
                zone_name=zone_name,
                center=props.get("center", "Crested Butte Avalanche Center"),
                issue_date=issue_date,
                valid_date=valid_date,
                expires_date=expires_date,
                danger_level=danger_level,
                danger_text=props.get("danger", "moderate"),
                # Use overall danger for all elevations (detailed data not available via public API)
                danger_alpine=danger_level,
                danger_treeline=danger_level,
                danger_below_treeline=max(1, danger_level - 1),  # Estimate: usually lower at BTL
                travel_advice=props.get("travel_advice", ""),
                bottom_line=props.get("travel_advice", ""),  # Use travel advice as bottom line
                discussion="Detailed forecast discussion available at CBAC website.",
                problems=[],  # Detailed problems not available via public API
                forecast_url=props.get("link", ""),
                created_at=datetime.now().isoformat(),
            )

            forecasts.append(forecast)

        return forecasts

    except requests.RequestException as e:
        print(f"Error fetching forecasts: {e}")
        return []
    except (KeyError, json.JSONDecodeError) as e:
        print(f"Error parsing forecast data: {e}")
        return []


def forecasts_to_json(forecasts: List[Forecast]) -> str:
    """Convert forecasts to JSON string."""
    return json.dumps([asdict(f) for f in forecasts], indent=2)


def save_forecasts(forecasts: List[Forecast], filename: str = "forecasts.json"):
    """Save forecasts to a JSON file."""
    with open(filename, 'w') as f:
        f.write(forecasts_to_json(forecasts))
    print(f"Saved {len(forecasts)} forecasts to {filename}")


def main():
    """Main entry point."""
    print("Fetching CBAC forecasts from avalanche.org API...")
    print("=" * 60)

    forecasts = fetch_forecasts()

    if forecasts:
        print(f"\nFound {len(forecasts)} forecast(s):")
        for f in forecasts:
            print(f"\n  Zone: {f.zone_name}")
            print(f"  Danger: {f.danger_level} ({f.danger_text})")
            print(f"  Valid: {f.issue_date} to {f.expires_date}")
            print(f"  Travel Advice: {f.travel_advice[:100]}...")
            print(f"  URL: {f.forecast_url}")

        # Save to file
        save_forecasts(forecasts)

        print("\n" + "=" * 60)
        print("Note: The public API provides overall danger only.")
        print("Elevation-specific danger and problems require website scraping")
        print("or API access from CBAC/AFP.")
    else:
        print("No forecasts found.")


if __name__ == "__main__":
    main()
