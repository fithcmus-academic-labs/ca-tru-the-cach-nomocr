from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from pathlib import Path

from app.schemas.pipeline import PipelineStageStatus
from app.services.pipeline_service import pipeline_service
from core.config import BOOKS
from core.classifier import BookClassifier

router = APIRouter()

class PipelineRunRequest(BaseModel):
    book_key: Optional[str] = "AB_160"

@router.get("/{project_id}/pipeline", response_model=List[PipelineStageStatus])
def get_pipeline_status(project_id: str):
    return pipeline_service.get_stages_status(project_id)

@router.post("/{project_id}/pipeline/{stage_id}/run", response_model=List[PipelineStageStatus])
def run_pipeline_stage(project_id: str, stage_id: str):
    pipeline_service.execute_stage(project_id, stage_id)
    return pipeline_service.get_stages_status(project_id)

@router.post("/pipeline/run")
@router.post("/{project_id}/pipeline/run")
def run_full_pipeline_endpoint(payload: PipelineRunRequest = PipelineRunRequest()):
    book_key = payload.book_key or "AB_160"
    if book_key not in BOOKS:
        raise HTTPException(status_code=400, detail=f"Unknown book key: {book_key}")
    success = pipeline_service.run_full_pipeline(book_key)
    if not success:
        raise HTTPException(status_code=500, detail=f"Pipeline execution failed for {book_key}")
    return {
        "status": "success",
        "message": f"Pipeline completed successfully for {BOOKS[book_key]['title']}",
        "book_key": book_key
    }

@router.post("/pipeline/ocr-transliterate")
@router.post("/ocr/recognize")
async def ocr_transliterate_endpoint(
    file: Optional[UploadFile] = File(None),
    image_path: Optional[str] = Form(None)
):
    target_path = image_path
    if file and file.filename:
        temp_dir = Path("output/temp_uploads")
        temp_dir.mkdir(parents=True, exist_ok=True)
        save_path = temp_dir / file.filename
        with open(save_path, "wb") as f_out:
            content = await file.read()
            f_out.write(content)
        target_path = str(save_path)

    if not target_path or not Path(target_path).exists():
        raise HTTPException(status_code=400, detail="Valid file upload or existing image_path required")

    try:
        res = pipeline_service.run_cloud_ocr_and_transliteration(target_path)
        return {
            "status": "success",
            "server_file_name": res.get("server_file_name"),
            "total_lines": res.get("total_lines", 0),
            "lines": res.get("lines", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloud OCR error: {str(e)}")

@router.post("/pipeline/classify-book")
@router.post("/books/classify")
async def classify_book_endpoint(
    file: Optional[UploadFile] = File(None),
    pdf_path: Optional[str] = Form(None)
):
    target_path = pdf_path
    if file and file.filename:
        temp_dir = Path("output/temp_uploads")
        temp_dir.mkdir(parents=True, exist_ok=True)
        save_path = temp_dir / file.filename
        with open(save_path, "wb") as f_out:
            content = await file.read()
            f_out.write(content)
        target_path = str(save_path)

    if not target_path or not Path(target_path).exists():
        raise HTTPException(status_code=400, detail="Valid PDF file or pdf_path required")

    try:
        classifier = BookClassifier()
        report = classifier.classify(target_path)
        return {
            "status": "success",
            "pdf_name": Path(target_path).name,
            **report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification error: {str(e)}")
