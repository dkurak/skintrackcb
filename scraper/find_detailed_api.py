"""
Search for detailed forecast API endpoints.
"""

import requests
import json

# More API patterns to try
DETAILED_PATTERNS = [
    # NAC/AFP patterns for detailed forecasts
    "https://api.avalanche.org/v2/public/product/CBAC",
    "https://api.avalanche.org/v2/public/product?center_id=CBAC",
    "https://api.avalanche.org/v2/public/products/CBAC",
    "https://api.avalanche.org/v2/public/avalanche-forecast/CBAC",
    "https://api.avalanche.org/v2/public/forecast/CBAC",

    # Zone-specific
    "https://api.avalanche.org/v2/public/product/2987",  # Northwest Mountains ID from map-layer
    "https://api.avalanche.org/v2/public/product/2988",  # Southeast Mountains ID

    # NWAC-style patterns (since they share the Avy app)
    "https://api.avalanche.org/v1/forecasts/CBAC",
    "https://api.avalanche.org/forecasts/CBAC",

    # Widget/embed patterns
    "https://cbavalanchecenter.org/wp-json/cbac/v1/forecast",
    "https://cbavalanchecenter.org/wp-json/avalanche/v1/forecast",
]

HEADERS = {
    "User-Agent": "CBAC-Tracker-Research/1.0",
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
                # Save if it looks interesting
                print(f"  Content type: JSON")
                if isinstance(data, dict):
                    keys = list(data.keys())
                    print(f"  Keys: {keys}")
                    if 'danger' in str(keys).lower() or 'problem' in str(keys).lower() or 'forecast' in str(keys).lower():
                        print("  *** LOOKS PROMISING! ***")
                        return data
                elif isinstance(data, list) and data:
                    print(f"  Array length: {len(data)}")
                    if isinstance(data[0], dict):
                        print(f"  First item keys: {list(data[0].keys())}")
                return data
            except json.JSONDecodeError:
                content = response.text[:300]
                print(f"  Content type: Not JSON - {content}")

    except requests.RequestException as e:
        print(f"  Error: {e}")

    return None


def main():
    print("=" * 60)
    print("Searching for detailed CBAC forecast API endpoints...")
    print("=" * 60)

    found_apis = []

    for url in DETAILED_PATTERNS:
        result = try_endpoint(url)
        if result:
            found_apis.append((url, result))

    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)

    if found_apis:
        print(f"\nFound {len(found_apis)} working endpoint(s):")
        for url, data in found_apis:
            print(f"\n  URL: {url}")
            if isinstance(data, dict):
                # Print more details
                print(f"  Data preview: {json.dumps(data, indent=2)[:500]}...")


if __name__ == "__main__":
    main()
