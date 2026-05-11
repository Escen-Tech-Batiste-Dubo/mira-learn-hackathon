from datetime import datetime

from sqlalchemy import CheckConstraint, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, IDMixin, TimestampMixin


class MiraClassEnrolment(Base, IDMixin, TimestampMixin):
    """Minimal enrolment model for mentor decisions workflow."""

    __tablename__ = "mira_class_enrolment"

    session_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("mira_class_session.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[str] = mapped_column(String(36), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="applied")
    waitlist_position: Mapped[int | None] = mapped_column(nullable=True)
    application_data: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    decision_at: Mapped[datetime | None] = mapped_column(nullable=True)
    decision_by_mentor_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    decision_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    cancellation_at: Mapped[datetime | None] = mapped_column(nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    completed_at: Mapped[datetime | None] = mapped_column(nullable=True)
    enrolled_at: Mapped[datetime] = mapped_column(nullable=False)

    __table_args__ = (
        CheckConstraint(
            "status IN ('applied', 'waitlist', 'accepted', 'rejected', 'cancelled', 'completed')",
            name="mira_class_enrolment_status_check",
        ),
        CheckConstraint(
            "waitlist_position IS NULL OR waitlist_position >= 1",
            name="mira_class_enrolment_waitlist_position_check",
        ),
        Index("idx_mira_class_enrolment_session_id", "session_id", "status"),
        Index("idx_mira_class_enrolment_user_id", "user_id", "status"),
        Index(
            "idx_mira_class_enrolment_waitlist",
            "session_id",
            "waitlist_position",
            postgresql_where="status = 'waitlist'",
        ),
        Index(
            "uniq_mira_class_enrolment_session_user_active",
            "session_id",
            "user_id",
            unique=True,
            postgresql_where="status NOT IN ('cancelled', 'rejected')",
        ),
    )
