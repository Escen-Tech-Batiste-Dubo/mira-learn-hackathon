from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, IDMixin, SoftDeleteMixin, TimestampMixin


class MiraClassSession(Base, IDMixin, TimestampMixin, SoftDeleteMixin):
    """Minimal session model for enrolment capacity and counters."""

    __tablename__ = "mira_class_session"

    class_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("mira_class.id", ondelete="CASCADE"),
        nullable=False,
    )
    type: Mapped[str] = mapped_column(String(16), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    waitlist_enabled: Mapped[bool] = mapped_column(nullable=False, default=True)
    waitlist_max_size: Mapped[int] = mapped_column(Integer, nullable=False, default=20)
    enrolment_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    waitlist_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="planned")
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    __table_args__ = (
        CheckConstraint("capacity >= 1 AND capacity <= 50", name="mira_class_session_capacity_check"),
        CheckConstraint("waitlist_max_size >= 0", name="mira_class_session_waitlist_max_size_check"),
        CheckConstraint("enrolment_count >= 0", name="mira_class_session_enrolment_count_check"),
        CheckConstraint("waitlist_count >= 0", name="mira_class_session_waitlist_count_check"),
        CheckConstraint(
            "status IN ('planned', 'open_enrolment', 'full', 'in_progress', 'completed', 'cancelled')",
            name="mira_class_session_status_check",
        ),
        CheckConstraint("ends_at > starts_at", name="mira_class_session_dates_check"),
        Index(
            "idx_mira_class_session_class_id",
            "class_id",
            postgresql_where="deleted_at IS NULL",
        ),
    )
