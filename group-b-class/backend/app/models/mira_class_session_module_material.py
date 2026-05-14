"""SQLAlchemy model for ``mira_class_session_module_material`` (Group B, frozen 0001 schema)."""

from sqlalchemy import BigInteger, Boolean, CheckConstraint, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class MiraClassSessionModuleMaterial(Base, TimestampMixin, SoftDeleteMixin):
    """Pedagogical material for a module within a session."""

    __tablename__ = "mira_class_session_module_material"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    session_module_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("mira_class_session_module.id", ondelete="CASCADE"),
        nullable=False,
    )

    phase: Mapped[str] = mapped_column(String(16), nullable=False)
    material_type: Mapped[str] = mapped_column(String(16), nullable=False)
    material_url: Mapped[str] = mapped_column(String(500), nullable=False)

    file_size_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    file_mime_type: Mapped[str | None] = mapped_column(String(120), nullable=True)

    label: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    ordering: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    __table_args__ = (
        CheckConstraint("phase IN ('before', 'during', 'after')", name="mira_class_session_module_material_phase_check"),
        CheckConstraint(
            "material_type IN ('file', 'link')",
            name="mira_class_session_module_material_material_type_check",
        ),
    )
