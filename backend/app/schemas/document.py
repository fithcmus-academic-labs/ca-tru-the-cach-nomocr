import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    projectId: str
    filename: str
    fileType: str
    minioKey: str
    fileSize: int
    mimeType: str
    createdAt: datetime
