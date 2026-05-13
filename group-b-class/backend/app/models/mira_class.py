"""SQLAlchemy model for the cross-group ``mira_class`` table."""
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class MiraClass(Base, TimestampMixin, SoftDeleteMixin):
    """Mira Class shell owned by Group A and operated by Group B."""

    __tablename__ = "mira_class"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    application_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    mentor_user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    skills_taught: Mapped[list[str]] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
        server_default=text("'[]'::jsonb"),
    )

    total_hours_collective: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_hours_individual: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_hours: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    format_envisaged: Mapped[str] = mapped_column(String(16), nullable=False, default="both")
    rythm_pattern: Mapped[str | None] = mapped_column(String(32), nullable=True)
    target_cities: Mapped[list[dict[str, str]]] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
        server_default=text("'[]'::jsonb"),
    )

    recommended_price_per_hour_collective_cents: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        default=0,
    )
    recommended_price_per_hour_individual_cents: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        default=0,
    )

    status: Mapped[str] = mapped_column(String(32), nullable=False, default="draft")
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    ai_assisted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    source_suggestion_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)

    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
