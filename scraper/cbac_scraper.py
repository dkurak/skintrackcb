"""
CBAC Forecast Scraper

Scrapes avalanche forecast data from the Crested Butte Avalanche Center website.
Uses Playwright for JavaScript rendering since the forecast data is loaded dynamically.
"""

import asyncio
import json
import re
from datetime import datetime
from typing import Optional, Tuple
from dataclasses import dataclass, asdict
from playwright.async_api import async_playwright

# URLs for CBAC forecast pages
CBAC_BASE_URL = "https://cbavalanchecenter.org"
FORECAST_ZONES = {
    "northwest": "/forecast/northwest-mountains/",
    "southeast": "/forecast/southeast-mountains/",
}

# Danger level mapping
DANGER_LEVELS = {
    "low": 1,
    "moderate": 2,
    "considerable": 3,
    "high": 4,
    "extreme": 5,
}

# Keywords for sentiment/trend analysis
WORSENING_KEYWORDS = [
    "increasing", "rising", "storm", "loading", "incoming", "developing",
    "widespread", "very likely", "almost certain", "avoid", "dangerous",
    "critical", "heightened", "elevated", "significant"
]

IMPROVING_KEYWORDS = [
    "decreasing", "improving", "settling", "stabilizing", "bonding",
    "less likely", "isolated", "reduced", "favorable", "moderate"
]

STEADY_KEYWORDS = [
    "similar", "unchanged", "persistent", "continues", "remains",
    "same as", "little change", "consistent"
]

NEW_PROBLEM_KEYWORDS = [
    "new", "fresh", "recent", "overnight", "developing", "emerged",
    "storm slab", "wind slab", "new snow"
]


@dataclass
class AspectElevationRose:
    """Represents which aspects/elevations are affected by a problem."""
    N: dict
    NE: dict
    E: dict
    SE: dict
    S: dict
    SW: dict
    W: dict
    NW: dict


@dataclass
class AvalancheProblem:
    """Represents a single avalanche problem."""
    problem_number: int
    problem_type: str
    likelihood: str
    size: str
    aspect_elevation_rose: dict
    details: Optional[str] = None


@dataclass
class Forecast:
    """Represents a complete avalanche forecast."""
    zone: str
    issue_date: str
    valid_date: str
    danger_alpine: int
    danger_treeline: int
    danger_below_treeline: int
    travel_advice: str
    bottom_line: str
    discussion: str
    problems: list
    trend: str
    key_message: str
    confidence: Optional[str]
    recent_activity_summary: Optional[str]
    recent_avalanche_count: int
    raw_html: str


def analyze_sentiment(text: str) -> Tuple[str, str]:
    """
    Analyze forecast text to determine trend and extract key message.

    Returns:
        Tuple of (trend, key_message)
    """
    text_lower = text.lower()

    # Count keyword matches
    worsening_count = sum(1 for kw in WORSENING_KEYWORDS if kw in text_lower)
    improving_count = sum(1 for kw in IMPROVING_KEYWORDS if kw in text_lower)
    steady_count = sum(1 for kw in STEADY_KEYWORDS if kw in text_lower)
    new_problem_count = sum(1 for kw in NEW_PROBLEM_KEYWORDS if kw in text_lower)

    # Determine trend
    if new_problem_count >= 2 or "storm" in text_lower:
        trend = "storm_incoming"
    elif worsening_count > improving_count + 2:
        trend = "worsening"
    elif improving_count > worsening_count + 2:
        trend = "improving"
    else:
        trend = "steady"

    # Extract key message - look for sentences with critical keywords
    sentences = re.split(r'[.!]', text)
    key_message = ""

    critical_patterns = [
        r'avoid\s+\w+',
        r'stay\s+(below|under|off|away)',
        r'dangerous\s+\w+',
        r'do\s+not\s+\w+',
        r'(human|natural)\s+trigger',
        r'weak\s+layer',
    ]

    for sentence in sentences:
        sentence = sentence.strip()
        if len(sentence) < 10:
            continue
        for pattern in critical_patterns:
            if re.search(pattern, sentence.lower()):
                key_message = sentence
                break
        if key_message:
            break

    # If no critical message found, use first meaningful sentence
    if not key_message:
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) > 30:
                key_message = sentence
                break

    return trend, key_message


def extract_slope_angle(text: str) -> Optional[str]:
    """Extract slope angle recommendations from text."""
    patterns = [
        r'(\d+)\s*degrees?',
        r'slopes?\s*(over|above|greater\s+than|steeper\s+than)\s*(\d+)',
        r'(under|below|less\s+than)\s*(\d+)\s*degrees?',
    ]

    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            return match.group(0)
    return None


async def scrape_forecast(zone: str) -> Optional[Forecast]:
    """
    Scrape the forecast for a specific zone.
    """
    if zone not in FORECAST_ZONES:
        raise ValueError(f"Unknown zone: {zone}. Must be one of {list(FORECAST_ZONES.keys())}")

    url = CBAC_BASE_URL + FORECAST_ZONES[zone]

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            print(f"Fetching forecast from {url}")
            await page.goto(url, wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(3000)

            html = await page.content()
            forecast_data = await extract_forecast_data(page, zone)

            if forecast_data:
                forecast_data.raw_html = html
                return forecast_data

            return None

        except Exception as e:
            print(f"Error scraping {zone} forecast: {e}")
            return None
        finally:
            await browser.close()


async def extract_forecast_data(page, zone: str) -> Optional[Forecast]:
    """
    Extract forecast data from the loaded page.
    """
    try:
        # Initialize default values
        danger_alpine = 2
        danger_treeline = 2
        danger_below_treeline = 1
        travel_advice = ""
        bottom_line = ""
        discussion = ""
        problems = []

        # Try multiple selectors for danger ratings
        danger_selectors = [
            '.danger-rating',
            '[class*="danger"]',
            '.forecast-danger',
            '.avalanche-danger',
        ]

        # Extract danger levels from danger pyramid/display
        for selector in danger_selectors:
            danger_els = await page.query_selector_all(selector)
            if danger_els:
                # Parse danger levels from elements
                for el in danger_els:
                    text = await el.inner_text()
                    text_lower = text.lower()

                    for danger_name, danger_level in DANGER_LEVELS.items():
                        if danger_name in text_lower:
                            if 'alpine' in text_lower:
                                danger_alpine = danger_level
                            elif 'treeline' in text_lower:
                                danger_treeline = danger_level
                            elif 'below' in text_lower:
                                danger_below_treeline = danger_level
                break

        # Extract travel advice - this is the key new section
        travel_selectors = [
            '[class*="travel-advice"]',
            '[class*="travel_advice"]',
            '.travel-advice',
            'h2:has-text("Travel Advice") + *',
            'h3:has-text("Travel Advice") + *',
            '[id*="travel"]',
        ]

        for selector in travel_selectors:
            try:
                travel_el = await page.query_selector(selector)
                if travel_el:
                    travel_advice = await travel_el.inner_text()
                    travel_advice = travel_advice.strip()
                    if travel_advice:
                        break
            except:
                continue

        # If no dedicated travel advice section, try to extract from discussion
        if not travel_advice:
            # Look for paragraphs that contain travel recommendations
            all_paragraphs = await page.query_selector_all('p')
            for p in all_paragraphs:
                text = await p.inner_text()
                text_lower = text.lower()
                if any(kw in text_lower for kw in ['avoid', 'stay off', 'stay below', 'travel advice', 'recommended']):
                    travel_advice = text.strip()
                    break

        # Extract bottom line
        bottom_line_selectors = [
            '[class*="bottom-line"]',
            '[class*="bottomline"]',
            '.forecast-summary',
            '.summary',
            'h2:has-text("Bottom Line") + *',
            'h3:has-text("Bottom Line") + *',
        ]

        for selector in bottom_line_selectors:
            try:
                bl_el = await page.query_selector(selector)
                if bl_el:
                    bottom_line = await bl_el.inner_text()
                    bottom_line = bottom_line.strip()
                    if bottom_line:
                        break
            except:
                continue

        # Extract discussion
        discussion_selectors = [
            '[class*="discussion"]',
            '[class*="forecast-discussion"]',
            '.discussion',
            'h2:has-text("Discussion") + *',
        ]

        for selector in discussion_selectors:
            try:
                disc_el = await page.query_selector(selector)
                if disc_el:
                    discussion = await disc_el.inner_text()
                    discussion = discussion.strip()
                    if discussion:
                        break
            except:
                continue

        # Extract avalanche problems
        problem_selectors = [
            '[class*="avalanche-problem"]',
            '[class*="problem-card"]',
            '.problem',
            '[class*="problem"]',
        ]

        for selector in problem_selectors:
            problem_els = await page.query_selector_all(selector)
            if problem_els:
                for i, el in enumerate(problem_els):
                    try:
                        problem_text = await el.inner_text()

                        # Try to determine problem type
                        problem_type = "unknown"
                        problem_types = [
                            ("persistent slab", "persistent_slab"),
                            ("wind slab", "wind_slab"),
                            ("storm slab", "storm_slab"),
                            ("wet slab", "wet_slab"),
                            ("loose dry", "loose_dry"),
                            ("loose wet", "loose_wet"),
                            ("cornice", "cornice"),
                            ("glide", "glide"),
                        ]

                        for name, ptype in problem_types:
                            if name in problem_text.lower():
                                problem_type = ptype
                                break

                        # Try to extract likelihood
                        likelihood = "Possible"
                        likelihood_levels = ["unlikely", "possible", "likely", "very likely", "almost certain"]
                        for level in likelihood_levels:
                            if level in problem_text.lower():
                                likelihood = level.title()
                                break

                        # Try to extract size
                        size = "D2"
                        size_match = re.search(r'D(\d)(?:-D?(\d))?', problem_text)
                        if size_match:
                            size = size_match.group(0)

                        # Build aspect/elevation rose (placeholder - needs refinement based on actual HTML)
                        aspect_rose = {
                            "N": {"alpine": False, "treeline": False, "below_treeline": False},
                            "NE": {"alpine": False, "treeline": False, "below_treeline": False},
                            "E": {"alpine": False, "treeline": False, "below_treeline": False},
                            "SE": {"alpine": False, "treeline": False, "below_treeline": False},
                            "S": {"alpine": False, "treeline": False, "below_treeline": False},
                            "SW": {"alpine": False, "treeline": False, "below_treeline": False},
                            "W": {"alpine": False, "treeline": False, "below_treeline": False},
                            "NW": {"alpine": False, "treeline": False, "below_treeline": False},
                        }

                        # Try to detect aspects mentioned
                        aspects = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
                        for aspect in aspects:
                            if re.search(rf'\b{aspect}\b', problem_text):
                                aspect_rose[aspect] = {"alpine": True, "treeline": True, "below_treeline": True}

                        problem = AvalancheProblem(
                            problem_number=i + 1,
                            problem_type=problem_type,
                            likelihood=likelihood,
                            size=size,
                            aspect_elevation_rose=aspect_rose,
                            details=problem_text[:500] if problem_text else None
                        )
                        problems.append(asdict(problem))
                    except Exception as e:
                        print(f"Error parsing problem {i}: {e}")
                        continue
                break

        # Analyze sentiment from combined text
        combined_text = f"{travel_advice} {bottom_line} {discussion}"
        trend, key_message = analyze_sentiment(combined_text)

        # If we found a slope angle recommendation, include it in key message
        slope_angle = extract_slope_angle(combined_text)
        if slope_angle and slope_angle not in key_message:
            key_message = f"{key_message} ({slope_angle})"

        # Get dates
        today = datetime.now().strftime("%Y-%m-%d")

        return Forecast(
            zone=zone,
            issue_date=today,
            valid_date=today,
            danger_alpine=danger_alpine,
            danger_treeline=danger_treeline,
            danger_below_treeline=danger_below_treeline,
            travel_advice=travel_advice or "Travel advice not available",
            bottom_line=bottom_line or "Summary not available",
            discussion=discussion or "Discussion not available",
            problems=problems,
            trend=trend,
            key_message=key_message or "Check full forecast for details",
            confidence=None,
            recent_activity_summary=None,
            recent_avalanche_count=0,
            raw_html=""
        )

    except Exception as e:
        print(f"Error extracting forecast data: {e}")
        import traceback
        traceback.print_exc()
        return None


async def scrape_all_zones():
    """Scrape forecasts for all zones."""
    forecasts = []
    for zone in FORECAST_ZONES.keys():
        forecast = await scrape_forecast(zone)
        if forecast:
            forecasts.append(forecast)
            print(f"Successfully scraped {zone} forecast")
            print(f"  Trend: {forecast.trend}")
            print(f"  Key Message: {forecast.key_message[:100]}...")
        else:
            print(f"Failed to scrape {zone} forecast")
    return forecasts


def save_to_json(forecasts: list, filename: str = "forecasts.json"):
    """Save forecasts to a JSON file for debugging/backup."""
    data = [asdict(f) for f in forecasts]
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Saved {len(forecasts)} forecasts to {filename}")


@dataclass
class DailyObservationSummary:
    """Summary of observations for a single day."""
    date: str
    total_observations: int
    avalanche_count: int
    red_flags_count: int  # cracking, whumpfing, shooting cracks
    locations: list


@dataclass
class ObservationTrend:
    """Trend analysis from observation data."""
    period_days: int
    daily_counts: list  # List of (date, count) tuples
    trend: str  # 'increasing', 'decreasing', 'stable'
    total_avalanches: int
    notable_locations: list


def calculate_trend(daily_counts: list) -> str:
    """Calculate trend from a list of daily observation counts."""
    if len(daily_counts) < 3:
        return "insufficient_data"

    counts = [c[1] for c in daily_counts]

    # Calculate simple moving trend
    first_half = sum(counts[:len(counts)//2])
    second_half = sum(counts[len(counts)//2:])

    if second_half > first_half * 1.5:
        return "increasing"
    elif first_half > second_half * 1.5:
        return "decreasing"
    else:
        return "stable"


async def scrape_observations(days: int = 7) -> Optional[ObservationTrend]:
    """
    Scrape observation data from CBAC for trend analysis.

    Args:
        days: Number of days to look back

    Returns:
        ObservationTrend with daily counts and trend analysis
    """
    from datetime import timedelta

    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    # Format dates for URL
    start_str = start_date.strftime("%Y-%m-%d")
    end_str = end_date.strftime("%Y-%m-%d")
    season = end_date.strftime("%Y")

    url = f"{CBAC_BASE_URL}/view-observations/#/view/avalanches?startDate={start_str}&endDate={end_str}&season={season}"

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Capture API responses
        api_data = []

        async def handle_response(response):
            if 'api' in response.url or 'observation' in response.url.lower():
                try:
                    data = await response.json()
                    api_data.append(data)
                except:
                    pass

        page.on('response', handle_response)

        try:
            print(f"Fetching observations from {url}")
            await page.goto(url, wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(5000)  # Wait for SPA to load data

            # Try to extract data from the page
            daily_counts = []
            total_avalanches = 0
            locations = set()

            # Try to find observation cards or list items
            observation_selectors = [
                '[class*="observation"]',
                '[class*="card"]',
                '.list-item',
                'tr',
            ]

            for selector in observation_selectors:
                obs_els = await page.query_selector_all(selector)
                if obs_els and len(obs_els) > 1:
                    # Parse observation elements
                    for el in obs_els:
                        try:
                            text = await el.inner_text()
                            text_lower = text.lower()

                            # Check if it's an avalanche observation
                            if 'avalanche' in text_lower:
                                total_avalanches += 1

                            # Try to extract location
                            location_patterns = [
                                r'(gothic|irwin|kebler|cement|carbon|brush|pearl|paradise|washington)',
                            ]
                            for pattern in location_patterns:
                                match = re.search(pattern, text_lower)
                                if match:
                                    locations.add(match.group(0).title())
                        except:
                            continue
                    break

            # If we captured API data, parse it
            if api_data:
                for data in api_data:
                    if isinstance(data, list):
                        # Assume list of observations
                        for obs in data:
                            if isinstance(obs, dict):
                                # Extract date and count
                                obs_date = obs.get('date') or obs.get('observation_date')
                                if obs_date:
                                    # Normalize date
                                    if isinstance(obs_date, str):
                                        obs_date = obs_date[:10]  # YYYY-MM-DD
                                    daily_counts.append((obs_date, 1))

            # Aggregate by day
            date_counts = {}
            for date, count in daily_counts:
                date_counts[date] = date_counts.get(date, 0) + count

            aggregated_counts = sorted(date_counts.items())

            trend = calculate_trend(aggregated_counts) if aggregated_counts else "insufficient_data"

            return ObservationTrend(
                period_days=days,
                daily_counts=aggregated_counts,
                trend=trend,
                total_avalanches=total_avalanches,
                notable_locations=list(locations)
            )

        except Exception as e:
            print(f"Error scraping observations: {e}")
            import traceback
            traceback.print_exc()
            return None
        finally:
            await browser.close()


async def main():
    """Main entry point for the scraper."""
    print("Starting CBAC forecast scraper...")
    print("=" * 50)

    # Test forecast scraping
    forecast = await scrape_forecast("southeast")

    if forecast:
        print("\nForecast extracted:")
        print(f"  Zone: {forecast.zone}")
        print(f"  Date: {forecast.valid_date}")
        print(f"  Danger: ALP={forecast.danger_alpine}, TL={forecast.danger_treeline}, BTL={forecast.danger_below_treeline}")
        print(f"  Travel Advice: {forecast.travel_advice[:200]}..." if len(forecast.travel_advice) > 200 else f"  Travel Advice: {forecast.travel_advice}")
        print(f"  Bottom Line: {forecast.bottom_line[:100]}..." if len(forecast.bottom_line) > 100 else f"  Bottom Line: {forecast.bottom_line}")
        print(f"  Trend: {forecast.trend}")
        print(f"  Key Message: {forecast.key_message}")
        print(f"  Problems: {len(forecast.problems)}")

        save_to_json([forecast], "test_forecast.json")
    else:
        print("Failed to extract forecast")

    # Test observation scraping
    print("\n" + "-" * 50)
    print("Fetching observations for trend analysis...")

    obs_trend = await scrape_observations(days=7)

    if obs_trend:
        print(f"\nObservation Trend (last {obs_trend.period_days} days):")
        print(f"  Trend: {obs_trend.trend}")
        print(f"  Total avalanches: {obs_trend.total_avalanches}")
        print(f"  Notable locations: {', '.join(obs_trend.notable_locations) or 'None identified'}")
        print(f"  Daily counts: {obs_trend.daily_counts}")
    else:
        print("Failed to extract observations")

    print("\n" + "=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
