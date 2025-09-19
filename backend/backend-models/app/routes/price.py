from fastapi import APIRouter, Query, HTTPException
from enum import Enum
from app.services.geolocation import get_state_from_latlon
from app.services.price_loader import load_price_csv, get_avg_price

router = APIRouter()

# Define allowed price types
class PriceType(str, Enum):
    RETAIL = "Retail"
    FH = "FH"
    FLC = "FLC"

# Load dataset once at startup
PRICE_DF = load_price_csv("data/pricing_dataset.csv")

@router.get("")
async def calculate_price(
    species: str = Query(..., description="Detected fish species"),
    weight_kg: float = Query(..., gt=0, description="Weight in kg"),
    lat: float = Query(..., description="User latitude"),
    lon: float = Query(..., description="User longitude"),
    price_type: PriceType = Query(..., description="Choose from: Retail, FH, FLC")
):
    try:
        # Get state from lat/long
        state = get_state_from_latlon(lat, lon)
        if not state:
            raise HTTPException(status_code=400, detail="Could not determine state from coordinates")

        # Get average price
        avg_price = get_avg_price(PRICE_DF, species, state, price_type.value)
        if avg_price is None:
            raise HTTPException(
                status_code=404,
                detail=f"No price found for {species} in {state} ({price_type.value})"
            )

        # Calculate total price
        total_price = round(avg_price * weight_kg, 2)

        # Return result
        return {
            "species": species,
            "state": state,
            "price_type": price_type.value,
            "weight_kg": weight_kg,
            "avg_price": round(avg_price, 2),
            "total_price": total_price
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
