"""SQLAlchemy model for the shared skill table."""
from sqlalchemy import Integer, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class Skill(Base, TimestampMixin, SoftDeleteMixin):
    """Canonical skill reference shared by all Mira Learn groups."""

    __tablename__ = "skill"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    slug: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    category: Mapped[str] = mapped_column(String(32), nullable=False)
    popularity_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
