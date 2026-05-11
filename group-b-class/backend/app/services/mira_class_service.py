"""Business logic for mentor-owned Mira Classes."""
from typing import Sequence

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mira_class import MiraClass
from app.models.skill import Skill
from app.schemas.mira_class import MiraClassCreate


async def list_classes_for_mentor(
    db: AsyncSession,
    mentor_user_id: str,
) -> Sequence[MiraClass]:
    """Return non-deleted Mira Classes owned by the connected mentor."""
    stmt = (
        select(MiraClass)
        .where(
            MiraClass.mentor_user_id == mentor_user_id,
            MiraClass.deleted_at.is_(None),
        )
        .order_by(MiraClass.updated_at.desc(), MiraClass.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


async def create_class_for_mentor(
    db: AsyncSession,
    mentor_user_id: str,
    body: MiraClassCreate,
) -> MiraClass:
    """Create a draft Mira Class owned by the connected mentor."""
    skill_ids = [str(skill_id) for skill_id in body.skill_ids]
    await _ensure_skills_exist(db=db, skill_ids=skill_ids)

    format_envisaged = "virtual" if body.delivery_format == "async" else body.delivery_format
    rythm_pattern = "self_paced" if body.delivery_format == "async" else None

    instance = MiraClass(
        mentor_user_id=mentor_user_id,
        title=body.title,
        description=body.description,
        skills_taught=skill_ids,
        format_envisaged=format_envisaged,
        rythm_pattern=rythm_pattern,
        status="draft",
        total_hours_collective=0,
        total_hours_individual=0,
        total_hours=0,
        target_cities=[],
        recommended_price_per_hour_collective_cents=0,
        recommended_price_per_hour_individual_cents=0,
        ai_assisted=False,
    )
    db.add(instance)
    await db.commit()
    await db.refresh(instance)
    return instance


async def _ensure_skills_exist(db: AsyncSession, skill_ids: list[str]) -> None:
    stmt = select(Skill.id).where(
        Skill.id.in_(skill_ids),
        Skill.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    found_ids = {str(skill_id) for skill_id in result.scalars().all()}
    missing_ids = [skill_id for skill_id in skill_ids if skill_id not in found_ids]
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Une ou plusieurs skills ne sont pas disponibles.",
        )
