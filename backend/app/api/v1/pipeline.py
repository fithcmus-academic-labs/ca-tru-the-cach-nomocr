from typing import List
from fastapi import APIRouter
from app.schemas.pipeline import PipelineStageStatus
from app.services.pipeline_service import pipeline_service

router = APIRouter()

@router.get("/{project_id}/pipeline", response_model=List[PipelineStageStatus])
def get_pipeline_status(project_id: str):
    return pipeline_service.get_stages_status(project_id)

@router.post("/{project_id}/pipeline/{stage_id}/run", response_model=List[PipelineStageStatus])
def run_pipeline_stage(project_id: str, stage_id: str):
    pipeline_service.execute_stage(project_id, stage_id)
    return pipeline_service.get_stages_status(project_id)
