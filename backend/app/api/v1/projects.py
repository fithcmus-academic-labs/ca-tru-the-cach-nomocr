from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.schemas.project import ProjectCreate, ProjectResponse
from app.services.project_service import project_store

router = APIRouter()

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str):
    meta = project_store.get_metadata()
    return meta

@router.post("", response_model=ProjectResponse)
def create_project(payload: ProjectCreate):
    meta = project_store.get_metadata()
    meta["bookName"] = payload.bookName
    meta["studentIds"] = payload.studentIds
    return meta

@router.get("", response_model=List[ProjectResponse])
def list_projects():
    return [project_store.get_metadata()]
