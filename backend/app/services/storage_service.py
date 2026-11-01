import os
from pathlib import Path
from typing import Optional
from app.core.minio_client import minio_client
from app.core.config import settings

class StorageService:
    def __init__(self):
        self.client = minio_client

    def store_original_pdf(self, project_id: str, filename: str, file_bytes: bytes) -> str:
        object_key = f"projects/{project_id}/original/{filename}"
        self.client.upload_bytes(object_key, file_bytes, content_type="application/pdf")
        return object_key

    def store_page_image(self, project_id: str, img_name: str, file_path: str) -> str:
        object_key = f"projects/{project_id}/pages/{img_name}"
        self.client.upload_file(object_key, file_path, content_type="image/jpeg")
        return object_key

    def store_export_archive(self, project_id: str, zip_name: str, zip_path: str) -> str:
        object_key = f"projects/{project_id}/exports/{zip_name}"
        self.client.upload_file(object_key, zip_path, content_type="application/zip")
        return object_key

    def get_download_url(self, object_key: str, expires_seconds: int = 3600) -> str:
        return self.client.get_presigned_url(object_key, expires_seconds=expires_seconds)

storage_service = StorageService()
