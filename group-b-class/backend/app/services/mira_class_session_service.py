"""Business service for mira_class_session management."""
from datetime import datetime, timedelta

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models.mira_class import MiraClass
from app.models.mira_class_session import MiraClassSession
from app.schemas.mira_class_session import (
    MiraClassSessionCreate,
    MiraClassSessionUpdate,
)


def empty_to_none(value):
    """Convert empty strings to None."""
    if value == "":
        return None
    return value


class MiraClassSessionService:
    """Service métier pour les sessions de classe."""

    @staticmethod
    async def create_session(
        class_id: str,
        body: MiraClassSessionCreate,
        mentor_user_id: str,
        db: AsyncSession,
    ) -> MiraClassSession:
        """Crée une nouvelle session pour une class."""

        # 1. Charge la class et vérifie ownership
        result = await db.execute(
            select(MiraClass).where(MiraClass.id == class_id)
        )
        mira_class = result.scalar_one_or_none()

        if not mira_class:
            raise NotFoundError("mira_class", class_id)

        if mira_class.mentor_user_id != mentor_user_id:
            raise ValidationError(
                "Class does not belong to mentor",
                "class_id",
            )

        # 2. Vérifie le statut
        if mira_class.status not in (
            "validated_draft",
            "enrichment_in_progress",
            "published",
        ):
            raise ConflictError(
                f"Cannot add session to class in status '{mira_class.status}'. "
                "Class must be in validated_draft, enrichment_in_progress, or published state."
            )

        # 3. Normalize empty strings -> None
        location_address = empty_to_none(body.location_address)
        location_city = empty_to_none(body.location_city)
        location_country = empty_to_none(body.location_country)

        online_meeting_provider = empty_to_none(
            body.online_meeting_provider
        )
        online_meeting_default_url = empty_to_none(
            body.online_meeting_default_url
        )

        # 4. Validate type consistency
        if body.type == "virtual":

            # Virtual sessions must NOT have physical location
            if location_address is not None:
                raise ValidationError(
                    "Virtual sessions must not have location_address",
                    "location_address",
                )

            # Virtual sessions REQUIRE online fields
            if not online_meeting_provider:
                raise ValidationError(
                    "Virtual sessions require online_meeting_provider",
                    "online_meeting_provider",
                )

            if not online_meeting_default_url:
                raise ValidationError(
                    "Virtual sessions require online_meeting_default_url",
                    "online_meeting_default_url",
                )

        elif body.type in ("physical", "hybrid"):

            # Physical/hybrid sessions REQUIRE address
            if not location_address:
                raise ValidationError(
                    f"{body.type.capitalize()} sessions require location_address",
                    "location_address",
                )

        # 5. Validate dates
        if body.ends_at <= body.starts_at:
            raise ValidationError(
                "ends_at must be after starts_at",
                "ends_at",
            )

        # 6. Set default enrolment_deadline
        enrolment_deadline = body.enrolment_deadline

        if enrolment_deadline is None:
            enrolment_deadline = body.starts_at - timedelta(hours=24)

        # 7. Create session
        session = MiraClassSession(
            class_id=class_id,
            type=body.type,

            location_address=location_address,
            location_city=location_city,
            location_country=location_country,
            location_lat=body.location_lat,
            location_lng=body.location_lng,

            online_meeting_provider=online_meeting_provider,
            online_meeting_default_url=online_meeting_default_url,

            capacity=body.capacity,
            waitlist_enabled=body.waitlist_enabled,
            waitlist_max_size=body.waitlist_max_size,
            price_cents=body.price_cents,

            starts_at=body.starts_at,
            ends_at=body.ends_at,
            enrolment_deadline=enrolment_deadline,

            status="planned",
        )

        db.add(session)

        # 8. Auto-bascule la class
        if mira_class.status == "validated_draft":
            mira_class.status = "enrichment_in_progress"

        await db.flush()

        return session

    @staticmethod
    async def list_sessions(
        class_id: str,
        mentor_user_id: str,
        db: AsyncSession,
    ) -> list[MiraClassSession]:
        """Liste toutes les sessions d'une class."""

        result = await db.execute(
            select(MiraClass).where(MiraClass.id == class_id)
        )

        mira_class = result.scalar_one_or_none()

        if not mira_class:
            raise NotFoundError("mira_class", class_id)

        if mira_class.mentor_user_id != mentor_user_id:
            raise ValidationError(
                "Class does not belong to mentor",
                "class_id",
            )

        result = await db.execute(
            select(MiraClassSession)
            .where(
                and_(
                    MiraClassSession.class_id == class_id,
                    MiraClassSession.deleted_at.is_(None),
                )
            )
            .order_by(MiraClassSession.starts_at)
        )

        return result.scalars().all()

    @staticmethod
    async def list_all_sessions_for_mentor(
        mentor_user_id: str,
        db: AsyncSession,
    ) -> list[MiraClassSession]:
        """Liste toutes les sessions du mentor."""

        result_classes = await db.execute(
            select(MiraClass).where(
                MiraClass.mentor_user_id == mentor_user_id
            )
        )

        mentor_classes = result_classes.scalars().all()

        class_ids = [c.id for c in mentor_classes]

        if not class_ids:
            return []

        result = await db.execute(
            select(MiraClassSession)
            .where(
                and_(
                    MiraClassSession.class_id.in_(class_ids),
                    MiraClassSession.deleted_at.is_(None),
                )
            )
            .order_by(MiraClassSession.starts_at)
        )

        return result.scalars().all()

    @staticmethod
    async def get_session(
        session_id: str,
        mentor_user_id: str,
        db: AsyncSession,
    ) -> MiraClassSession:
        """Récupère une session."""

        result = await db.execute(
            select(MiraClassSession).where(
                MiraClassSession.id == session_id
            )
        )

        session = result.scalar_one_or_none()

        if not session:
            raise NotFoundError("mira_class_session", session_id)

        result_class = await db.execute(
            select(MiraClass).where(
                MiraClass.id == session.class_id
            )
        )

        mira_class = result_class.scalar_one_or_none()

        if not mira_class or mira_class.mentor_user_id != mentor_user_id:
            raise ValidationError(
                "Session does not belong to mentor",
                "session_id",
            )

        return session

    @staticmethod
    async def update_session(
        session_id: str,
        body: MiraClassSessionUpdate,
        mentor_user_id: str,
        db: AsyncSession,
    ) -> MiraClassSession:
        """Met à jour une session."""

        session = await MiraClassSessionService.get_session(
            session_id,
            mentor_user_id,
            db,
        )

        if session.status != "planned":
            raise ConflictError(
                f"Can only update sessions in 'planned' status. "
                f"Current status: {session.status}"
            )

        # Final values after patch
        final_type = body.type if body.type is not None else session.type

        final_location_address = empty_to_none(
            body.location_address
            if body.location_address is not None
            else session.location_address
        )

        final_online_provider = empty_to_none(
            body.online_meeting_provider
            if body.online_meeting_provider is not None
            else session.online_meeting_provider
        )

        final_online_url = empty_to_none(
            body.online_meeting_default_url
            if body.online_meeting_default_url is not None
            else session.online_meeting_default_url
        )

        # Validate type consistency
        if final_type == "virtual":

            if final_location_address is not None:
                raise ValidationError(
                    "Virtual sessions cannot have location_address",
                    "location_address",
                )

            if not final_online_provider:
                raise ValidationError(
                    "Virtual sessions require online_meeting_provider",
                    "online_meeting_provider",
                )

            if not final_online_url:
                raise ValidationError(
                    "Virtual sessions require online_meeting_default_url",
                    "online_meeting_default_url",
                )

        elif final_type in ("physical", "hybrid"):

            if not final_location_address:
                raise ValidationError(
                    "Physical/hybrid sessions require location_address",
                    "location_address",
                )

        # Validate dates
        starts = (
            body.starts_at
            if body.starts_at is not None
            else session.starts_at
        )

        ends = (
            body.ends_at
            if body.ends_at is not None
            else session.ends_at
        )

        if ends <= starts:
            raise ValidationError(
                "ends_at must be after starts_at",
                "ends_at",
            )

        # Apply patch
        update_data = body.model_dump(exclude_unset=True)

        for field, value in update_data.items():

            if isinstance(value, str):
                value = empty_to_none(value)

            setattr(session, field, value)

        await db.flush()

        return session

    @staticmethod
    async def delete_session(
        session_id: str,
        mentor_user_id: str,
        db: AsyncSession,
    ) -> None:
        """Soft-delete une session."""

        session = await MiraClassSessionService.get_session(
            session_id,
            mentor_user_id,
            db,
        )

        session.deleted_at = datetime.utcnow()

        await db.flush()