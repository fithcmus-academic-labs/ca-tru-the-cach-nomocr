from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, BigInteger, Integer, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    book_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    student_ids: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    original_pdf_name: Mapped[str] = mapped_column(String(255), nullable=False)
    original_pdf_size: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    minio_pdf_key: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    total_pages: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="CREATED", nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    documents: Mapped[List["Document"]] = relationship("Document", back_populates="project", cascade="all, delete-orphan")
    pages: Mapped[List["Page"]] = relationship("Page", back_populates="project", cascade="all, delete-orphan", order_by="Page.page_number")
    pipeline_tasks: Mapped[List["PipelineTask"]] = relationship("PipelineTask", back_populates="project", cascade="all, delete-orphan")
    bounding_boxes: Mapped[List["BoundingBox"]] = relationship("BoundingBox", back_populates="project", cascade="all, delete-orphan")
    alignment_records: Mapped[List["AlignmentRecord"]] = relationship("AlignmentRecord", back_populates="project", cascade="all, delete-orphan")
    evaluation_metrics: Mapped[List["EvaluationMetric"]] = relationship("EvaluationMetric", back_populates="project", cascade="all, delete-orphan")
    export_jobs: Mapped[List["ExportJob"]] = relationship("ExportJob", back_populates="project", cascade="all, delete-orphan")
