"""SQLAlchemy model for the ``mira_class_session`` table (Group B write).

Owns & manages all session instances of a published mira_class.
State machine: planned → open_enrolment → full | in_progress → completed | cancelled.
"""
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, CheckConstraint, DateTime, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import NUMERIC, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class MiraClassSession(Base, TimestampMixin, SoftDeleteMixin):
    """Instance datée d'une mira_class (physical/virtual/hybrid session)."""

    __tablename__ = "mira_class_session"

    # PK
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )

    # FK (read-only ref)
    class_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        nullable=False,
    )

    # Type + localisation
    type: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        default="virtual",
    )
    """Session type: 'physical', 'virtual', or 'hybrid'."""

    location_address: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    """Full address (required if physical or hybrid)."""

    location_city: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    location_country: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    location_lat: Mapped[float | None] = mapped_column(
        NUMERIC(10, 7),
        nullable=True,
    )

    location_lng: Mapped[float | None] = mapped_column(
        NUMERIC(10, 7),
        nullable=True,
    )

    online_meeting_provider: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
    )
    """Provider: 'zoom', 'meet', 'livekit', 'other'."""

    online_meeting_default_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    # Capacité
    capacity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=10,
    )
    """Max attendees (1-50)."""

    waitlist_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    waitlist_max_size: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=20,
    )

    # Pricing
    price_cents: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        default=0,
    )
    """Price in cents (0 = free)."""

    # State machine
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="planned",
    )
    """Status: planned, open_enrolment, full, in_progress, completed, cancelled."""

    cancellation_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Dates
    starts_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    """Session start time."""

    ends_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    """Session end time."""

    enrolment_deadline: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    """Deadline for enrolment (default: starts_at - 24h)."""

    # Promotion
    is_promoted: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    """Boosted visibility at catalogue."""

    promoted_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Denorm counters
    enrolment_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    """Number of accepted enrolments (updated by service)."""

    waitlist_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    """Number of waitlisted enrolments (updated by service)."""

    # Constraints + indexes
    __table_args__ = (
        # Type-location coherence: virtual must not have address
        CheckConstraint(
            "type IN ('physical', 'virtual', 'hybrid')",
            name="ck_mira_class_session_type",
        ),
        CheckConstraint(
            "(type = 'virtual' AND location_address IS NULL) OR "
            "(type IN ('physical', 'hybrid') AND location_address IS NOT NULL)",
            name="ck_mira_class_session_location_required",
        ),
        # Status enum
        CheckConstraint(
            "status IN ('planned', 'open_enrolment', 'full', 'in_progress', 'completed', 'cancelled')",
            name="ck_mira_class_session_status",
        ),
        # Meeting provider enum
        CheckConstraint(
            "online_meeting_provider IS NULL OR online_meeting_provider IN ('zoom', 'meet', 'livekit', 'other')",
            name="ck_mira_class_session_provider",
        ),
        # Capacity constraints
        CheckConstraint(
            "capacity >= 1 AND capacity <= 50",
            name="ck_mira_class_session_capacity_range",
        ),
        CheckConstraint(
            "waitlist_max_size >= 0",
            name="ck_mira_class_session_waitlist_max",
        ),
        # Price constraints
        CheckConstraint(
            "price_cents >= 0",
            name="ck_mira_class_session_price_positive",
        ),
        # Enrolment + waitlist counters non-negative
        CheckConstraint(
            "enrolment_count >= 0",
            name="ck_mira_class_session_enrolment_count_positive",
        ),
        CheckConstraint(
            "waitlist_count >= 0",
            name="ck_mira_class_session_waitlist_count_positive",
        ),
        # Date constraints
        CheckConstraint(
            "ends_at > starts_at",
            name="ck_mira_class_session_ends_after_starts",
        ),
    )

