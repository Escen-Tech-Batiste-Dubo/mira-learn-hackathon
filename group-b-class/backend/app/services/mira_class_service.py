"""Business logic for mentor-owned Mira Classes."""
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mira_class import MiraClass


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
