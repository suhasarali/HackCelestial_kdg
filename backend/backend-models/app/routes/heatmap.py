from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def heatmap_route():
    return {"message": "heatmap route working"}
