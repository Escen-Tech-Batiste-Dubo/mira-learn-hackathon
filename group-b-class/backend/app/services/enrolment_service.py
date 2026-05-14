from datetime import datetime, timezone
from typing import Any, Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models.mira_class import MiraClass
from app.models.mira_class_enrolment import MiraClassEnrolment
from app.models.mira_class_session import MiraClassSession
from app.schemas.enrolment import DecisionType, EnrolmentStatus


async def _assert_session_owned_by_mentor(
    db: AsyncSession,
    session_id: str,
    mentor_user_id: str,
) -> MiraClassSession:
    """Mentor routes only: session must exist and belong to mentor's class (404 if not)."""
    stmt = (
        select(MiraClassSession)
        .join(MiraClass, MiraClass.id == MiraClassSession.class_id)
        .where(
            MiraClassSession.id == session_id,
            MiraClassSession.deleted_at.is_(None),
            MiraClass.deleted_at.is_(None),
            MiraClass.mentor_user_id == mentor_user_id,
        )
    )
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()
    if session is None:
        raise NotFoundError(resource="MiraClassSession", identifier=session_id)
    return session


async def _get_session(db: AsyncSession, session_id: str) -> MiraClassSession:
    stmt = select(MiraClassSession).where(MiraClassSession.id == session_id)
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()
    if not session:
        raise NotFoundError(resource="MiraClassSession", identifier=session_id)
    return session


async def _refresh_session_counters(db: AsyncSession, session_id: str) -> tuple[int, int]:
    stmt_accepted = select(func.count()).select_from(MiraClassEnrolment).where(
        MiraClassEnrolment.session_id == session_id,
        MiraClassEnrolment.status == "accepted",
    )
    stmt_waitlist = select(func.count()).select_from(MiraClassEnrolment).where(
        MiraClassEnrolment.session_id == session_id,
        MiraClassEnrolment.status == "waitlist",
    )

    accepted = (await db.execute(stmt_accepted)).scalar_one() or 0
    waitlist = (await db.execute(stmt_waitlist)).scalar_one() or 0

    session = await _get_session(db, session_id)
    session.enrolment_count = accepted
    session.waitlist_count = waitlist
    await db.flush()

    return accepted, waitlist


async def _next_waitlist_position(db: AsyncSession, session_id: str) -> int:
    stmt = select(func.max(MiraClassEnrolment.waitlist_position)).where(
        MiraClassEnrolment.session_id == session_id,
        MiraClassEnrolment.status == "waitlist",
    )
    current_max = (await db.execute(stmt)).scalar_one()
    return (current_max or 0) + 1


async def get_enrolment(db: AsyncSession, enrolment_id: str) -> MiraClassEnrolment:
    stmt = select(MiraClassEnrolment).where(MiraClassEnrolment.id == enrolment_id)
    result = await db.execute(stmt)
    enrolment = result.scalar_one_or_none()
    if not enrolment:
        raise NotFoundError(resource="MiraClassEnrolment", identifier=enrolment_id)
    return enrolment


async def get_enrolment_for_mentor(
    db: AsyncSession,
    enrolment_id: str,
    mentor_user_id: str,
) -> MiraClassEnrolment:
    """GET enrolment detail (mentor): same 404 if enrolment missing or not owned by mentor."""
    enrolment = await get_enrolment(db, enrolment_id)
    await _assert_session_owned_by_mentor(db, enrolment.session_id, mentor_user_id)
    return enrolment


async def list_enrolments_for_session(
    db: AsyncSession,
    session_id: str,
    mentor_user_id: str,
    status: EnrolmentStatus | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[Sequence[MiraClassEnrolment], int]:
    await _assert_session_owned_by_mentor(db, session_id, mentor_user_id)

    stmt = select(MiraClassEnrolment).where(
        MiraClassEnrolment.session_id == session_id,
    )
    if status is not None:
        stmt = stmt.where(MiraClassEnrolment.status == status)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar_one() or 0

    stmt = stmt.order_by(MiraClassEnrolment.enrolled_at.desc()).offset(offset).limit(limit)
    result = await db.execute(stmt)
    items = result.scalars().all()
    return items, total


async def create_enrolment(
    db: AsyncSession,
    session_id: str,
    user_id: str,
    application_data: dict[str, Any],
) -> MiraClassEnrolment:
    session = await _get_session(db, session_id)
    if session.status != "open_enrolment":
        raise ConflictError("Session is not open for enrolment")

    existing_stmt = select(MiraClassEnrolment).where(
        MiraClassEnrolment.session_id == session_id,
        MiraClassEnrolment.user_id == user_id,
        MiraClassEnrolment.status.notin_(["cancelled", "rejected"]),
    )
    existing = (await db.execute(existing_stmt)).scalar_one_or_none()
    if existing:
        raise ConflictError("User already has an active enrolment for this session")

    accepted, waitlist = await _refresh_session_counters(db, session_id)
    status = "applied"
    waitlist_position = None

    if accepted >= session.capacity:
        if not session.waitlist_enabled:
            raise ConflictError("Session capacity reached and waitlist is disabled")
        status = "waitlist"
        waitlist_position = await _next_waitlist_position(db, session_id)

    enrolment = MiraClassEnrolment(
        session_id=session_id,
        user_id=user_id,
        status=status,
        waitlist_position=waitlist_position,
        application_data=application_data or {},
        enrolled_at=datetime.now(timezone.utc),
    )
    db.add(enrolment)
    await db.flush()
    await _refresh_session_counters(db, session_id)
    return enrolment


async def cancel_enrolment(
    db: AsyncSession,
    enrolment_id: str,
    cancellation_reason: str | None = None,
) -> MiraClassEnrolment:
    enrolment = await get_enrolment(db, enrolment_id)
    if enrolment.status in ("cancelled", "rejected", "completed"):
        raise ConflictError(f"Enrolment cannot be cancelled from status {enrolment.status}")

    enrolment.status = "cancelled"
    enrolment.cancellation_at = datetime.now(timezone.utc)
    enrolment.cancellation_reason = cancellation_reason
    enrolment.waitlist_position = None
    await db.flush()
    await _refresh_session_counters(db, enrolment.session_id)
    return enrolment


async def decide_enrolment(
    db: AsyncSession,
    enrolment_id: str,
    mentor_id: str,
    decision: DecisionType,
    reason: str | None = None,
) -> MiraClassEnrolment:
    enrolment = await get_enrolment(db, enrolment_id)
    await _assert_session_owned_by_mentor(db, enrolment.session_id, mentor_id)

    if enrolment.status not in ("applied", "waitlist"):
        raise ConflictError(f"Enrolment cannot be decided from status {enrolment.status}")

    if decision == "reject":
        if not reason:
            raise ValidationError("decision_reason is required when rejecting an enrolment")
        enrolment.status = "rejected"
        enrolment.waitlist_position = None
        enrolment.decision_reason = reason
    elif decision == "accept":
        enrolment.status = "accepted"
        enrolment.waitlist_position = None
        enrolment.decision_reason = reason
    elif decision == "waitlist":
        enrolment.status = "waitlist"
        enrolment.decision_reason = reason
        enrolment.waitlist_position = await _next_waitlist_position(db, enrolment.session_id)
    else:
        raise ValidationError(f"Unsupported decision type: {decision}")

    enrolment.decision_at = datetime.now(timezone.utc)
    enrolment.decision_by_mentor_id = mentor_id
    await db.flush()
    await _refresh_session_counters(db, enrolment.session_id)
    return enrolment
