from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def price_route():
    return {"message": "price route working"}
