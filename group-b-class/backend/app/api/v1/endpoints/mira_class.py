"""Mentor Mira Class endpoints."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import ensure_active_mentor
from app.core.auth import AuthenticatedUser, require_auth
from app.core.db import get_db
from app.core.responses import success_response
from app.schemas.mira_class import MiraClassCreate, MiraClassListRead, MiraClassRead
from app.services import mira_class_service

router = APIRouter()


@router.get("/me", summary="Lister les Mira Classes du mentor connecté")
async def list_my_classes(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_auth),
) -> dict:
    """Liste les classes appartenant au Mira Mentor connecté."""
    await ensure_active_mentor(db=db, user=user)

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
    user: AuthenticatedUser = Depends(require_auth),
) -> dict:
    """Crée un brouillon de Mira Class pour le Mira Mentor connecté."""
    await ensure_active_mentor(db=db, user=user)

    instance = await mira_class_service.create_class_for_mentor(
        db=db,
        mentor_user_id=user.user_id,
        body=body,
    )
    payload = MiraClassRead.model_validate(instance)
    return success_response(
        data=payload.model_dump(mode="json"),
        message="Mira Class créée",
    )
