"""
Unit tests for `ModuleService`.

These tests mock `AsyncSession` directly and never hit the real database.
"""
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
import sys
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.models.module import MiraClassModule
from app.schemas.module import MiraClassModuleCreate, MiraClassModuleReorder, MiraClassModuleUpdate
from app.services.module_service import MiraClass, ModuleService


class _ScalarResult:
    def __init__(self, value):
        self._value = value

    def scalar_one_or_none(self):
        return self._value


class _ScalarsResult:
    def __init__(self, values):
        self._values = values

    def scalars(self):
        return self

    def all(self):
        return self._values


def _make_db(*results):
    db = AsyncMock(spec=AsyncSession)
    db.execute = AsyncMock(side_effect=list(results))
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    db.flush = AsyncMock()
    db.delete = AsyncMock()
    return db


def _make_class(
    mentor_user_id: str,
    *,
    class_id: str = "class-1",
    status: str = "enrichment_in_progress",
    deleted_at: datetime | None = None,
) -> MiraClass:
    return MiraClass(
        id=class_id,
        mentor_user_id=mentor_user_id,
        status=status,
        deleted_at=deleted_at,
    )


def _make_module(
    class_id: str,
    position: int,
    *,
    module_id: str | None = None,
    deleted_at: datetime | None = None,
    title: str = "Module",
    duration_hours: float = 2.0,
) -> MiraClassModule:
    module = MiraClassModule(
        class_id=class_id,
        position=position,
        title=title,
        description="",
        duration_hours=duration_hours,
        type="theory",
        ai_generated=False,
        source_outline_id=None,
    )
    module.id = module_id or f"module-{position}"
    module.deleted_at = deleted_at
    module.updated_at = datetime.now(UTC)
    return module


@pytest.mark.asyncio
async def test_list_returns_active_modules_ordered_by_position() -> None:
    cls = _make_class("mentor-1")
    modules = [
        _make_module(cls.id, 3, module_id="module-3"),
        _make_module(cls.id, 1, module_id="module-1"),
        _make_module(cls.id, 2, module_id="module-2"),
    ]
    db = _make_db(_ScalarResult(cls), _ScalarsResult(modules))

    service = ModuleService(db)
    result = await service.list_modules(cls.id, "mentor-1")

    assert [module.position for module in result] == [1, 2, 3]


@pytest.mark.asyncio
async def test_list_raises_403_unknown_class() -> None:
    db = _make_db(_ScalarResult(None))

    service = ModuleService(db)

    with pytest.raises(HTTPException) as exc_info:
        await service.list_modules("missing-class", "mentor-1")

    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "You do not own this class"


@pytest.mark.asyncio
async def test_list_raises_403_wrong_mentor() -> None:
    cls = _make_class("mentor-owner")
    db = _make_db(_ScalarResult(cls))

    service = ModuleService(db)

    with pytest.raises(HTTPException) as exc_info:
        await service.list_modules(cls.id, "mentor-other")

    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_create_happy_path_uses_client_position() -> None:
    cls = _make_class("mentor-1")
    db = _make_db(_ScalarResult(cls), _ScalarResult(0), _ScalarsResult([]))

    service = ModuleService(db)
    body = MiraClassModuleCreate(
        position=1,
        title="Intro",
        description="",
        type="theory",
        duration_hours=Decimal("2.0"),
    )

    module = await service.create_module(cls.id, body, "mentor-1")

    assert module.position == 1


@pytest.mark.asyncio
async def test_create_transitions_validated_draft_to_enrichment() -> None:
    cls = _make_class("mentor-1", status="validated_draft")
    db = _make_db(_ScalarResult(cls), _ScalarResult(0), _ScalarsResult([]))

    service = ModuleService(db)
    body = MiraClassModuleCreate(
        position=1,
        title="Intro",
        description="",
        type="theory",
        duration_hours=Decimal("2.0"),
    )

    await service.create_module(cls.id, body, "mentor-1")

    assert cls.status == "enrichment_in_progress"


@pytest.mark.asyncio
async def test_create_does_not_transition_if_already_enrichment() -> None:
    cls = _make_class("mentor-1", status="enrichment_in_progress")
    db = _make_db(_ScalarResult(cls), _ScalarResult(0), _ScalarsResult([]))

    service = ModuleService(db)
    body = MiraClassModuleCreate(
        position=1,
        title="Intro",
        description="",
        type="theory",
        duration_hours=Decimal("2.0"),
    )

    await service.create_module(cls.id, body, "mentor-1")

    assert cls.status == "enrichment_in_progress"


@pytest.mark.asyncio
async def test_create_raises_409_class_not_enrichable() -> None:
    """Statuts hors enrichissement (ex. archivé) → 409."""
    cls = _make_class("mentor-1", status="archived")
    db = _make_db(_ScalarResult(cls))

    service = ModuleService(db)
    body = MiraClassModuleCreate(
        position=1,
        title="Intro",
        description="",
        type="theory",
        duration_hours=Decimal("2.0"),
    )

    with pytest.raises(HTTPException) as exc_info:
        await service.create_module(cls.id, body, "mentor-1")

    assert exc_info.value.status_code == 409


@pytest.mark.asyncio
async def test_create_draft_class_transitions_to_enrichment() -> None:
    """MVP : une class en draft peut recevoir un premier module (→ enrichment_in_progress)."""
    cls = _make_class("mentor-1", status="draft")
    db = _make_db(
        _ScalarResult(cls),
        _ScalarResult(0),
        _ScalarsResult([]),
    )

    service = ModuleService(db)
    body = MiraClassModuleCreate(
        position=1,
        title="Intro",
        description="",
        type="theory",
        duration_hours=Decimal("2.0"),
    )

    await service.create_module(cls.id, body, "mentor-1")

    assert cls.status == "enrichment_in_progress"


@pytest.mark.asyncio
async def test_create_raises_409_max_modules_reached() -> None:
    cls = _make_class("mentor-1")
    db = _make_db(_ScalarResult(cls), _ScalarResult(12))

    service = ModuleService(db)
    body = MiraClassModuleCreate(
        position=1,
        title="Trop de modules",
        description="",
        type="theory",
        duration_hours=Decimal("2.0"),
    )

    with pytest.raises(HTTPException) as exc_info:
        await service.create_module(cls.id, body, "mentor-1")

    assert exc_info.value.status_code == 409


@pytest.mark.asyncio
async def test_create_raises_422_when_position_skips_next_slot() -> None:
    cls = _make_class("mentor-1")
    db = _make_db(_ScalarResult(cls), _ScalarResult(1))

    service = ModuleService(db)
    body = MiraClassModuleCreate(
        position=3,
        title="Position invalide",
        description="",
        type="theory",
        duration_hours=Decimal("2.0"),
    )

    with pytest.raises(HTTPException) as exc_info:
        await service.create_module(cls.id, body, "mentor-1")

    assert exc_info.value.status_code == 422


@pytest.mark.asyncio
async def test_create_raises_403_wrong_mentor() -> None:
    cls = _make_class("mentor-owner")
    db = _make_db(_ScalarResult(cls))

    service = ModuleService(db)
    body = MiraClassModuleCreate(
        position=1,
        title="Intro",
        description="",
        type="theory",
        duration_hours=Decimal("2.0"),
    )

    with pytest.raises(HTTPException) as exc_info:
        await service.create_module(cls.id, body, "mentor-other")

    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_create_inserts_module_at_requested_position() -> None:
    cls = _make_class("mentor-1")
    module_a = _make_module(cls.id, 1, module_id="module-a")
    module_b = _make_module(cls.id, 2, module_id="module-b")
    db = _make_db(
        _ScalarResult(cls),
        _ScalarResult(2),
        _ScalarsResult([module_a, module_b]),
    )

    service = ModuleService(db)
    body = MiraClassModuleCreate(
        position=2,
        title="Nouveau module",
        description="",
        type="theory",
        duration_hours=Decimal("2.0"),
    )

    module = await service.create_module(cls.id, body, "mentor-1")

    assert [module_a.position, module.position, module_b.position] == [1, 2, 3]


@pytest.mark.asyncio
async def test_update_applies_only_provided_fields() -> None:
    cls = _make_class("mentor-1")
    module = _make_module(cls.id, 1, title="Old title", duration_hours=4.0)
    db = _make_db(_ScalarResult(cls), _ScalarResult(module))

    service = ModuleService(db)
    body = MiraClassModuleUpdate(title="New title")

    updated = await service.update_module(cls.id, module.id, body, "mentor-1")

    assert updated.title == "New title"
    assert updated.duration_hours == 4.0


@pytest.mark.asyncio
async def test_update_raises_404_deleted_module() -> None:
    cls = _make_class("mentor-1")
    module = _make_module(cls.id, 1, deleted_at=datetime.now(UTC))
    db = _make_db(_ScalarResult(cls), _ScalarResult(module))

    service = ModuleService(db)
    body = MiraClassModuleUpdate(title="New title")

    with pytest.raises(HTTPException) as exc_info:
        await service.update_module(cls.id, module.id, body, "mentor-1")

    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_update_raises_403_wrong_mentor() -> None:
    cls = _make_class("mentor-owner")
    db = _make_db(_ScalarResult(cls))

    service = ModuleService(db)
    body = MiraClassModuleUpdate(title="New title")

    with pytest.raises(HTTPException) as exc_info:
        await service.update_module(cls.id, "module-1", body, "mentor-other")

    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_update_reorders_modules_when_position_changes() -> None:
    cls = _make_class("mentor-1")
    module_a = _make_module(cls.id, 1, module_id="module-a")
    module_b = _make_module(cls.id, 2, module_id="module-b", title="Before")
    module_c = _make_module(cls.id, 3, module_id="module-c")
    db = _make_db(
        _ScalarResult(cls),
        _ScalarResult(module_b),
        _ScalarsResult([module_a, module_b, module_c]),
    )

    service = ModuleService(db)
    body = MiraClassModuleUpdate(position=1, title="After")

    updated = await service.update_module(cls.id, module_b.id, body, "mentor-1")

    assert updated.title == "After"
    assert [module.position for module in (module_b, module_a, module_c)] == [1, 2, 3]


@pytest.mark.asyncio
async def test_reorder_assigns_positions_by_index() -> None:
    cls = _make_class("mentor-1")
    module_a = _make_module(cls.id, 1, module_id="module-a")
    module_b = _make_module(cls.id, 2, module_id="module-b")
    db = _make_db(_ScalarResult(cls), _ScalarsResult([module_a, module_b]))

    service = ModuleService(db)
    body = MiraClassModuleReorder(module_ids_in_order=["module-b", "module-a"])

    result = await service.reorder_modules(cls.id, body, "mentor-1")

    assert module_b.position == 1
    assert module_a.position == 2
    assert [module.id for module in result] == ["module-b", "module-a"]


@pytest.mark.asyncio
async def test_reorder_raises_422_unknown_module_id() -> None:
    cls = _make_class("mentor-1")
    module_a = _make_module(cls.id, 1, module_id="module-a")
    db = _make_db(_ScalarResult(cls), _ScalarsResult([module_a]))

    service = ModuleService(db)
    body = MiraClassModuleReorder(module_ids_in_order=["missing-module"])

    with pytest.raises(HTTPException) as exc_info:
        await service.reorder_modules(cls.id, body, "mentor-1")

    assert exc_info.value.status_code == 422


@pytest.mark.asyncio
async def test_delete_sets_deleted_at_not_db_delete() -> None:
    cls = _make_class("mentor-1")
    module = _make_module(cls.id, 1, module_id="module-a")
    sibling = _make_module(cls.id, 2, module_id="module-b")
    db = _make_db(
        _ScalarResult(cls),
        _ScalarResult(module),
        _ScalarsResult([module, sibling]),
    )

    service = ModuleService(db)
    await service.delete_module(cls.id, module.id, "mentor-1")

    assert module.deleted_at is not None
    assert sibling.position == 1
    assert module.position > 10000
    db.delete.assert_not_called()


@pytest.mark.asyncio
async def test_delete_raises_403_wrong_mentor() -> None:
    cls = _make_class("mentor-owner")
    db = _make_db(_ScalarResult(cls))

    service = ModuleService(db)

    with pytest.raises(HTTPException) as exc_info:
        await service.delete_module(cls.id, "module-1", "mentor-other")

    assert exc_info.value.status_code == 403
