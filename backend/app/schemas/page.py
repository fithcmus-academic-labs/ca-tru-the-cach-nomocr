from typing import Optional
from pydantic import BaseModel, ConfigDict

class PageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    pageNumber: int
    pageId: str
    imgName: str
    imageUrl: str
    category: str
    reviewStatus: str
    width: int
    height: int
    detectedChRegions: int
    detectedViRegions: int
    mismatchedCount: int
