"""Business logic for session module materials (mentor-owned)."""

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mira_class import MiraClass
from app.models.mira_class_session import MiraClassSession
from app.models.mira_class_session_module import MiraClassSessionModule
from app.models.mira_class_session_module_material import MiraClassSessionModuleMaterial
from app.models.module import MiraClassModule
from app.schemas.session_module_material import SessionModuleMaterialCreate


async def _get_owned_class(db: AsyncSession, class_id: str, mentor_user_id: str) -> MiraClass:
    stmt = select(MiraClass).where(
        MiraClass.id == class_id,
        MiraClass.mentor_user_id == mentor_user_id,
        MiraClass.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    cls = result.scalar_one_or_none()
    if cls is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this class")
    return cls


async def _get_session_for_class(db: AsyncSession, session_id: str, class_id: str) -> MiraClassSession:
    stmt = select(MiraClassSession).where(
        MiraClassSession.id == session_id,
        MiraClassSession.class_id == class_id,
        MiraClassSession.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


async def _get_module_for_class(db: AsyncSession, module_id: str, class_id: str) -> MiraClassModule:
    stmt = select(MiraClassModule).where(
        MiraClassModule.id == module_id,
        MiraClassModule.class_id == class_id,
        MiraClassModule.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    module = result.scalar_one_or_none()
    if module is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    return module


async def get_or_create_session_module(
    db: AsyncSession,
    *,
    session: MiraClassSession,
    module: MiraClassModule,
) -> MiraClassSessionModule:
    stmt = select(MiraClassSessionModule).where(
        MiraClassSessionModule.session_id == session.id,
        MiraClassSessionModule.module_id == module.id,
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    if existing:
        return existing

    row = MiraClassSessionModule(
        session_id=session.id,
        module_id=module.id,
        position=module.position,
        scheduled_at=session.starts_at,
        duration_hours=float(module.duration_hours),
        online_meeting_url=None,
        status="scheduled",
    )
    db.add(row)
    await db.flush()
    return row


async def _get_session_module_if_exists(
    db: AsyncSession,
    *,
    session_id: str,
    module_id: str,
) -> MiraClassSessionModule | None:
    stmt = select(MiraClassSessionModule).where(
        MiraClassSessionModule.session_id == session_id,
        MiraClassSessionModule.module_id == module_id,
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def list_materials_for_session_module(
    db: AsyncSession,
    *,
    class_id: str,
    session_id: str,
    module_id: str,
    mentor_user_id: str,
    phase: str | None = None,
) -> list[MiraClassSessionModuleMaterial]:
    await _get_owned_class(db, class_id, mentor_user_id)
    await _get_session_for_class(db, session_id, class_id)
    await _get_module_for_class(db, module_id, class_id)

    sm = await _get_session_module_if_exists(db, session_id=session_id, module_id=module_id)
    if sm is None:
        return []

    stmt = select(MiraClassSessionModuleMaterial).where(
        MiraClassSessionModuleMaterial.session_module_id == sm.id,
        MiraClassSessionModuleMaterial.deleted_at.is_(None),
    )
    if phase is not None:
        stmt = stmt.where(MiraClassSessionModuleMaterial.phase == phase)
    stmt = stmt.order_by(MiraClassSessionModuleMaterial.phase, MiraClassSessionModuleMaterial.ordering)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def create_material(
    db: AsyncSession,
    *,
    class_id: str,
    session_id: str,
    module_id: str,
    mentor_user_id: str,
    body: SessionModuleMaterialCreate,
) -> MiraClassSessionModuleMaterial:
    await _get_owned_class(db, class_id, mentor_user_id)
    session = await _get_session_for_class(db, session_id, class_id)
    module = await _get_module_for_class(db, module_id, class_id)
    sm = await get_or_create_session_module(db, session=session, module=module)

    row = MiraClassSessionModuleMaterial(
        session_module_id=sm.id,
        phase=body.phase,
        material_type=body.material_type,
        material_url=body.material_url,
        file_size_bytes=body.file_size_bytes,
        file_mime_type=body.file_mime_type,
        label=body.label,
        description=body.description or "",
        ordering=body.ordering,
        required=body.required,
    )
    db.add(row)
    await db.flush()
    await db.refresh(row)
    return row


async def material_counts_by_module(
    db: AsyncSession,
    *,
    class_id: str,
    mentor_user_id: str,
) -> dict[str, int]:
    await _get_owned_class(db, class_id, mentor_user_id)

    stmt = (
        select(MiraClassSessionModule.module_id, func.count(MiraClassSessionModuleMaterial.id))
        .join(
            MiraClassSessionModuleMaterial,
            MiraClassSessionModuleMaterial.session_module_id == MiraClassSessionModule.id,
        )
        .join(MiraClassSession, MiraClassSession.id == MiraClassSessionModule.session_id)
        .where(
            MiraClassSession.class_id == class_id,
            MiraClassSession.deleted_at.is_(None),
            MiraClassSessionModuleMaterial.deleted_at.is_(None),
        )
        .group_by(MiraClassSessionModule.module_id)
    )
    result = await db.execute(stmt)
    rows = result.all()
    return {str(mid): int(cnt) for mid, cnt in rows}
