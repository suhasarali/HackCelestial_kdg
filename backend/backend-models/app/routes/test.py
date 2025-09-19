import httpx
import json


# IMPORTANT: Replace "your-username" with your actual Hugging Face username
# The URL for your space is in the format: https://[your-username]-fish3.hf.space
SPACE_URL = "https://VolcanicBat64-fish3.hf.space"
PREDICT_URL = f"{SPACE_URL}/predict"


# Define the data payload in the format FastAPI expects
# This matches the PredictionInput model in app.py
payload = {
   "latitude": 18.95,
   "longitude": 72.8321
}


print(f"Attempting to predict fish probability at {payload['latitude']}, {payload['longitude']}")
print(f"Sending POST request to: {PREDICT_URL}")


try:
   # Make a POST request with the JSON payload
   response = httpx.post(
       PREDICT_URL,
       json=payload,
       timeout=30.0
   )
  
   # Check for HTTP status errors (e.g., 404, 500)
   response.raise_for_status()
  
   # Parse the JSON response
   result = response.json()
  
   # Print a success message and the formatted JSON result
   print("\n✅ Prediction Successful!")
   print(json.dumps(result, indent=4))
  
except httpx.HTTPError as e:
   print(f"\n❌ An HTTP error occurred: {e}")
   if response:
       print(f"Server responded with status code {response.status_code}")
       print(f"Server response content: {response.text}")
except json.JSONDecodeError as e:
   print(f"\n❌ Failed to decode JSON response from the server: {e}")
   if response:
       print(f"Server response content was: {response.text}")
except Exception as e:
   print(f"\n❌ An unexpected error occurred: {e}")

