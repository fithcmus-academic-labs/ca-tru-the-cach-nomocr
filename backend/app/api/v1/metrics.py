from fastapi import APIRouter
from app.schemas.metric import MetricsSummaryResponse
from app.services.project_service import project_store

router = APIRouter()

@router.get("/{project_id}/metrics", response_model=MetricsSummaryResponse)
def get_metrics(project_id: str):
    return project_store.get_metrics()
