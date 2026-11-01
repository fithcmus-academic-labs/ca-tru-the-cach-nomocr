import io
import os
import logging
from pathlib import Path
from typing import Optional, BinaryIO
from datetime import timedelta

from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    from minio import Minio
    from minio.error import S3Error
    MINIO_LIB_AVAILABLE = True
except ImportError:
    MINIO_LIB_AVAILABLE = False
    Minio = None
    S3Error = Exception

class MinioClientWrapper:
    def __init__(self):
        self.client: Optional[Minio] = None
        self.bucket = settings.MINIO_BUCKET_NAME
        self.fallback_dir = settings.BASE_DIR / "data" / "minio_fallback"
        self._initialize()

    def _initialize(self):
        if not MINIO_LIB_AVAILABLE:
            logger.warning("MinIO library not installed. Operating in local filesystem fallback mode.")
            self.fallback_dir.mkdir(parents=True, exist_ok=True)
            return

        try:
            self.client = Minio(
                endpoint=settings.MINIO_ENDPOINT,
                access_key=settings.MINIO_ACCESS_KEY,
                secret_key=settings.MINIO_SECRET_KEY,
                secure=settings.MINIO_SECURE
            )
            # Ensure bucket exists
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
                logger.info(f"Created MinIO bucket: {self.bucket}")
        except Exception as e:
            logger.warning(f"Could not connect to MinIO ({settings.MINIO_ENDPOINT}): {e}. Using local fallback.")
            self.client = None
            self.fallback_dir.mkdir(parents=True, exist_ok=True)

    def upload_file(self, object_name: str, file_path: str, content_type: str = "application/octet-stream") -> str:
        """Upload a file from local disk to object storage."""
        if self.client:
            try:
                self.client.fput_object(
                    bucket_name=self.bucket,
                    object_name=object_name,
                    file_path=file_path,
                    content_type=content_type
                )
                return object_name
            except Exception as e:
                logger.error(f"MinIO fput_object failed for {object_name}: {e}")

        # Local fallback
        dest = self.fallback_dir / object_name
        dest.parent.mkdir(parents=True, exist_ok=True)
        import shutil
        shutil.copyfile(file_path, dest)
        return object_name

    def upload_bytes(self, object_name: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        """Upload raw bytes to object storage."""
        if self.client:
            try:
                stream = io.BytesIO(data)
                self.client.put_object(
                    bucket_name=self.bucket,
                    object_name=object_name,
                    data=stream,
                    length=len(data),
                    content_type=content_type
                )
                return object_name
            except Exception as e:
                logger.error(f"MinIO put_object failed for {object_name}: {e}")

        dest = self.fallback_dir / object_name
        dest.parent.mkdir(parents=True, exist_ok=True)
        with open(dest, "wb") as f:
            f.write(data)
        return object_name

    def get_presigned_url(self, object_name: str, expires_seconds: int = 3600) -> str:
        """Generate a presigned GET URL for an object."""
        if self.client:
            try:
                return self.client.presigned_get_object(
                    bucket_name=self.bucket,
                    object_name=object_name,
                    expires=timedelta(seconds=expires_seconds)
                )
            except Exception as e:
                logger.warning(f"Could not generate presigned URL for {object_name}: {e}")

        # Fallback to direct static path
        return f"/api/v1/storage/objects/{object_name}"

    def download_file(self, object_name: str, target_path: str):
        """Download an object to target local path."""
        if self.client:
            try:
                self.client.fget_object(
                    bucket_name=self.bucket,
                    object_name=object_name,
                    file_path=target_path
                )
                return
            except Exception as e:
                logger.error(f"MinIO fget_object failed: {e}")

        dest = self.fallback_dir / object_name
        if dest.exists():
            import shutil
            shutil.copyfile(dest, target_path)
        else:
            raise FileNotFoundError(f"Object {object_name} not found in fallback storage")

minio_client = MinioClientWrapper()
