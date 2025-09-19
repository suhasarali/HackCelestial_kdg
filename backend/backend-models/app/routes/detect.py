from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def detect_route():
    return {"message": "detect route working"}
