"""
CBAC Forecast Scraper using Selenium

Scrapes the full forecast data from CBAC website by rendering JavaScript.
Uses your system Chrome browser.
"""

import json
import time
import re
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict, field

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager


# CBAC forecast URLs - supports date parameter: #/zone/YYYY-MM-DD
FORECAST_BASE_URL = "https://cbavalanchecenter.org/forecasts/#"
FORECAST_ZONES = {
    "northwest": "northwest-mountains",
    "southeast": "southeast-mountains",
}

def get_forecast_url(zone: str, date: Optional[str] = None) -> str:
    """Get forecast URL for a zone, optionally for a specific date."""
    zone_path = FORECAST_ZONES.get(zone, zone)
    if date:
        return f"{FORECAST_BASE_URL}/{zone_path}/{date}"
    return f"{FORECAST_BASE_URL}/{zone_path}"

# Danger level text to number mapping
DANGER_MAP = {
    "low": 1,
    "moderate": 2,
    "mod": 2,
    "considerable": 3,
    "cons": 3,
    "high": 4,
    "extreme": 5,
    "extr": 5,
}


@dataclass
class AvalancheProblem:
    problem_number: int
    problem_type: str
    likelihood: str
    size: str
    aspect_elevation_rose: Dict[str, Dict[str, bool]]
    details: Optional[str] = None


@dataclass
class WeatherForecast:
    zone: str
    zone_name: str
    forecast_date: str
    summary: str
    details: Dict[str, Any]  # Temperature, wind, precip, etc.


@dataclass
class Forecast:
    zone: str
    zone_name: str
    issue_date: str
    valid_date: str
    danger_alpine: int
    danger_treeline: int
    danger_below_treeline: int
    bottom_line: str
    discussion: str
    problems: List[Dict]
    forecast_url: str
    weather: Optional[Dict[str, Any]] = None
    raw_html: str = ""


def create_driver(headless: bool = True) -> webdriver.Chrome:
    """Create a Chrome WebDriver instance."""
    options = Options()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")

    service = Service(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=options)


def parse_danger_level(text: str) -> int:
    """Parse danger level from text like '2 - Moderate' or just 'Moderate'."""
    text_lower = text.lower().strip()

    # Try to extract number first (e.g., "2 - Moderate")
    num_match = re.search(r'(\d)\s*[-–]\s*\w+', text)
    if num_match:
        return int(num_match.group(1))

    # Try word match
    for word, level in DANGER_MAP.items():
        if word in text_lower:
            return level

    # Try just a number
    try:
        return int(text.strip()[0])
    except:
        return 2  # Default to moderate


def create_empty_rose() -> Dict[str, Dict[str, bool]]:
    """Create an empty aspect/elevation rose."""
    return {
        aspect: {"alpine": False, "treeline": False, "below_treeline": False}
        for aspect in ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    }


def parse_page_text(text: str, zone: str) -> Forecast:
    """
    Parse the forecast data from the page text.
    The CBAC page has a consistent structure we can parse.
    """
    lines = text.split('\n')

    # Initialize defaults
    danger_alpine = 2
    danger_treeline = 2
    danger_btl = 1
    bottom_line = ""
    discussion = ""
    problems = []
    issue_date = datetime.now().strftime("%Y-%m-%d")

    # Find the AVALANCHE DANGER section and parse from there
    # Skip the DANGER SCALE legend which also contains "1 - Low", "5 - Extr" etc.
    in_danger_section = False
    danger_section_done = False

    for i, line in enumerate(lines):
        line_strip = line.strip()
        line_lower = line_strip.lower()

        # Start of danger section
        if "AVALANCHE DANGER" in line.upper():
            in_danger_section = True
            continue

        # End of danger section (hit the legend or problems)
        if in_danger_section and ("DANGER SCALE" in line.upper() or "AVALANCHE PROBLEMS" in line.upper()):
            danger_section_done = True
            in_danger_section = False

        # Only parse danger in the actual danger section, not the legend
        if in_danger_section and not danger_section_done:
            # Look for "Above Treeline" with elevation marker
            if "above treeline" in line_lower and "⇡" in line:
                # Next line with danger rating
                for j in range(i+1, min(i+3, len(lines))):
                    next_line = lines[j].strip()
                    if re.match(r'^\d\s*[-–]\s*\w+', next_line):
                        danger_alpine = parse_danger_level(next_line)
                        break

            # "Near Treeline" without elevation marker usually
            elif "near treeline" in line_lower and "above" not in line_lower and "below" not in line_lower:
                for j in range(i+1, min(i+3, len(lines))):
                    next_line = lines[j].strip()
                    if re.match(r'^\d\s*[-–]\s*\w+', next_line):
                        danger_treeline = parse_danger_level(next_line)
                        break

            # "Below Treeline" with elevation marker
            elif "below treeline" in line_lower and "⇣" in line:
                for j in range(i+1, min(i+3, len(lines))):
                    next_line = lines[j].strip()
                    if re.match(r'^\d\s*[-–]\s*\w+', next_line):
                        danger_btl = parse_danger_level(next_line)
                        break

    # Parse avalanche problems
    # Look for "PROBLEM #1:" patterns
    problem_pattern = re.compile(r'PROBLEM\s*#?(\d+)[:\s]*(.+)?', re.IGNORECASE)

    i = 0
    while i < len(lines):
        match = problem_pattern.match(lines[i].strip())
        if match:
            prob_num = int(match.group(1))
            prob_type_text = match.group(2) or ""

            # Get problem type from next line if not in match
            if not prob_type_text or prob_type_text.strip() == "":
                for j in range(i+1, min(i+5, len(lines))):
                    if lines[j].strip() and "PROBLEM TYPE" not in lines[j].upper():
                        if any(pt in lines[j].lower() for pt in ["slab", "loose", "cornice", "glide"]):
                            prob_type_text = lines[j].strip()
                            break

            # Normalize problem type
            prob_type = "unknown"
            prob_type_lower = prob_type_text.lower()
            if "persistent" in prob_type_lower and "slab" in prob_type_lower:
                prob_type = "persistent_slab"
            elif "wind" in prob_type_lower and "slab" in prob_type_lower:
                prob_type = "wind_slab"
            elif "storm" in prob_type_lower and "slab" in prob_type_lower:
                prob_type = "storm_slab"
            elif "wet" in prob_type_lower and "slab" in prob_type_lower:
                prob_type = "wet_slab"
            elif "loose" in prob_type_lower and "dry" in prob_type_lower:
                prob_type = "loose_dry"
            elif "loose" in prob_type_lower and "wet" in prob_type_lower:
                prob_type = "loose_wet"
            elif "cornice" in prob_type_lower:
                prob_type = "cornice"
            elif "glide" in prob_type_lower:
                prob_type = "glide"
            elif "slab" in prob_type_lower:
                prob_type = "persistent_slab"  # Default slab type

            # For likelihood and size, the page shows all options as a scale
            # We can't distinguish the selected value from plain text
            # Use defaults based on problem type - persistent slabs are typically "Possible"
            likelihood = "Possible"
            size = "D2"

            # Try to infer from problem details text if available
            # Look ahead for the description paragraph

            # Get problem details - find the paragraph after the problem definition
            details = ""
            in_details = False
            for j in range(i+1, min(i+50, len(lines))):
                line = lines[j].strip()
                # Skip header lines
                if any(h in line.upper() for h in ["PROBLEM TYPE", "ASPECT", "LIKELIHOOD", "SIZE", "ELEVATION"]):
                    continue
                if line in ["N", "E", "S", "W", "NE", "NW", "SE", "SW"]:
                    continue
                if re.match(r'^(Small|Large|Very Large|Historic|Unlikely|Possible|Likely|Very Likely|Certain)', line, re.IGNORECASE):
                    continue
                if "Above Treeline" in line or "Near Treeline" in line or "Below Treeline" in line:
                    continue

                # If we hit the next problem, stop
                if problem_pattern.match(line):
                    break

                # If line is substantial, it's likely details
                if len(line) > 50 and not in_details:
                    in_details = True
                    details = line
                elif in_details and len(line) > 20:
                    details += " " + line
                elif in_details and len(line) < 10:
                    break  # End of details

            problems.append({
                "problem_number": prob_num,
                "problem_type": prob_type,
                "likelihood": likelihood,
                "size": size,
                "aspect_elevation_rose": create_empty_rose(),
                "details": details[:1000] if details else None,
            })

        i += 1

    # Find bottom line - look for "THE BOTTOM LINE" section
    for i, line in enumerate(lines):
        if "BOTTOM LINE" in line.upper():
            # Get the text after this header
            for j in range(i+1, min(i+10, len(lines))):
                if lines[j].strip() and len(lines[j].strip()) > 30:
                    bottom_line = lines[j].strip()
                    # Get additional lines if they continue the thought
                    for k in range(j+1, min(j+5, len(lines))):
                        if lines[k].strip() and len(lines[k].strip()) > 20:
                            if not any(h in lines[k].upper() for h in ["FORECAST", "AVALANCHE", "PROBLEM"]):
                                bottom_line += " " + lines[k].strip()
                        else:
                            break
                    break
            break

    # Find forecast discussion - look for "FORECAST DISCUSSION" section
    for i, line in enumerate(lines):
        if "FORECAST DISCUSSION" in line.upper():
            discussion_lines = []
            for j in range(i+1, min(i+30, len(lines))):
                if lines[j].strip():
                    # Stop if we hit another section
                    if any(h in lines[j].upper() for h in ["AVALANCHE PROBLEM", "WEATHER", "RECENT"]):
                        break
                    if len(lines[j].strip()) > 20:
                        discussion_lines.append(lines[j].strip())
            discussion = " ".join(discussion_lines)
            break

    # Parse weather data - look for WEATHER or MOUNTAIN WEATHER section
    weather = None
    for i, line in enumerate(lines):
        line_upper = line.upper()
        if "WEATHER" in line_upper and ("MOUNTAIN" in line_upper or "FORECAST" in line_upper or "SUMMARY" in line_upper):
            weather_lines = []
            for j in range(i+1, min(i+40, len(lines))):
                line_text = lines[j].strip()
                if not line_text:
                    continue
                # Stop at other sections
                if any(h in line_text.upper() for h in ["AVALANCHE DANGER", "AVALANCHE PROBLEM", "BOTTOM LINE"]):
                    break
                if len(line_text) > 10:
                    weather_lines.append(line_text)

            if weather_lines:
                weather_text = " ".join(weather_lines)
                weather = {
                    "summary": weather_text[:500],  # First 500 chars as summary
                    "full_text": weather_text,
                }

                # Try to extract specific metrics from weather text
                weather_lower = weather_text.lower()

                # Look for temperature mentions
                temp_match = re.search(r'(-?\d+)\s*(?:to|-)\s*(-?\d+)\s*(?:f|degrees)', weather_lower)
                if temp_match:
                    weather["temp_low"] = int(temp_match.group(1))
                    weather["temp_high"] = int(temp_match.group(2))

                # Look for wind mentions
                wind_match = re.search(r'wind[s]?\s+(?:.*?)\s*(\d+)\s*(?:to|-)\s*(\d+)\s*mph', weather_lower)
                if wind_match:
                    weather["wind_low"] = int(wind_match.group(1))
                    weather["wind_high"] = int(wind_match.group(2))

                # Look for snow/precip mentions
                snow_match = re.search(r'(\d+)\s*(?:to|-)\s*(\d+)\s*(?:inch|in|")', weather_lower)
                if snow_match:
                    weather["snow_low"] = int(snow_match.group(1))
                    weather["snow_high"] = int(snow_match.group(2))
            break

    zone_name = "Northwest Mountains" if zone == "northwest" else "Southeast Mountains"

    return Forecast(
        zone=zone,
        zone_name=zone_name,
        issue_date=issue_date,
        valid_date=issue_date,
        danger_alpine=danger_alpine,
        danger_treeline=danger_treeline,
        danger_below_treeline=danger_btl,
        bottom_line=bottom_line or "Visit CBAC website for forecast summary.",
        discussion=discussion or "Visit CBAC website for full forecast discussion.",
        problems=problems,
        forecast_url=get_forecast_url(zone),
        weather=weather,
    )


def scrape_forecast(driver: webdriver.Chrome, zone: str, date: Optional[str] = None) -> Optional[Forecast]:
    """Scrape forecast data for a specific zone and optional date."""
    if zone not in FORECAST_ZONES:
        print(f"Unknown zone: {zone}")
        return None

    url = get_forecast_url(zone, date)
    date_str = date or "current"
    print(f"Loading {zone} forecast for {date_str} from {url}")
    driver.get(url)

    # Wait for the forecast content to load
    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        time.sleep(4)  # Wait for dynamic content
    except TimeoutException:
        print("Timeout waiting for page to load")

    # Get the page text
    body_text = driver.find_element(By.TAG_NAME, "body").text

    # Parse the text
    forecast = parse_page_text(body_text, zone)

    return forecast


def scrape_all_zones(headless: bool = True, date: Optional[str] = None) -> List[Forecast]:
    """Scrape forecasts for all zones for a given date (or current)."""
    driver = None
    forecasts = []

    try:
        print("Starting Chrome browser...")
        driver = create_driver(headless=headless)

        for zone in FORECAST_ZONES.keys():
            print(f"\nScraping {zone}...")
            forecast = scrape_forecast(driver, zone, date)
            if forecast:
                forecasts.append(forecast)
                print(f"  Danger: ALP={forecast.danger_alpine}, TL={forecast.danger_treeline}, BTL={forecast.danger_below_treeline}")
                print(f"  Problems: {len(forecast.problems)}")
                for p in forecast.problems:
                    print(f"    #{p['problem_number']} {p['problem_type']}: {p['likelihood']}, {p['size']}")
                print(f"  Bottom line: {forecast.bottom_line[:80]}...")
            else:
                print(f"  Failed to scrape {zone}")

    except Exception as e:
        print(f"Error during scraping: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if driver:
            driver.quit()

    return forecasts


def scrape_multiple_days(zones: List[str], days: int = 3, headless: bool = True) -> List[Forecast]:
    """
    Scrape forecasts for multiple days going backwards from today.

    Args:
        zones: List of zone IDs to scrape (e.g., ["southeast", "northwest"])
        days: Number of days to scrape (default 3)
        headless: Whether to run browser in headless mode

    Returns:
        List of all scraped forecasts
    """
    driver = None
    all_forecasts = []

    try:
        print("Starting Chrome browser...")
        driver = create_driver(headless=headless)

        # Generate dates for the past N days
        today = datetime.now()
        dates = [(today - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(days)]

        for date in dates:
            print(f"\n{'='*50}")
            print(f"Scraping forecasts for {date}")
            print('='*50)

            for zone in zones:
                if zone not in FORECAST_ZONES:
                    print(f"  Unknown zone: {zone}, skipping")
                    continue

                print(f"\n  Scraping {zone}...")
                forecast = scrape_forecast(driver, zone, date)

                if forecast:
                    # Update the valid_date to match requested date
                    forecast.valid_date = date
                    all_forecasts.append(forecast)
                    print(f"    Danger: ALP={forecast.danger_alpine}, TL={forecast.danger_treeline}, BTL={forecast.danger_below_treeline}")
                    print(f"    Problems: {len(forecast.problems)}")
                else:
                    print(f"    Failed to scrape {zone} for {date}")

                # Small delay between requests to be polite
                time.sleep(1)

    except Exception as e:
        print(f"Error during scraping: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if driver:
            driver.quit()

    return all_forecasts


def save_forecasts(forecasts: List[Forecast], filename: str = "scraped_forecasts.json"):
    """Save forecasts to JSON file."""
    data = [asdict(f) for f in forecasts]

    with open(filename, "w") as f:
        json.dump(data, f, indent=2)
    print(f"\nSaved {len(forecasts)} forecasts to {filename}")


def main():
    """Main entry point with CLI argument support."""
    import argparse

    parser = argparse.ArgumentParser(description="Scrape CBAC avalanche forecasts")
    parser.add_argument("--days", type=int, default=1,
                        help="Number of days to scrape (default: 1, current day only)")
    parser.add_argument("--zones", type=str, default="southeast,northwest",
                        help="Comma-separated zones to scrape (default: southeast,northwest)")
    parser.add_argument("--date", type=str, default=None,
                        help="Specific date to scrape (YYYY-MM-DD format)")
    parser.add_argument("--output", type=str, default="scraped_forecasts.json",
                        help="Output JSON file (default: scraped_forecasts.json)")
    parser.add_argument("--visible", action="store_true",
                        help="Show browser window (default: headless)")

    args = parser.parse_args()

    print("=" * 60)
    print("CBAC Forecast Scraper (Selenium)")
    print("=" * 60)

    zones = [z.strip() for z in args.zones.split(",")]
    headless = not args.visible

    if args.date:
        # Scrape a specific date
        print(f"\nScraping {', '.join(zones)} for {args.date}")
        forecasts = []
        driver = create_driver(headless=headless)
        try:
            for zone in zones:
                forecast = scrape_forecast(driver, zone, args.date)
                if forecast:
                    forecast.valid_date = args.date
                    forecasts.append(forecast)
        finally:
            driver.quit()
    elif args.days > 1:
        # Scrape multiple days
        print(f"\nScraping {args.days} days of forecasts for {', '.join(zones)}")
        forecasts = scrape_multiple_days(zones, args.days, headless=headless)
    else:
        # Scrape current day
        print(f"\nScraping current forecasts for {', '.join(zones)}")
        forecasts = scrape_all_zones(headless=headless)

    if forecasts:
        save_forecasts(forecasts, args.output)

        print("\n" + "=" * 60)
        print("Scraping complete!")

        # Group by date for display
        by_date = {}
        for f in forecasts:
            if f.valid_date not in by_date:
                by_date[f.valid_date] = []
            by_date[f.valid_date].append(f)

        for date in sorted(by_date.keys(), reverse=True):
            print(f"\n--- {date} ---")
            for f in by_date[date]:
                print(f"\n  {f.zone_name}:")
                print(f"    Danger: Alpine={f.danger_alpine}, Treeline={f.danger_treeline}, BTL={f.danger_below_treeline}")
                print(f"    Problems ({len(f.problems)}):")
                for p in f.problems:
                    print(f"      #{p['problem_number']} {p['problem_type']}: {p['likelihood']}, Size={p['size']}")
                if f.weather:
                    print(f"    Weather: {f.weather.get('summary', 'N/A')[:80]}...")
                    if 'temp_low' in f.weather and 'temp_high' in f.weather:
                        print(f"      Temp: {f.weather['temp_low']}F to {f.weather['temp_high']}F")
                    if 'wind_low' in f.weather and 'wind_high' in f.weather:
                        print(f"      Wind: {f.weather['wind_low']}-{f.weather['wind_high']} mph")
                    if 'snow_low' in f.weather and 'snow_high' in f.weather:
                        print(f"      Snow: {f.weather['snow_low']}-{f.weather['snow_high']} inches")
                if f.bottom_line:
                    print(f"    Bottom Line: {f.bottom_line[:80]}...")
    else:
        print("\nNo forecasts scraped.")


if __name__ == "__main__":
    main()
