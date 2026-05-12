"""FastAPI endpoints for mira_class_session (Group B)."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, require_role
from app.core.db import get_session
from app.core.exceptions import AppException
from app.core.responses import success_response
from app.schemas.mira_class_session import (
    MiraClassSessionCreate,
    MiraClassSessionListRead,
    MiraClassSessionRead,
    MiraClassSessionUpdate,
)
from app.services.mira_class_session_service import MiraClassSessionService

router = APIRouter()


@router.post("/v1/classes/{class_id}/sessions", response_model=dict)
async def create_session(
    class_id: str,
    body: MiraClassSessionCreate,
    user: AuthenticatedUser = Depends(require_role("mentor")),
    db: AsyncSession = Depends(get_session),
) -> dict:
    """Crée une nouvelle session pour une class.

    - Auth requise + role mentor
    - Auto-bascule class de validated_draft → enrichment_in_progress (1ère session)
    - Returns: JSend success avec MiraClassSessionRead
    """
    try:
        session = await MiraClassSessionService.create_session(
            class_id=class_id,
            body=body,
            mentor_user_id=user.user_id,
            db=db,
        )
        await db.commit()
        await db.refresh(session)
        return success_response(
            data=MiraClassSessionRead.model_validate(session).model_dump(),
            message="Session created successfully",
        )
    except AppException:
        raise
    except Exception as exc:
        await db.rollback()
        raise AppException(f"Failed to create session: {str(exc)}", status_code=500) from exc


@router.get("/v1/classes/{class_id}/sessions", response_model=dict)
async def list_sessions(
    class_id: str,
    user: AuthenticatedUser = Depends(require_role("mentor")),
    db: AsyncSession = Depends(get_session),
) -> dict:
    """Liste toutes les sessions d'une class (mentor seule).

    Returns: JSend success avec array of MiraClassSessionListRead
    """
    try:
        sessions = await MiraClassSessionService.list_sessions(
            class_id=class_id,
            mentor_user_id=user.user_id,
            db=db,
        )
        return success_response(
            data=[
                MiraClassSessionListRead.model_validate(s).model_dump()
                for s in sessions
            ],
            message=f"Found {len(sessions)} session(s)",
        )
    except AppException:
        raise
    except Exception as exc:
        raise AppException(f"Failed to list sessions: {str(exc)}", status_code=500) from exc


@router.get("/v1/sessions/{session_id}", response_model=dict)
async def get_session(
    session_id: str,
    user: AuthenticatedUser = Depends(require_role("mentor")),
    db: AsyncSession = Depends(get_session),
) -> dict:
    """Récupère une session (vérif ownership).

    Returns: JSend success avec MiraClassSessionRead
    """
    try:
        session = await MiraClassSessionService.get_session(
            session_id=session_id,
            mentor_user_id=user.user_id,
            db=db,
        )
        return success_response(
            data=MiraClassSessionRead.model_validate(session).model_dump(),
        )
    except AppException:
        raise
    except Exception as exc:
        raise AppException(f"Failed to retrieve session: {str(exc)}", status_code=500) from exc


@router.patch("/v1/sessions/{session_id}", response_model=dict)
async def update_session(
    session_id: str,
    body: MiraClassSessionUpdate,
    user: AuthenticatedUser = Depends(require_role("mentor")),
    db: AsyncSession = Depends(get_session),
) -> dict:
    """Met à jour une session (PATCH, tous champs optionnels).

    - Only editable when status='planned'
    - Returns: JSend success avec MiraClassSessionRead
    """
    try:
        session = await MiraClassSessionService.update_session(
            session_id=session_id,
            body=body,
            mentor_user_id=user.user_id,
            db=db,
        )
        await db.commit()
        await db.refresh(session)
        return success_response(
            data=MiraClassSessionRead.model_validate(session).model_dump(),
            message="Session updated successfully",
        )
    except AppException:
        raise
    except Exception as exc:
        await db.rollback()
        raise AppException(f"Failed to update session: {str(exc)}", status_code=500) from exc


@router.delete("/v1/sessions/{session_id}", response_model=dict)
async def delete_session(
    session_id: str,
    user: AuthenticatedUser = Depends(require_role("mentor")),
    db: AsyncSession = Depends(get_session),
) -> dict:
    """Soft-delete une session (set deleted_at).

    Returns: JSend success avec data=null
    """
    try:
        await MiraClassSessionService.delete_session(
            session_id=session_id,
            mentor_user_id=user.user_id,
            db=db,
        )
        await db.commit()
        return success_response(data=None, message="Session deleted successfully")
    except AppException:
        raise
    except Exception as exc:
        await db.rollback()
        raise AppException(f"Failed to delete session: {str(exc)}", status_code=500) from exc

