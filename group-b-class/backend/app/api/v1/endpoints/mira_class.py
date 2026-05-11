"""Mentor Mira Class endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, require_auth
from app.core.db import get_db
from app.core.responses import success_response
from app.schemas.mira_class import MiraClassListRead, MiraClassRead
from app.services import mentor_profile_service, mira_class_service

router = APIRouter()


@router.get("/me", summary="Lister les Mira Classes du mentor connecté")
async def list_my_classes(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_auth),
) -> dict:
    """Liste les classes appartenant au Mira Mentor connecté."""
    if not await mentor_profile_service.has_active_mentor_profile(db=db, user_id=user.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: active Mira Mentor profile required",
        )

    classes = await mira_class_service.list_classes_for_mentor(
        db=db,
        mentor_user_id=user.user_id,
    )
    payload = MiraClassListRead(
        items=[MiraClassRead.model_validate(item) for item in classes],
        total=len(classes),
    )
    return success_response(data=payload.model_dump(mode="json"))
