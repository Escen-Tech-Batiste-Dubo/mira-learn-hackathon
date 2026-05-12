"""Mentor Mira Class endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import HTTPBearer

from app.core.auth import AuthenticatedUser, require_role
from app.core.db import get_db
from app.core.responses import success_response
from app.schemas.mira_class import MiraClassListRead, MiraClassRead, MiraClassCreate
from app.services import mentor_profile_service, mira_class_service

router = APIRouter()
security = HTTPBearer()


@router.get("/me", summary="Lister les Mira Classes du mentor connecté")
async def list_my_classes(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role("mentor")),
    _auth = Depends(security),
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


@router.post("", status_code=status.HTTP_201_CREATED, summary="Créer une Mira Class")
async def create_mira_class(
    body: MiraClassCreate,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role("mentor")),
    _auth = Depends(security),
) -> dict:
    """Crée un brouillon de Mira Class pour le mentor connecté."""
    if not await mentor_profile_service.has_active_mentor_profile(db=db, user_id=user.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: active Mira Mentor profile required",
        )

    instance = await mira_class_service.create_class_for_mentor(
        db=db,
        mentor_user_id=user.user_id,
        body=body,
    )
    
    payload = MiraClassRead.model_validate(instance)
    return success_response(
        data=payload.model_dump(mode="json"),
        message="Mira Class créée avec succès",
    )