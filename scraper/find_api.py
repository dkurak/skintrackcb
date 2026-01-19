"""
Script to discover CBAC API endpoints.
Tries various common API patterns used by avalanche centers.
"""

import requests
import json

# Common API patterns used by avalanche centers
API_PATTERNS = [
    # National Avalanche Center patterns
    "https://api.avalanche.org/v2/public/products/map-layer/CBAC",
    "https://api.avalanche.org/v2/public/products/map-layer/cbac",
    "https://api.avalanche.org/v2/public/products/map-layer/crested-butte",

    # CAIC patterns
    "https://avalanche.state.co.us/api/v2/forecasts",
    "https://avalanche.state.co.us/api/forecasts/gunnison",

    # Direct WordPress REST API
    "https://cbavalanchecenter.org/wp-json/wp/v2/posts?per_page=5",

    # AFP Platform patterns (used by Avy app)
    "https://api.nwac.us/v1/forecasts",
    "https://api.avalanche.org/v2/public/forecasts/cbac",
]

HEADERS = {
    "User-Agent": "CBAC-Tracker-Research/1.0 (educational project)",
    "Accept": "application/json",
}


def try_endpoint(url):
    """Try to fetch data from an endpoint."""
    print(f"\nTrying: {url}")
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        print(f"  Status: {response.status_code}")

        if response.status_code == 200:
            try:
                data = response.json()
                print(f"  Content type: JSON")
                if isinstance(data, dict):
                    print(f"  Keys: {list(data.keys())[:5]}")
                elif isinstance(data, list):
                    print(f"  Array length: {len(data)}")
                    if data:
                        print(f"  First item keys: {list(data[0].keys())[:5] if isinstance(data[0], dict) else 'not a dict'}")
                return data
            except json.JSONDecodeError:
                print(f"  Content type: Not JSON")
                print(f"  Preview: {response.text[:200]}")
        elif response.status_code == 404:
            print(f"  Not found")
        elif response.status_code == 403:
            print(f"  Forbidden (may need auth)")
        else:
            print(f"  Response: {response.text[:200]}")

    except requests.RequestException as e:
        print(f"  Error: {e}")

    return None


def main():
    print("=" * 60)
    print("Searching for CBAC API endpoints...")
    print("=" * 60)

    found_apis = []

    for url in API_PATTERNS:
        result = try_endpoint(url)
        if result:
            found_apis.append((url, result))

    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)

    if found_apis:
        print(f"\nFound {len(found_apis)} working API(s):")
        for url, data in found_apis:
            print(f"  - {url}")
    else:
        print("\nNo direct API endpoints found.")
        print("CBAC likely uses JavaScript to load forecasts from AFP platform.")
        print("Options:")
        print("  1. Use Playwright/Selenium to render the page")
        print("  2. Contact CBAC about API access")
        print("  3. Parse the raw HTML with BeautifulSoup")


if __name__ == "__main__":
    main()
