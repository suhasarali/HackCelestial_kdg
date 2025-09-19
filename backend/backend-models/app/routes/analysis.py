from fastapi import APIRouter, HTTPException, Depends
from app.db.mongo import db
from app.models.schema import AnalysisModel

router = APIRouter()

@router.post("")
async def save_analysis(analysis_data: AnalysisModel):
    """Saves the final analysis data to the MongoDB 'analysis' collection."""
    try:
        analysis_collection = db.database.get_collection("analysis")
        
        # Convert Pydantic model to a dictionary
        analysis_dict = analysis_data.model_dump(by_alias=True, exclude_unset=True)
        print(analysis_dict)
        
        result = await analysis_collection.insert_one(analysis_dict)
        print(result)
        
        return {
            "success": True,
            "message": "Analysis data saved successfully",
            "inserted_id": str(result.inserted_id)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
