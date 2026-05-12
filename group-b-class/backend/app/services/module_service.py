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

MAX_MODULES_PER_CLASS = 12
EDITABLE_MODULE_FIELDS = frozenset({"title", "description", "type", "duration_hours"})

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

    async def _get_owned_class_or_403(self, class_id: str, user_id: str) -> MiraClass:
        stmt = select(MiraClass).where(
            MiraClass.id == class_id,
            MiraClass.mentor_user_id == user_id,
            MiraClass.deleted_at.is_(None),
        )
        result = await self.db.execute(stmt)
        cls = result.scalar_one_or_none()
        if cls is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not own this class",
            )
        self._assert_ownership(cls, user_id)
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
        if module is None or module.deleted_at is not None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
        return module

    async def _count_active_modules(self, class_id: str) -> int:
        stmt = select(func.count()).where(
            MiraClassModule.class_id == class_id,
            MiraClassModule.deleted_at.is_(None),
        )
        count = (await self.db.execute(stmt)).scalar_one_or_none()
        return int(count or 0)

    async def _get_class_modules(self, class_id: str) -> list[MiraClassModule]:
        stmt = select(MiraClassModule).where(MiraClassModule.class_id == class_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    def _get_active_class_modules(self, class_modules: list[MiraClassModule]) -> list[MiraClassModule]:
        return [
            module
            for module in sorted(class_modules, key=lambda item: item.position)
            if module.deleted_at is None
        ]

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
        ordered_module_ids: list[str] = []
        seen_module_ids: set[str] = set()

        for module_id in body.module_ids_in_order:
            if module_id not in modules_by_id:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Unknown module id: {module_id}",
                )
            if module_id in seen_module_ids:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Duplicate module id: {module_id}",
                )
            seen_module_ids.add(module_id)
            ordered_module_ids.append(module_id)

        if len(ordered_module_ids) != len(modules):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Reorder payload must contain all active module ids",
            )

        return {module_id: index for index, module_id in enumerate(ordered_module_ids, start=1)}

    def _apply_module_updates(self, module: MiraClassModule, payload: dict[str, object]) -> None:
        for field in EDITABLE_MODULE_FIELDS:
            if field not in payload:
                continue
            setattr(module, field, payload[field])

    def _sorted_active_modules(self, class_modules: list[MiraClassModule]) -> list[MiraClassModule]:
        return sorted(
            (module for module in class_modules if module.deleted_at is None),
            key=lambda module: module.position,
        )

    async def _persist_module_order(
        self,
        class_modules: list[MiraClassModule],
        ordered_active_modules: list[MiraClassModule],
    ) -> None:
        timestamp = datetime.now(UTC)
        for index, module in enumerate(sorted(class_modules, key=lambda item: item.position), start=1):
            module.position = 10000 + index
            module.updated_at = timestamp

        await self.db.flush()

        for index, module in enumerate(ordered_active_modules, start=1):
            module.position = index
            module.updated_at = timestamp

        await self.db.flush()

    async def list_modules(self, class_id: str, user_id: str) -> list[MiraClassModule]:
        await self._get_owned_class_or_403(class_id, user_id)

        stmt = (
            select(MiraClassModule)
            .where(
                MiraClassModule.class_id == class_id,
                MiraClassModule.deleted_at.is_(None),
            )
            .order_by(MiraClassModule.position.asc())
        )
        result = await self.db.execute(stmt)
        return sorted(result.scalars().all(), key=lambda module: module.position)

    async def create_module(
        self,
        class_id: str,
        body: MiraClassModuleCreate,
        user_id: str,
    ) -> MiraClassModule:
        cls = await self._get_owned_class_or_403(class_id, user_id)
        self._assert_enrichable(cls)

        active_modules_count = await self._count_active_modules(class_id)
        if active_modules_count >= MAX_MODULES_PER_CLASS:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cette class a déjà 12 modules (maximum autorisé)",
            )

        if body.position > active_modules_count + 1:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Position {body.position} invalide",
            )

        class_modules = await self._get_class_modules(class_id)
        active_modules = self._get_active_class_modules(class_modules)
        ordered_active_modules = active_modules.copy()

        module = MiraClassModule(
            class_id=class_id,
            position=body.position,
            title=body.title,
            description=body.description,
            duration_hours=float(body.duration_hours),
            type=body.type,
            ai_generated=body.ai_generated,
            source_outline_id=body.source_outline_id,
        )
        self.db.add(module)
        ordered_active_modules.insert(body.position - 1, module)
        class_modules.append(module)
        self._maybe_transition_class(cls)
        await self._persist_module_order(class_modules, ordered_active_modules)

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
        cls = await self._get_owned_class_or_403(class_id, user_id)
        self._assert_enrichable(cls)
        module = await self._get_active_module_or_404(module_id, class_id)

        payload = body.model_dump(exclude_none=True)
        target_position = payload.pop("position", None)
        self._apply_module_updates(module, payload)

        if target_position is not None and target_position != module.position:
            class_modules = await self._get_class_modules(class_id)
            active_modules = self._get_active_class_modules(class_modules)
            if target_position < 1 or target_position > len(active_modules):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Position {target_position} invalide",
                )

            reordered_modules = [item for item in active_modules if item.id != module_id]
            reordered_modules.insert(target_position - 1, module)
            await self._persist_module_order(class_modules, reordered_modules)
        else:
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
        cls = await self._get_owned_class_or_403(class_id, user_id)
        self._assert_enrichable(cls)

        class_modules = await self._get_class_modules(class_id)
        active_modules = self._get_active_class_modules(class_modules)
        requested_positions = self._validate_reorder_targets(active_modules, body)
        ordered_active_modules = sorted(active_modules, key=lambda module: requested_positions[module.id])
        await self._persist_module_order(class_modules, ordered_active_modules)
        await self.db.commit()
        return ordered_active_modules

    async def delete_module(self, class_id: str, module_id: str, user_id: str) -> None:
        cls = await self._get_owned_class_or_403(class_id, user_id)
        self._assert_enrichable(cls)
        module = await self._get_active_module_or_404(module_id, class_id)

        module.deleted_at = datetime.now(UTC)
        class_modules = await self._get_class_modules(class_id)
        remaining_active_modules = self._get_active_class_modules(class_modules)
        await self._persist_module_order(class_modules, remaining_active_modules)
        await self.db.commit()
