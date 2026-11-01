import os
import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.core.config import settings
from app.services.project_service import project_store
from app.services.export_service import export_service
from app.services.storage_service import storage_service
from app.schemas.export import ValidationReport

router = APIRouter()

@router.get("/{project_id}/export/validate", response_model=ValidationReport)
def validate_deliverables(project_id: str):
    book_dir = settings.OUTPUT_DIR / project_store.book_name
    report = export_service.validate_deliverable_structure(
        book_dir=book_dir,
        book_name=project_store.book_name,
        records=project_store.records
    )
    return report

@router.post("/{project_id}/export")
def export_and_download(project_id: str):
    book_dir = settings.OUTPUT_DIR / project_store.book_name
    report = export_service.validate_deliverable_structure(
        book_dir=book_dir,
        book_name=project_store.book_name,
        records=project_store.records
    )

    student_prefix = "_".join(project_store.student_ids)
    zip_filename = f"{student_prefix}.zip"
    zip_path = settings.OUTPUT_DIR / zip_filename

    # Package ZIP
    export_service.package_deliverable_zip(
        book_dir=book_dir,
        book_name=project_store.book_name,
        student_ids=project_store.student_ids,
        output_zip_path=zip_path
    )

    # Store in object storage
    try:
        storage_service.store_export_archive(project_id, zip_filename, str(zip_path))
    except Exception:
        pass

    return FileResponse(
        path=str(zip_path),
        filename=zip_filename,
        media_type="application/zip",
        headers={"X-Validation-Valid": str(report["isValid"])}
    )
