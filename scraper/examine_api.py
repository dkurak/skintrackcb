"""
Examine the CBAC data from avalanche.org API.
"""

import requests
import json

url = "https://api.avalanche.org/v2/public/products/map-layer/CBAC"

headers = {
    "User-Agent": "CBAC-Tracker-Research/1.0",
    "Accept": "application/json",
}

response = requests.get(url, headers=headers, timeout=10)
data = response.json()

print("Full API Response:")
print("=" * 60)
print(json.dumps(data, indent=2))
