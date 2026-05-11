"""Business logic for mentor authorization."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mentor_profile import MentorProfile


async def has_active_mentor_profile(db: AsyncSession, user_id: str) -> bool:
    """Return whether a Supabase user is an active Mira Mentor locally."""
    stmt = select(MentorProfile.id).where(
        MentorProfile.user_id == user_id,
        MentorProfile.status == "active",
        MentorProfile.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none() is not None
