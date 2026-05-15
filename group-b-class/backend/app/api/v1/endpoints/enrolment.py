from typing import cast

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, require_auth, require_role
from app.core.db import get_db
from app.core.responses import success_response
from app.models.mira_class_session import MiraClassSession
from app.schemas.enrolment import (
    EnrolmentCancel,
    EnrolmentCreate,
    EnrolmentDecisionRequest,
    EnrolmentDecisionResult,
    EnrolmentListItem,
    EnrolmentListResponse,
    EnrolmentRead,
    EnrolmentStatus,
    MentorEnrolmentListItem,
    MentorEnrolmentListResponse,
)
from app.services.enrolment_service import (
    cancel_enrolment,
    create_enrolment,
    decide_enrolment,
    get_enrolment,
    get_enrolment_for_mentor,
    list_enrolments_for_mentor_aggregate,
    list_enrolments_for_session,
)

router = APIRouter()


@router.get("/me/enrolments", summary="Lister toutes les candidatures (vue mentor agrégée)")
async def list_my_enrolments_aggregate(
    status: EnrolmentStatus | None = Query(default=None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role("mentor")),
) -> dict:
    offset = (page - 1) * page_size
    rows, total = await list_enrolments_for_mentor_aggregate(
        db,
        mentor_user_id=user.user_id,
        status=status,
        limit=page_size,
        offset=offset,
    )
    items: list[MentorEnrolmentListItem] = []
    for enrolment, session, cls in rows:
        items.append(
            MentorEnrolmentListItem(
                id=enrolment.id,
                session_id=enrolment.session_id,
                class_id=cls.id,
                class_title=cls.title,
                session_starts_at=session.starts_at,
                session_status=session.status,
                location_city=session.location_city,
                location_country=session.location_country,
                user_id=enrolment.user_id,
                status=cast(EnrolmentStatus, enrolment.status),
                waitlist_position=enrolment.waitlist_position,
                enrolled_at=enrolment.enrolled_at,
                decision_at=enrolment.decision_at,
                decision_reason=enrolment.decision_reason,
            )
        )
    return success_response(
        data=MentorEnrolmentListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            has_more=offset + len(items) < total,
        ).model_dump(mode="json"),
    )


@router.get("/sessions/{session_id}/enrolments", summary="Lister les candidatures d'une session")
async def list_session_enrolments(
    session_id: str,
    status: EnrolmentStatus | None = Query(default=None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role("mentor")),
) -> dict:
    offset = (page - 1) * page_size
    items, total = await list_enrolments_for_session(
        db,
        session_id=session_id,
        mentor_user_id=user.user_id,
        status=status,
        limit=page_size,
        offset=offset,
    )
    return success_response(
        data=EnrolmentListResponse(
            items=[
                EnrolmentListItem(
                    id=e.id,
                    session_id=e.session_id,
                    user_id=e.user_id,
                    status=cast(EnrolmentStatus, e.status),
                    waitlist_position=e.waitlist_position,
                    enrolled_at=e.enrolled_at,
                    decision_at=e.decision_at,
                    decision_reason=e.decision_reason,
                )
                for e in items
            ],
            total=total,
            page=page,
            page_size=page_size,
            has_more=offset + len(items) < total,
        ).model_dump(),
    )


@router.get("/enrolments/{enrolment_id}", summary="Détail d'une candidature")
async def get_enrolment_detail(
    enrolment_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role("mentor")),
) -> dict:
    enrolment = await get_enrolment_for_mentor(db, enrolment_id, user.user_id)
    return success_response(data=EnrolmentRead.model_validate(enrolment).model_dump())


@router.post(
    "/sessions/{session_id}/enrolments",
    status_code=status.HTTP_201_CREATED,
    summary="Postuler à une session",
)
async def apply_to_session(
    session_id: str,
    body: EnrolmentCreate,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_auth),
) -> dict:
    enrolment = await create_enrolment(db, session_id, user.user_id, body.application_data)
    return success_response(data=EnrolmentRead.model_validate(enrolment).model_dump())


@router.post("/enrolments/{enrolment_id}/cancel", summary="Annuler une candidature")
async def cancel_enrolment_endpoint(
    enrolment_id: str,
    body: EnrolmentCancel,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_auth),
) -> dict:
    enrolment = await get_enrolment(db, enrolment_id)
    if enrolment.user_id != user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    enrolment = await cancel_enrolment(db, enrolment_id, body.cancellation_reason)
    return success_response(data=EnrolmentRead.model_validate(enrolment).model_dump())


@router.patch("/enrolments/{enrolment_id}/decision", summary="Décision mentor sur une candidature")
async def decide_enrolment_endpoint(
    enrolment_id: str,
    body: EnrolmentDecisionRequest,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role("mentor")),
) -> dict:
    enrolment = await decide_enrolment(db, enrolment_id, user.user_id, body.decision, body.reason)
    decision_at = enrolment.decision_at
    if decision_at is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Enrolment decision invariant violated",
        )

    session_stmt = select(MiraClassSession).where(MiraClassSession.id == enrolment.session_id)
    session_result = await db.execute(session_stmt)
    session = session_result.scalar_one_or_none()
    session_enrolment_count = session.enrolment_count if session else 0
    session_waitlist_count = session.waitlist_count if session else 0

    return success_response(
        data=EnrolmentDecisionResult(
            enrolment_id=enrolment.id,
            new_status=cast(EnrolmentStatus, enrolment.status),
            decision_at=decision_at,
            session_enrolment_count=session_enrolment_count,
            session_waitlist_count=session_waitlist_count,
        ).model_dump(),
    )
