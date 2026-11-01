import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class AlignmentRecord(Base):
    __tablename__ = "alignment_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True) # e.g. 'rec_6_1'
    project_id: Mapped[str] = mapped_column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    page_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("pages.id", ondelete="CASCADE"), nullable=False)
    img_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    sentence_id: Mapped[str] = mapped_column(String(255), nullable=False) # <img_id without .jpg>.<index>
    sino_nom_char: Mapped[str] = mapped_column(Text, nullable=False)
    chu_qn_txt: Mapped[str] = mapped_column(Text, nullable=False)
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    line_index: Mapped[int] = mapped_column(Integer, nullable=False)
    is_matched: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    color: Mapped[str] = mapped_column(String(10), default="BLACK", nullable=False, index=True) # 'BLACK' or 'RED'
    char_statuses: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    review_status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False, index=True) # pending, reviewed, approved
    editor_note: Mapped[Optional[str]] = mapped_column(Text, default="", nullable=True)
    is_edited: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    revision_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("project_id", "sentence_id", name="uq_project_sentence_id"),
    )

    project: Mapped["Project"] = relationship("Project", back_populates="alignment_records")
    page: Mapped["Page"] = relationship("Page", back_populates="alignment_records")
    review_records: Mapped[List["ReviewRecord"]] = relationship("ReviewRecord", back_populates="alignment", cascade="all, delete-orphan")
