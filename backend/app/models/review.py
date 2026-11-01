import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class ReviewRecord(Base):
    __tablename__ = "review_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[str] = mapped_column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    alignment_id: Mapped[str] = mapped_column(String(64), ForeignKey("alignment_records.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id: Mapped[str] = mapped_column(String(100), default="linguist_expert", nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False) # APPROVE, REJECT, MODIFY_TEXT, MODIFY_BBOX
    previous_nom: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    new_nom: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    previous_qn: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    new_qn: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    alignment: Mapped["AlignmentRecord"] = relationship("AlignmentRecord", back_populates="review_records")
