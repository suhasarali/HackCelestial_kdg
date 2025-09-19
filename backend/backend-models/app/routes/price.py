from fastapi import APIRouter, Query, HTTPException
from enum import Enum
from app.services.geolocation import get_state_from_latlon
from app.services.price_loader import load_price_csv, get_avg_price
from app.models.schema import AnalysisModel
from app.routes.analysis import save_analysis
from typing import Optional

router = APIRouter()

# Define allowed price types
class PriceType(str, Enum):
    RETAIL = "Retail"
    FH = "FH"
    FLC = "FLC"

# Load dataset once at startup
PRICE_DF = load_price_csv("data/pricing_dataset.csv")

async def calculate_price(
    species: str,
    weight_kg: float,
    lat: float,
    lon: float,
    price_type: PriceType
):
    """Calculates the price of the detected fish."""
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

async def process_and_save_price_analysis(
    user_id: str,
    species: str,
    qty_captured: int,
    weight_kg: float,
    lat: float,
    lon: float,
    price_type: PriceType
):
    """
    Calculates the price and saves the analysis data to the database.
    This function is called by the detect route.
    """
    try:
        # 1. Calculate price
        price_result = await calculate_price(
            species=species,
            weight_kg=weight_kg,
            lat=lat,
            lon=lon,
            price_type=price_type
        )

        # 2. Prepare data for analysis
        analysis_data = AnalysisModel(
            user_id=user_id,
            fish_class=species,
            location={"lat": lat, "lon": lon},
            qty_captured=qty_captured,
            total_price=price_result.get("total_price"),
            weight_kg=weight_kg
        )

        # 3. Save to database via the analysis route's function
        db_result = await save_analysis(analysis_data)
        
        return {
            "price_details": price_result,
            "db_result": db_result
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# This is an endpoint for direct testing and is not part of the main workflow
@router.post("")
async def calculate_and_save_endpoint(
    user_id: str = Query(...),
    species: str = Query(...),
    qty_captured: int = Query(...),
    weight_kg: float = Query(...),
    lat: float = Query(...),
    lon: float = Query(...),
    price_type: PriceType = Query(...)
):
    return await process_and_save_price_analysis(
        user_id=user_id,
        species=species,
        qty_captured=qty_captured,
        weight_kg=weight_kg,
        lat=lat,
        lon=lon,
        price_type=price_type
    )
