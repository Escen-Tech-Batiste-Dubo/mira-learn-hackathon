"""
Routes QCM par quiz_id — `contracts/group-b-class/mira_class_module_quiz_question.md`.

- PATCH /v1/quizzes/{quiz_id}/questions/{question_id} — édition mentor (brouillon)
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, require_role
from app.core.db import get_db
from app.core.responses import success_response
from app.schemas.quiz import QuizQuestionMentorPatch
from app.services import quiz_service

router = APIRouter()


@router.patch(
    "/{quiz_id}/questions/{question_id}",
    summary="Mettre à jour une question du quiz (mentor, brouillon)",
)
async def patch_quiz_question(
    quiz_id: str,
    question_id: str,
    body: QuizQuestionMentorPatch,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role("mentor")),
) -> dict:
    detail = await quiz_service.update_quiz_question(
        db,
        quiz_id,
        question_id,
        user.user_id,
        body,
    )
    return success_response(data=detail.model_dump(mode="json"))
