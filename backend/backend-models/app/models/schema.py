from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId
from datetime import datetime, timezone

# This custom class handles the ObjectId for Pydantic validation
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)
    
    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        return handler(core_schema)

class AnalysisModel(BaseModel):
    id: Optional[PyObjectId] = Field(None, alias='_id')
    user_id: str = Field(...) 
    fish_class: str = Field(...)
    location: dict = Field(...) 
    qty_captured: int = Field(...)
    total_price: float = Field(...)
    weight_kg: float = Field(...)
    
    # --- New Timestamp Field ---
    # default_factory ensures the time is captured at the moment of instantiation
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True  # Allows using '_id' or 'id'
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}