"""
Service métier pour les modules de `mira_class_module`.

Toute la logique d'ownership, de transition d'état et de soft delete vit ici.
"""
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import DateTime, String, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.module import MiraClassModule
from app.schemas.module import MiraClassModuleCreate, MiraClassModuleReorder, MiraClassModuleUpdate

EDITABLE_CLASS_STATUSES = frozenset(
    {
        "validated_draft",
        "enrichment_in_progress",
        "published",
    }
)

MODULE_CREATION_STATUS_TRANSITIONS = {
    "validated_draft": "enrichment_in_progress",
}


class MiraClass(Base):
    """Minimal local mapping for ownership and status checks on `mira_class`."""

    __tablename__ = "mira_class"
    __table_args__ = {"extend_existing": True}

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    mentor_user_id: Mapped[str] = mapped_column(String(36), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ModuleService:
    """Business logic for Mira Class modules."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _get_class_or_404(self, class_id: str) -> MiraClass:
        stmt = select(MiraClass).where(
            MiraClass.id == class_id,
            MiraClass.deleted_at.is_(None),
        )
        result = await self.db.execute(stmt)
        cls = result.scalar_one_or_none()
        if cls is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
        return cls

    def _assert_ownership(self, cls: MiraClass, user_id: str) -> None:
        if cls.mentor_user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not own this class",
            )

    def _assert_enrichable(self, cls: MiraClass) -> None:
        if cls.status not in EDITABLE_CLASS_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Class status '{cls.status}' does not allow module editing",
            )

    async def _get_active_module_or_404(self, module_id: str, class_id: str) -> MiraClassModule:
        stmt = select(MiraClassModule).where(
            MiraClassModule.id == module_id,
            MiraClassModule.class_id == class_id,
            MiraClassModule.deleted_at.is_(None),
        )
        result = await self.db.execute(stmt)
        module = result.scalar_one_or_none()
        if module is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
        return module

    async def _next_position(self, class_id: str) -> int:
        stmt = select(func.max(MiraClassModule.position)).where(
            MiraClassModule.class_id == class_id,
            MiraClassModule.deleted_at.is_(None),
        )
        max_position = (await self.db.execute(stmt)).scalar_one_or_none()
        if max_position is None:
            return 0
        return int(max_position) + 1

    def _maybe_transition_class(self, cls: MiraClass) -> None:
        next_status = MODULE_CREATION_STATUS_TRANSITIONS.get(cls.status)
        if next_status is not None:
            cls.status = next_status

    def _validate_reorder_targets(
        self,
        modules: list[MiraClassModule],
        body: MiraClassModuleReorder,
    ) -> dict[str, int]:
        modules_by_id = {module.id: module for module in modules}
        requested_positions: dict[str, int] = {}

        for item in body.modules:
            if item.id not in modules_by_id:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Unknown module id: {item.id}",
                )
            if item.id in requested_positions:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Duplicate module id: {item.id}",
                )
            requested_positions[item.id] = item.position

        final_positions = {
            module.id: requested_positions.get(module.id, module.position)
            for module in modules
        }
        if len(set(final_positions.values())) != len(final_positions):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Reorder produces duplicate positions",
            )

        return requested_positions

    async def list_modules(self, class_id: str, user_id: str) -> list[MiraClassModule]:
        cls = await self._get_class_or_404(class_id)
        self._assert_ownership(cls, user_id)

        stmt = (
            select(MiraClassModule)
            .where(
                MiraClassModule.class_id == class_id,
                MiraClassModule.deleted_at.is_(None),
            )
            .order_by(MiraClassModule.position.asc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create_module(
        self,
        class_id: str,
        body: MiraClassModuleCreate,
        user_id: str,
    ) -> MiraClassModule:
        cls = await self._get_class_or_404(class_id)
        self._assert_ownership(cls, user_id)
        self._assert_enrichable(cls)

        position = await self._next_position(class_id)
        payload = body.model_dump(exclude_none=True)
        module = MiraClassModule(
            class_id=class_id,
            position=position,
            **payload,
        )
        self.db.add(module)
        self._maybe_transition_class(cls)

        await self.db.commit()
        await self.db.refresh(module)
        return module

    async def update_module(
        self,
        class_id: str,
        module_id: str,
        body: MiraClassModuleUpdate,
        user_id: str,
    ) -> MiraClassModule:
        cls = await self._get_class_or_404(class_id)
        self._assert_ownership(cls, user_id)
        self._assert_enrichable(cls)
        module = await self._get_active_module_or_404(module_id, class_id)

        for field, value in body.model_dump(exclude_none=True).items():
            setattr(module, field, value)
        module.updated_at = datetime.now(UTC)

        await self.db.commit()
        await self.db.refresh(module)
        return module

    async def reorder_modules(
        self,
        class_id: str,
        body: MiraClassModuleReorder,
        user_id: str,
    ) -> list[MiraClassModule]:
        cls = await self._get_class_or_404(class_id)
        self._assert_ownership(cls, user_id)
        self._assert_enrichable(cls)

        stmt = select(MiraClassModule).where(
            MiraClassModule.class_id == class_id,
            MiraClassModule.deleted_at.is_(None),
        )
        result = await self.db.execute(stmt)
        modules = list(result.scalars().all())
        requested_positions = self._validate_reorder_targets(modules, body)

        for module in modules:
            if module.id not in requested_positions:
                continue
            module.position = requested_positions[module.id]
            module.updated_at = datetime.now(UTC)

        await self.db.flush()
        await self.db.commit()
        return await self.list_modules(class_id, user_id)

    async def delete_module(self, class_id: str, module_id: str, user_id: str) -> None:
        cls = await self._get_class_or_404(class_id)
        self._assert_ownership(cls, user_id)
        self._assert_enrichable(cls)
        module = await self._get_active_module_or_404(module_id, class_id)

        module.deleted_at = datetime.now(UTC)
        await self.db.commit()
