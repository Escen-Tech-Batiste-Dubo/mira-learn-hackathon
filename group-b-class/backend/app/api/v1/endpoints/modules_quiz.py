"""
Routes QCM par module — `contracts/group-b-class/mira_class_module_quiz.md`.

- POST /v1/modules/{module_id}/quiz/generate — génération IA (mentor)
- GET  /v1/modules/{module_id}/quiz — détail mentor (404 si aucun quiz)
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, require_role
from app.core.db import get_db
from app.core.exceptions import NotFoundError
from app.core.responses import success_response
from app.schemas.quiz import MiraClassModuleQuizGenerateRequest
from app.services import quiz_service

router = APIRouter()


@router.get(
    "/{module_id}/quiz",
    summary="Détail du quiz d’un module (mentor)",
)
async def get_module_quiz(
    module_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role("mentor")),
) -> dict:
    detail = await quiz_service.get_quiz_for_module(db, module_id, user.user_id)
    if detail is None:
        raise NotFoundError(resource="MiraClassModuleQuiz", identifier=module_id)
    return success_response(data=detail.model_dump(mode="json"))


@router.post(
    "/{module_id}/quiz/generate",
    status_code=status.HTTP_201_CREATED,
    summary="Générer un brouillon de QCM via OpenRouter",
)
async def generate_module_quiz(
    module_id: str,
    body: MiraClassModuleQuizGenerateRequest,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role("mentor")),
) -> dict:
    """Crée ou remplace un quiz `draft` pour le module (1 max actif)."""
    detail = await quiz_service.generate_quiz_for_module(db, module_id, user.user_id, body)
    return success_response(data=detail.model_dump(mode="json"))
