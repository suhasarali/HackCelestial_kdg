from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId

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
    
    # Corrected method for Pydantic v2 schema generation
    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        return handler(core_schema)

class AnalysisModel(BaseModel):
    # Set the default value to None to make it truly optional on creation
    id: Optional[PyObjectId] = Field(None, alias='_id')
    user_id: str = Field(...)  # Assuming user_id is a string from 'fishername'
    fish_class: str = Field(...)
    location: dict = Field(...) # store lat and lon as a nested dictionary
    qty_captured: int = Field(...)
    total_price: float = Field(...)
    weight_kg: float = Field(...)

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
