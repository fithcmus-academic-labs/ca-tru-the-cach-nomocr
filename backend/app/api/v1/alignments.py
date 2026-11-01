from typing import List
from fastapi import APIRouter, HTTPException
from app.schemas.alignment import AlignmentRecordResponse, AlignmentRecordUpdate
from app.services.project_service import project_store

router = APIRouter()

@router.get("/{project_id}/alignments", response_model=List[AlignmentRecordResponse])
def get_alignments(project_id: str):
    return project_store.records

@router.patch("/alignments/{record_id}", response_model=AlignmentRecordResponse)
def update_alignment(record_id: str, payload: AlignmentRecordUpdate):
    updates = payload.model_dump(exclude_unset=True)
    rec = project_store.update_alignment(record_id, updates)
    if not rec:
        raise HTTPException(status_code=404, detail="Alignment record not found")
    return rec
