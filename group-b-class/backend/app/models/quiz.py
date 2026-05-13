"""SQLAlchemy models — QCM module (`mira_class_module_quiz*` tables)."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, IDMixin, PgUuidStr, SoftDeleteMixin, TimestampMixin


class MiraClassModuleQuiz(Base, IDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "mira_class_module_quiz"

    module_id: Mapped[str] = mapped_column(PgUuidStr, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    pass_threshold_pct: Mapped[int] = mapped_column(Integer, nullable=False, server_default="70")
    time_limit_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_attempts: Mapped[int] = mapped_column(Integer, nullable=False, server_default="3")
    shuffle_questions: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    shuffle_options: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    show_explanations_after: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    status: Mapped[str] = mapped_column(String(16), nullable=False, server_default="draft")
    ai_generated: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    ai_generation_prompt_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)


class MiraClassModuleQuizQuestion(Base, IDMixin):
    __tablename__ = "mira_class_module_quiz_question"

    quiz_id: Mapped[str] = mapped_column(
        PgUuidStr,
        ForeignKey("mira_class_module_quiz.id", ondelete="CASCADE"),
        nullable=False,
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    type: Mapped[str] = mapped_column(String(16), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    points: Mapped[int] = mapped_column(Integer, nullable=False, server_default="1")
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class MiraClassModuleQuizOption(Base, IDMixin):
    __tablename__ = "mira_class_module_quiz_option"

    question_id: Mapped[str] = mapped_column(
        PgUuidStr,
        ForeignKey("mira_class_module_quiz_question.id", ondelete="CASCADE"),
        nullable=False,
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    label: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
