from geopy.geocoders import Nominatim

geolocator = Nominatim(user_agent="fish-price-app")

# Coastal state boundaries (approximate)
COASTAL_STATE_BOUNDS = {
    "Gujarat": {"lat_min": 20.0, "lat_max": 24.0, "lon_min": 68.0, "lon_max": 72.0},
    "Maharashtra": {"lat_min": 15.5, "lat_max": 20.0, "lon_min": 72.0, "lon_max": 74.0},
    "Goa": {"lat_min": 14.0, "lat_max": 15.5, "lon_min": 73.5, "lon_max": 74.5},
    "Karnataka": {"lat_min": 11.5, "lat_max": 14.0, "lon_min": 74.0, "lon_max": 76.0},
    "Kerala": {"lat_min": 8.0, "lat_max": 11.5, "lon_min": 75.0, "lon_max": 77.0},
    "Tamil Nadu": {"lat_min": 8.0, "lat_max": 13.0, "lon_min": 77.0, "lon_max": 80.0},
    "Andhra Pradesh": {"lat_min": 13.0, "lat_max": 19.0, "lon_min": 80.0, "lon_max": 85.0},
    "Odisha": {"lat_min": 19.0, "lat_max": 21.5, "lon_min": 85.0, "lon_max": 87.0},
    "West Bengal": {"lat_min": 21.5, "lat_max": 23.5, "lon_min": 87.0, "lon_max": 89.0},
    "Andaman & Nicobar Islands": {"lat_min": 6.0, "lat_max": 14.0, "lon_min": 92.0, "lon_max": 94.0},
    "Lakshadweep": {"lat_min": 8.0, "lat_max": 12.0, "lon_min": 71.5, "lon_max": 73.5},
    "Puducherry": {"lat_min": 11.5, "lat_max": 12.0, "lon_min": 79.5, "lon_max": 80.0},
    "Daman & Diu": {"lat_min": 20.5, "lat_max": 21.0, "lon_min": 70.0, "lon_max": 71.0},
}



def get_state_from_latlon(lat, lon):
    # Attempt reverse geocoding
    location = geolocator.reverse((lat, lon), language="en", exactly_one=True)
    if location and "state" in location.raw.get("address", {}):
        return location.raw["address"]["state"]

    # Fallback: Check if coordinates fall within coastal state boundaries
    for state, bounds in COASTAL_STATE_BOUNDS.items():
        if bounds["lat_min"] <= lat <= bounds["lat_max"] and bounds["lon_min"] <= lon <= bounds["lon_max"]:
            return state

    return None
