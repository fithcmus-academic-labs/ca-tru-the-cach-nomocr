from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

class ProjectBase(BaseModel):
    bookName: str = Field(..., description="Academic book name, e.g. Ca Trù Thê Cách, AB 160, Nôm_Y")
    studentIds: List[str] = Field(default_factory=list, description="List of student IDs, e.g. ['21120001', '21120002']")

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    bookName: str
    studentIds: List[str]
    originalPdfName: str
    originalPdfSize: int
    totalPages: int
    status: str
    createdAt: datetime
    updatedAt: datetime
