import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class Page(Base):
    __tablename__ = "pages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[str] = mapped_column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    page_id: Mapped[str] = mapped_column(String(10), nullable=False) # '001', '002'
    img_name: Mapped[str] = mapped_column(String(255), nullable=False)
    minio_image_key: Mapped[str] = mapped_column(String(512), nullable=False)
    minio_thumb_key: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    category: Mapped[str] = mapped_column(String(20), default="content", nullable=False, index=True) # content, misc, blank
    review_status: Mapped[str] = mapped_column(String(20), default="unreviewed", nullable=False, index=True) # unreviewed, in_progress, approved, has_issues
    width: Mapped[int] = mapped_column(Integer, default=1400, nullable=False)
    height: Mapped[int] = mapped_column(Integer, default=1800, nullable=False)
    detected_ch: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    detected_vi: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    mismatched_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("project_id", "page_number", name="uq_project_page_number"),
    )

    project: Mapped["Project"] = relationship("Project", back_populates="pages")
    bounding_boxes: Mapped[List["BoundingBox"]] = relationship("BoundingBox", back_populates="page", cascade="all, delete-orphan")
    alignment_records: Mapped[List["AlignmentRecord"]] = relationship("AlignmentRecord", back_populates="page", cascade="all, delete-orphan")
