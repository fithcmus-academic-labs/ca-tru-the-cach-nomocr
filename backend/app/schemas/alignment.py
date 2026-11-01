from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict, Field

class CharStatus(BaseModel):
    char: str
    isMatched: bool
    color: str # 'BLACK' or 'RED'
    reason: Optional[str] = "matched"

class AlignmentRecordBase(BaseModel):
    id: str
    img_id: str
    sentence_id: str # <img_id without .jpg>.<index>
    SinoNom_Char: str
    ChuQN_txt: str
    pageNumber: int
    lineIndex: int
    isMatched: bool
    color: str # 'BLACK' or 'RED'
    charStatuses: List[CharStatus] = Field(default_factory=list)
    reviewStatus: str = "pending" # pending, reviewed, approved
    editorNote: Optional[str] = ""

class AlignmentRecordUpdate(BaseModel):
    SinoNom_Char: Optional[str] = None
    ChuQN_txt: Optional[str] = None
    reviewStatus: Optional[str] = None
    editorNote: Optional[str] = None

class AlignmentRecordResponse(AlignmentRecordBase):
    model_config = ConfigDict(from_attributes=True)
