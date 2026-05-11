"""Shared API dependencies for Group B endpoints."""
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser
from app.services import mentor_profile_service


async def ensure_active_mentor(db: AsyncSession, user: AuthenticatedUser) -> None:
    """Ensure the authenticated user is an active Mira Mentor in local business data."""
    if not await mentor_profile_service.has_active_mentor_profile(db=db, user_id=user.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: active Mira Mentor profile required",
        )
