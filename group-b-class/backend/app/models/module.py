"""
SQLAlchemy model for `mira_class_module`.

Mirrors the frozen 0001 schema for Group B.
"""
from typing import Literal

from sqlalchemy import CheckConstraint, Index, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, IDMixin, SoftDeleteMixin, TimestampMixin

MiraClassModuleType = Literal["theory", "practice", "exercise", "discussion", "workshop"]


class MiraClassModule(Base, IDMixin, TimestampMixin, SoftDeleteMixin):
    """Pedagogical module attached to a Mira class."""

    __tablename__ = "mira_class_module"

    class_id: Mapped[str] = mapped_column(
        String(36),
        nullable=False,
    )
    position: Mapped[int] = mapped_column(nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    duration_hours: Mapped[float] = mapped_column(
        Numeric(4, 1, asdecimal=False),
        nullable=False,
    )
    type: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="theory",
    )
    ai_generated: Mapped[bool] = mapped_column(nullable=False, default=False)
    source_outline_id: Mapped[str | None] = mapped_column(String(36), nullable=True)

    __table_args__ = (
        CheckConstraint("duration_hours > 0", name="mira_class_module_duration_hours_check"),
        CheckConstraint(
            "type IN ('theory', 'practice', 'exercise', 'discussion', 'workshop')",
            name="mira_class_module_type_check",
        ),
        UniqueConstraint(
            "class_id",
            "position",
            deferrable=True,
            initially="DEFERRED",
        ),
        Index(
            "idx_mira_class_module_class_id",
            "class_id",
            "position",
            postgresql_where="deleted_at IS NULL",
        ),
    )
