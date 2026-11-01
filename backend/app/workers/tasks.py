import os
import sys
import logging
from pathlib import Path
from typing import List, Dict, Any

from app.core.celery_app import celery_app
from app.services.evaluator_service import evaluator_service
from app.services.export_service import export_service

logger = logging.getLogger(__name__)

# Define task wrapper that works whether celery is available or not
def task_decorator(func):
    if celery_app:
        return celery_app.task(bind=True)(func)
    return func

@task_decorator
def task_preprocess(self, project_id: str, pdf_path: str):
    logger.info(f"Starting Preprocessing for project {project_id} from {pdf_path}")
    # Render pages, classify categories, red margin detection
    return {"status": "SUCCESS", "project_id": project_id, "stage": "preprocess"}

@task_decorator
def task_ocr(self, project_id: str):
    logger.info(f"Starting Dual OCR Recognition for project {project_id}")
    return {"status": "SUCCESS", "project_id": project_id, "stage": "ocr"}

@task_decorator
def task_align(self, project_id: str):
    logger.info(f"Starting DP Alignment for project {project_id}")
    return {"status": "SUCCESS", "project_id": project_id, "stage": "align"}

@task_decorator
def task_clean(self, project_id: str):
    logger.info(f"Starting Text Cleaning & Normalization for project {project_id}")
    return {"status": "SUCCESS", "project_id": project_id, "stage": "clean"}

@task_decorator
def task_evaluate(self, project_id: str):
    logger.info(f"Starting Phonetic Evaluation for project {project_id}")
    return {"status": "SUCCESS", "project_id": project_id, "stage": "evaluate"}

@task_decorator
def task_export_package(self, project_id: str, student_ids: List[str]):
    logger.info(f"Starting Deliverable Packaging for project {project_id}")
    return {"status": "SUCCESS", "project_id": project_id, "stage": "export_prep"}
