from typing import Optional
from pydantic import BaseModel, ConfigDict

class PipelineStageStatus(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    status: str # 'pending', 'running', 'completed', 'failed'
    progress: int # 0 - 100
    errorMessage: Optional[str] = None
