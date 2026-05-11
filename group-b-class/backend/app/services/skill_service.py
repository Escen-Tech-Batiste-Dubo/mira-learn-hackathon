"""Business logic for shared skills."""
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.skill import Skill


async def list_active_skills(db: AsyncSession) -> Sequence[Skill]:
    """Return non-deleted skills ordered for form pickers."""
    stmt = (
        select(Skill)
        .where(Skill.deleted_at.is_(None))
        .order_by(Skill.popularity_score.desc(), Skill.name.asc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()
