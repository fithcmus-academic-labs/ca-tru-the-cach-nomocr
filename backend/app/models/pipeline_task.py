import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class PipelineTask(Base):
    __tablename__ = "pipeline_tasks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[str] = mapped_column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    celery_task_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    stage: Mapped[str] = mapped_column(String(50), nullable=False, index=True) # PREPROCESS, OCR, ALIGN, CLEAN, EVALUATE, EXPORT_PREP
    status: Mapped[str] = mapped_column(String(30), default="PENDING", nullable=False, index=True) # PENDING, QUEUED, RUNNING, COMPLETED, FAILED
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False) # 0 to 100
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    stage_metadata: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    project: Mapped["Project"] = relationship("Project", back_populates="pipeline_tasks")
