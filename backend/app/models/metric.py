import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Boolean, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class EvaluationMetric(Base):
    __tablename__ = "evaluation_metrics"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[str] = mapped_column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    total_pages: Mapped[int] = mapped_column(Integer, nullable=False)
    processed_pages: Mapped[int] = mapped_column(Integer, nullable=False)
    total_aligned_pairs: Mapped[int] = mapped_column(Integer, nullable=False)
    total_sinonom_chars: Mapped[int] = mapped_column(Integer, nullable=False)
    total_vietnamese_words: Mapped[int] = mapped_column(Integer, nullable=False)
    validated_pairs: Mapped[int] = mapped_column(Integer, nullable=False)
    mismatched_chars: Mapped[int] = mapped_column(Integer, nullable=False)
    pending_reviews: Mapped[int] = mapped_column(Integer, nullable=False)
    similarity_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    is_similarity_passed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    evaluated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    project: Mapped["Project"] = relationship("Project", back_populates="evaluation_metrics")
