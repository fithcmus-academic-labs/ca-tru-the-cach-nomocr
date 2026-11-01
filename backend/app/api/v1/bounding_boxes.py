from typing import List
from fastapi import APIRouter, HTTPException
from app.schemas.bounding_box import BoundingBoxResponse, BoundingBoxUpdate
from app.services.project_service import project_store

router = APIRouter()

@router.get("/{project_id}/pages/{page_num}/annotations", response_model=List[BoundingBoxResponse])
def get_page_annotations(project_id: str, page_num: int):
    return project_store.get_annotations_for_page(page_num)

@router.put("/bounding_boxes/{box_id}", response_model=BoundingBoxResponse)
def update_bounding_box(box_id: str, payload: BoundingBoxUpdate):
    box = project_store.update_box(box_id, payload.points, payload.transcription)
    if not box:
        raise HTTPException(status_code=404, detail="Bounding box not found")
    return box
