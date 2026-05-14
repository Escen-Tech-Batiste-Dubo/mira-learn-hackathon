"""SQLAlchemy model for ``mira_class_session_module`` (Group B, frozen 0001 schema)."""

from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, Numeric, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class MiraClassSessionModule(Base, TimestampMixin):
    """Module occurrence within a specific Mira Class session."""

    __tablename__ = "mira_class_session_module"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    session_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("mira_class_session.id", ondelete="CASCADE"),
        nullable=False,
    )
    module_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)

    position: Mapped[int] = mapped_column(Integer, nullable=False)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    duration_hours: Mapped[float] = mapped_column(Numeric(4, 1, asdecimal=False), nullable=False)

    online_meeting_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    status: Mapped[str] = mapped_column(String(16), nullable=False, default="scheduled")
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint("duration_hours > 0", name="mira_class_session_module_duration_hours_check"),
        CheckConstraint(
            "status IN ('scheduled', 'in_progress', 'completed', 'skipped')",
            name="mira_class_session_module_status_check",
        ),
        UniqueConstraint("session_id", "module_id", name="mira_class_session_module_session_id_module_id_key"),
        UniqueConstraint(
            "session_id",
            "position",
            name="mira_class_session_module_session_id_position_key",
            deferrable=True,
            initially="DEFERRED",
        ),
    )
