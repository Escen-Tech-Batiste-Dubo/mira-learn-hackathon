"""Skill endpoints used by mentor forms."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import ensure_active_mentor
from app.core.auth import AuthenticatedUser, require_auth
from app.core.db import get_db
from app.core.responses import success_response
from app.schemas.skill import SkillListRead, SkillRead
from app.services import skill_service

router = APIRouter()


@router.get("", summary="Lister les skills disponibles")
async def list_skills(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_auth),
) -> dict:
    """Liste les skills actives pour composer une Mira Class."""
    await ensure_active_mentor(db=db, user=user)

    skills = await skill_service.list_active_skills(db=db)
    payload = SkillListRead(
        items=[SkillRead.model_validate(item) for item in skills],
        total=len(skills),
    )
    return success_response(data=payload.model_dump(mode="json"))
