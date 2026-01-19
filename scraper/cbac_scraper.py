"""
CBAC Forecast Scraper

Scrapes avalanche forecast data from the Crested Butte Avalanche Center website.
Uses Playwright for JavaScript rendering since the forecast data is loaded dynamically.
"""

import asyncio
import json
import re
from datetime import datetime
from typing import Optional
from dataclasses import dataclass, asdict
from playwright.async_api import async_playwright

# URLs for CBAC forecast pages
CBAC_BASE_URL = "https://cbavalanchecenter.org"
FORECAST_ZONES = {
    "northwest": "/forecasts/northwest-mountains/",
    "southeast": "/forecasts/southeast-mountains/",
}

# Danger level mapping
DANGER_LEVELS = {
    "low": 1,
    "moderate": 2,
    "considerable": 3,
    "high": 4,
    "extreme": 5,
}


@dataclass
class AspectElevationRose:
    """Represents which aspects/elevations are affected by a problem."""
    N: dict  # {"alpine": bool, "treeline": bool, "below_treeline": bool}
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
    bottom_line: str
    discussion: str
    problems: list
    raw_html: str


async def scrape_forecast(zone: str) -> Optional[Forecast]:
    """
    Scrape the forecast for a specific zone.

    Args:
        zone: The zone to scrape ('northwest' or 'southeast')

    Returns:
        A Forecast object or None if scraping fails
    """
    if zone not in FORECAST_ZONES:
        raise ValueError(f"Unknown zone: {zone}. Must be one of {list(FORECAST_ZONES.keys())}")

    url = CBAC_BASE_URL + FORECAST_ZONES[zone]

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            # Navigate to the forecast page
            print(f"Fetching forecast from {url}")
            await page.goto(url, wait_until="networkidle", timeout=30000)

            # Wait for forecast content to load
            # The page may have dynamic content that needs time to render
            await page.wait_for_timeout(3000)

            # Get the page HTML for parsing
            html = await page.content()

            # Extract forecast data
            # Note: The actual selectors will need to be adjusted based on CBAC's page structure
            # This is a placeholder implementation - we'll need to inspect the live page

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

    This function will need to be updated based on CBAC's actual page structure.
    The selectors here are placeholders.
    """
    try:
        # Try to find danger ratings
        # Common patterns: danger pyramid, colored boxes, etc.
        danger_alpine = 2  # placeholder
        danger_treeline = 2
        danger_below_treeline = 1

        # Try to extract bottom line
        bottom_line = ""
        bottom_line_el = await page.query_selector('[class*="bottom-line"], [class*="bottomline"], .forecast-summary')
        if bottom_line_el:
            bottom_line = await bottom_line_el.inner_text()

        # Try to extract discussion
        discussion = ""
        discussion_el = await page.query_selector('[class*="discussion"], [class*="forecast-discussion"]')
        if discussion_el:
            discussion = await discussion_el.inner_text()

        # Extract avalanche problems
        problems = []
        problem_els = await page.query_selector_all('[class*="problem"], [class*="avalanche-problem"]')

        for i, el in enumerate(problem_els):
            problem_text = await el.inner_text()
            # Parse problem details - this needs refinement based on actual HTML
            problem = AvalancheProblem(
                problem_number=i + 1,
                problem_type="unknown",
                likelihood="Unknown",
                size="Unknown",
                aspect_elevation_rose={
                    "N": {"alpine": False, "treeline": False, "below_treeline": False},
                    "NE": {"alpine": False, "treeline": False, "below_treeline": False},
                    "E": {"alpine": False, "treeline": False, "below_treeline": False},
                    "SE": {"alpine": False, "treeline": False, "below_treeline": False},
                    "S": {"alpine": False, "treeline": False, "below_treeline": False},
                    "SW": {"alpine": False, "treeline": False, "below_treeline": False},
                    "W": {"alpine": False, "treeline": False, "below_treeline": False},
                    "NW": {"alpine": False, "treeline": False, "below_treeline": False},
                },
                details=problem_text[:500] if problem_text else None
            )
            problems.append(asdict(problem))

        # Get dates
        today = datetime.now().strftime("%Y-%m-%d")

        return Forecast(
            zone=zone,
            issue_date=today,
            valid_date=today,
            danger_alpine=danger_alpine,
            danger_treeline=danger_treeline,
            danger_below_treeline=danger_below_treeline,
            bottom_line=bottom_line or "Unable to extract bottom line",
            discussion=discussion or "Unable to extract discussion",
            problems=problems,
            raw_html=""
        )

    except Exception as e:
        print(f"Error extracting forecast data: {e}")
        return None


async def scrape_all_zones():
    """Scrape forecasts for all zones."""
    forecasts = []
    for zone in FORECAST_ZONES.keys():
        forecast = await scrape_forecast(zone)
        if forecast:
            forecasts.append(forecast)
            print(f"Successfully scraped {zone} forecast")
        else:
            print(f"Failed to scrape {zone} forecast")
    return forecasts


def save_to_json(forecasts: list, filename: str = "forecasts.json"):
    """Save forecasts to a JSON file for debugging/backup."""
    data = [asdict(f) for f in forecasts]
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Saved {len(forecasts)} forecasts to {filename}")


async def main():
    """Main entry point for the scraper."""
    print("Starting CBAC forecast scraper...")
    print("=" * 50)

    # Test with northwest zone first
    forecast = await scrape_forecast("northwest")

    if forecast:
        print("\nForecast extracted:")
        print(f"  Zone: {forecast.zone}")
        print(f"  Date: {forecast.valid_date}")
        print(f"  Danger: ALP={forecast.danger_alpine}, TL={forecast.danger_treeline}, BTL={forecast.danger_below_treeline}")
        print(f"  Bottom Line: {forecast.bottom_line[:100]}...")
        print(f"  Problems: {len(forecast.problems)}")

        # Save to JSON for inspection
        save_to_json([forecast], "test_forecast.json")
    else:
        print("Failed to extract forecast")

    print("\n" + "=" * 50)
    print("Note: This scraper needs refinement based on CBAC's actual page structure.")
    print("Run with: python cbac_scraper.py")


if __name__ == "__main__":
    asyncio.run(main())
