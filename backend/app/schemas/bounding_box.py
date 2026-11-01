from typing import List, Optional
from pydantic import BaseModel, ConfigDict, field_validator

class BoundingBoxBase(BaseModel):
    id: str
    img_id: str
    sentence_id: str
    region_type: str # 'ch' or 'vi'
    transcription: str = ""
    points: List[List[int]] # Strict [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
    status: str = "matched" # matched, mismatched, unverified

    @field_validator("points")
    @classmethod
    def validate_points(cls, v):
        if len(v) != 4:
            raise ValueError("PPOCRLabel standard strictly requires exactly 4 polygon points")
        for pt in v:
            if len(pt) != 2:
                raise ValueError("Each point must contain exactly [x, y] coordinates")
        return v

class BoundingBoxUpdate(BaseModel):
    points: List[List[int]]
    transcription: Optional[str] = None

    @field_validator("points")
    @classmethod
    def validate_points(cls, v):
        if len(v) != 4:
            raise ValueError("PPOCRLabel standard strictly requires exactly 4 polygon points")
        for pt in v:
            if len(pt) != 2:
                raise ValueError("Each point must contain exactly [x, y] coordinates")
        return v

class BoundingBoxResponse(BoundingBoxBase):
    model_config = ConfigDict(from_attributes=True)
