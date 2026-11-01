from typing import List
from fastapi import APIRouter, HTTPException
from app.schemas.page import PageResponse
from app.services.project_service import project_store

router = APIRouter()

@router.get("/{project_id}/pages", response_model=List[PageResponse])
def get_pages(project_id: str):
    return project_store.get_pages()

@router.get("/{project_id}/pages/{page_num}", response_model=PageResponse)
def get_page(project_id: str, page_num: int):
    pages = project_store.get_pages()
    page = next((p for p in pages if p["pageNumber"] == page_num), None)
    if not page:
        raise HTTPException(status_code=404, detail=f"Page {page_num} not found")
    return page
