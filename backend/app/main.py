import os
import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Add repository root to sys.path so core and backend are importable
root_path = Path(__file__).resolve().parent.parent.parent
if str(root_path) not in sys.path:
    sys.path.insert(0, str(root_path))
backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.core.config import settings
from app.api.v1.router import api_router
from app.services.project_service import project_store

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("sinonom_backend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Sino-Nom Parallel Corpus Backend Engine...")
    logger.info(f"Loaded active project: {project_store.book_name}")
    logger.info(f"Total alignment records: {len(project_store.records)}")
    yield
    logger.info("Shutting down Sino-Nom Backend Engine...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise 4-Tier Backend & Orchestrator for Sino-Nom Parallel Corpus Digitization",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for document scans and crops
output_dir = settings.OUTPUT_DIR
if output_dir.exists():
    app.mount("/static/output", StaticFiles(directory=str(output_dir)), name="output")

# Include API Router at /api/v1 and /api
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(api_router, prefix="/api")

@app.get("/health", tags=["system"])
@app.get("/api/health", tags=["system"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "active_book": project_store.book_name,
        "total_records": len(project_store.records)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
