from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Float,
    JSON,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class RAGRequestLog(Base):
    __tablename__ = "rag_request_logs"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    conversation_id: Mapped[int | None] = mapped_column(
        ForeignKey("conversations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    question: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    answer: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    model_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    retrieved_chunks: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    document_ids: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
    )

    similarity_scores: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
    )

    average_similarity: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    max_similarity: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    retrieval_time_ms: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    generation_time_ms: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    total_time_ms: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="success",
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )