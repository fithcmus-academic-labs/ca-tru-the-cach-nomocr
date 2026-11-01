from fastapi import APIRouter
from app.api.v1 import (
    projects,
    documents,
    pages,
    bounding_boxes,
    alignments,
    pipeline,
    metrics,
    export
)

api_router = APIRouter()

api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(documents.router, prefix="/projects", tags=["documents"])
api_router.include_router(pages.router, prefix="/projects", tags=["pages"])
api_router.include_router(bounding_boxes.router, prefix="", tags=["bounding_boxes"])
api_router.include_router(alignments.router, prefix="", tags=["alignments"])
api_router.include_router(pipeline.router, prefix="/projects", tags=["pipeline"])
api_router.include_router(metrics.router, prefix="/projects", tags=["metrics"])
api_router.include_router(export.router, prefix="/projects", tags=["export"])
