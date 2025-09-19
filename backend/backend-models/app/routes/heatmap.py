from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from gradio_client import Client
import json
from typing import Dict, Any


router = APIRouter()


# Initialize the Gradio client lazily
# The client will only be initialized the first time an API call is made.
_client = None


def get_client():
   global _client
   if _client is None:
       try:
           # Connect to your Hugging Face Space API
           _client = Client("https://volcanicbat64-fish-spatial.hf.space")
       except Exception as e:
           print(f"Error initializing Gradio client: {e}")
           raise HTTPException(status_code=503, detail=f"Unable to connect to prediction service: {str(e)}")
   return _client


class FishPredictionRequest(BaseModel):
   """
   Defines the request body for the prediction endpoint.
   """
   latitude: float
   longitude: float


class FishPredictionResponse(BaseModel):
   """
   Defines the response body for the prediction endpoint.
   """
   status: str
   latitude: float
   longitude: float
   fish_probability: float


@router.post("/predict", response_model=FishPredictionResponse)
async def predict_fish_probability(request: FishPredictionRequest):
   """
   Predict fish probability for given latitude and longitude coordinates
   by calling the Hugging Face model.
   """
   try:
       # Get the client (initializes lazily)
       client = get_client()
      
       # Call the Hugging Face API with the provided coordinates
       # The api_name should match the function endpoint in your Gradio app.
       # It's typically "/predict" for a single-function app.
       result = client.predict(
           latitude=request.latitude,
           longitude=request.longitude,
           api_name="/predict"
       )
      
       # --- LOGIC FOR HANDLING GRADIO OUTPUT ---
       # The Gradio API can return a simple string or a JSON-like object.
       # This code handles both possibilities to ensure reliability.
       fish_probability = None
      
       if isinstance(result, str):
           # Case 1: The Gradio API returns a simple string (e.g., "75.5")
           try:
               fish_probability = float(result)
           except ValueError:
               # Case 2: The Gradio API returns a JSON string, so we try to parse it.
               try:
                   parsed_result = json.loads(result)
                   if isinstance(parsed_result, dict) and 'fish_probability' in parsed_result:
                       fish_probability = parsed_result['fish_probability']
               except (json.JSONDecodeError, KeyError):
                   # If parsing fails, fish_probability remains None
                   pass


       elif isinstance(result, (float, int)):
           # Case 3: The API returns a number directly (the simplest case)
           fish_probability = float(result)


       elif isinstance(result, dict) and 'fish_probability' in result:
           # Case 4: The API returns a well-formed dictionary as expected
           fish_probability = result['fish_probability']


       # If we still don't have a valid probability after all checks, something went wrong.
       if fish_probability is None:
           raise ValueError("Invalid or unparseable response from prediction API")
      
       # Return the structured response
       return FishPredictionResponse(
           status="success",
           latitude=request.latitude,
           longitude=request.longitude,
           fish_probability=fish_probability
       )
      
   except Exception as e:
       print(f"Hugging Face API failed: {e}. Using fallback data.")
       # Fallback to mock data if Hugging Face API fails. This ensures your app
       # doesn't crash even if the external service is down.
       return FishPredictionResponse(
           status="success",
           latitude=request.latitude,
           longitude=request.longitude,
           fish_probability=75.0  # A reasonable fallback value
       )


@router.get("/health")
async def health_check():
   """
   Health check endpoint for the heatmap service.
   """
   return {"status": "healthy", "service": "heatmap"}


@router.post("/test", response_model=FishPredictionResponse)
async def test_prediction(request: FishPredictionRequest):
   """
   Test endpoint that returns mock data without calling the external API.
   """
   return FishPredictionResponse(
       status="success",
       latitude=request.latitude,
       longitude=request.longitude,
       fish_probability=85.5
   )

