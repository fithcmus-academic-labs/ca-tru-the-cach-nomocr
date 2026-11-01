import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Boolean, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class BoundingBox(Base):
    __tablename__ = "bounding_boxes"

    id: Mapped[str] = mapped_column(String(64), primary_key=True) # e.g. 'box_ch_006_0'
    project_id: Mapped[str] = mapped_column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    page_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("pages.id", ondelete="CASCADE"), nullable=False, index=True)
    sentence_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    region_type: Mapped[str] = mapped_column(String(10), nullable=False, index=True) # 'ch' (Sino-Nom) or 'vi' (Quoc Ngu)
    transcription: Mapped[str] = mapped_column(Text, default="", nullable=False)
    points: Mapped[list] = mapped_column(JSONB, nullable=False) # [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
    confidence: Mapped[Optional[float]] = mapped_column(Numeric(5, 4), default=1.0000, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="matched", nullable=False) # matched, mismatched, unverified
    is_modified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    revision_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    project: Mapped["Project"] = relationship("Project", back_populates="bounding_boxes")
    page: Mapped["Page"] = relationship("Page", back_populates="bounding_boxes")
