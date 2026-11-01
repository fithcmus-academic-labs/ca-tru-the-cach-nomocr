import uuid
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.storage_service import storage_service
from app.services.project_service import project_store

router = APIRouter()

@router.post("/{project_id}/documents/upload")
async def upload_document(project_id: str, file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    contents = await file.read()
    key = storage_service.store_original_pdf(project_id, file.filename, contents)
    
    return {
        "id": str(uuid.uuid4()),
        "projectId": project_id,
        "filename": file.filename,
        "fileSize": len(contents),
        "minioKey": key,
        "status": "UPLOADED"
    }
