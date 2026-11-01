import logging
import asyncio
from typing import Dict, Any, List, Optional
from pathlib import Path

from app.core.config import settings
from app.services.evaluator_service import evaluator_service
from app.services.export_service import export_service

logger = logging.getLogger(__name__)

class PipelineService:
    def __init__(self):
        self.stages = [
            {
                "id": "preprocess",
                "name": "1. Document Preprocessing",
                "description": "Render 300 DPI images, classify content/misc/blank, detect T2b margin.",
                "status": "completed",
                "progress": 100
            },
            {
                "id": "ocr",
                "name": "2. Dual OCR Recognition",
                "description": "Recognize Sino-Nom and cursive handwritten Quốc ngữ text lines.",
                "status": "completed",
                "progress": 100
            },
            {
                "id": "align",
                "name": "3. Bilingual Sentence Alignment",
                "description": "Phonetic Dynamic Programming alignment across page boundaries.",
                "status": "completed",
                "progress": 100
            },
            {
                "id": "clean",
                "name": "4. Text Cleaning & PPOCRLabel Prep",
                "description": "Unicode NFC normalization, archaic punctuation mapping, 4-pt BBox extraction.",
                "status": "completed",
                "progress": 100
            },
            {
                "id": "evaluate",
                "name": "5. Quality Evaluation & Color Coding",
                "description": "Evaluate similarity metric (>= 95%) and assign ARGB Black/Red styles.",
                "status": "completed",
                "progress": 100
            },
            {
                "id": "export_prep",
                "name": "6. Export Deliverables Preparation",
                "description": "Package PPOCRLabel Label.txt/fileState.txt, CSV with BOM, and styled XLSX.",
                "status": "completed",
                "progress": 100
            }
        ]

    def get_stages_status(self, project_id: str) -> List[Dict[str, Any]]:
        return self.stages

    def execute_stage(self, project_id: str, stage_id: str):
        """Execute a specific pipeline stage asynchronously."""
        # Find stage
        st = next((s for s in self.stages if s["id"] == stage_id), None)
        if st:
            st["status"] = "running"
            st["progress"] = 50
            # Simulating execution completion
            st["status"] = "completed"
            st["progress"] = 100

pipeline_service = PipelineService()
