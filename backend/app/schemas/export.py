from typing import List, Dict, Any, Optional
from pydantic import BaseModel, ConfigDict

class ValidationCheckItem(BaseModel):
    name: str
    passed: bool
    detail: str

class ValidationReport(BaseModel):
    isValid: bool
    similarityScore: float
    isSimilarityPassed: bool
    checks: List[ValidationCheckItem]

class ExportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    jobId: str
    zipName: str
    downloadUrl: str
    fileSize: int
    validationReport: ValidationReport
