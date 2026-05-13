"""Business service for mira_class_session management."""
from datetime import datetime, timedelta

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models.mira_class import MiraClass
from app.models.mira_class_session import MiraClassSession
from app.schemas.mira_class_session import MiraClassSessionCreate, MiraClassSessionUpdate


class MiraClassSessionService:
    """Service métier pour les sessions de classe."""

    @staticmethod
    async def create_session(
        class_id: str,
        body: MiraClassSessionCreate,
        mentor_user_id: str,
        db: AsyncSession,
    ) -> MiraClassSession:
        """Crée une nouvelle session pour une class.

        - Vérifie que la class existe et appartient au mentor
        - Vérifie que la class a le bon statut (validated_draft, enrichment_in_progress, published)
        - Auto-bascule la class de validated_draft → enrichment_in_progress
        - Crée la session en statut 'planned'
        """
        # 1. Charge la class et vérifie ownership
        result = await db.execute(
            select(MiraClass).where(MiraClass.id == class_id)
        )
        mira_class = result.scalar_one_or_none()
        if not mira_class:
            raise NotFoundError("mira_class", class_id)
        if mira_class.mentor_user_id != mentor_user_id:
            raise ValidationError("Class does not belong to mentor", "class_id")

        # 2. Vérifie le statut (la class doit être en cours d'enrichissement ou published)
        if mira_class.status not in ("validated_draft", "enrichment_in_progress", "published"):
            raise ConflictError(
                f"Cannot add session to class in status '{mira_class.status}'. "
                "Class must be in validated_draft, enrichment_in_progress, or published state."
            )

        # 3. Valide cohérence type / location
        if body.type == "virtual" and body.location_address is not None:
            raise ValidationError(
                "Virtual sessions must not have location_address",
                "location_address",
            )
        if body.type in ("physical", "hybrid") and body.location_address is None:
            raise ValidationError(
                f"{body.type.capitalize()} sessions must have location_address",
                "location_address",
            )

        # 4. Valide que ends_at > starts_at
        if body.ends_at <= body.starts_at:
            raise ValidationError(
                "ends_at must be after starts_at",
                "ends_at",
            )

        # 5. Set enrolment_deadline à starts_at - 24h si NULL
        enrolment_deadline = body.enrolment_deadline
        if enrolment_deadline is None:
            enrolment_deadline = body.starts_at - timedelta(hours=24)

        # 6. Crée la session
        session = MiraClassSession(
            class_id=class_id,
            type=body.type,
            location_address=body.location_address,
            location_city=body.location_city,
            location_country=body.location_country,
            location_lat=body.location_lat,
            location_lng=body.location_lng,
            online_meeting_provider=body.online_meeting_provider,
            online_meeting_default_url=body.online_meeting_default_url,
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

        # 7. Auto-bascule la class si elle est en validated_draft (1ère session)
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
        """Liste toutes les sessions d'une class (mentor seule)."""
        # Vérifie que la class appartient au mentor
        result = await db.execute(
            select(MiraClass).where(MiraClass.id == class_id)
        )
        mira_class = result.scalar_one_or_none()
        if not mira_class:
            raise NotFoundError("mira_class", class_id)
        if mira_class.mentor_user_id != mentor_user_id:
            raise ValidationError("Class does not belong to mentor", "class_id")

        # Liste les sessions non-supprimées
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
        """Liste toutes les sessions du mentor (toutes classes confondues)."""
        # Charge toutes les classes du mentor
        result_classes = await db.execute(
            select(MiraClass).where(MiraClass.mentor_user_id == mentor_user_id)
        )
        mentor_classes = result_classes.scalars().all()
        class_ids = [c.id for c in mentor_classes]

        if not class_ids:
            return []

        # Liste les sessions non-supprimées de toutes les classes
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
        """Récupère une session (vérif ownership)."""
        # Charge la session + sa class
        result = await db.execute(
            select(MiraClassSession).where(MiraClassSession.id == session_id)
        )
        session = result.scalar_one_or_none()
        if not session:
            raise NotFoundError("mira_class_session", session_id)

        # Vérifie ownership via la class
        result_class = await db.execute(
            select(MiraClass).where(MiraClass.id == session.class_id)
        )
        mira_class = result_class.scalar_one_or_none()
        if not mira_class or mira_class.mentor_user_id != mentor_user_id:
            raise ValidationError("Session does not belong to mentor", "session_id")

        return session

    @staticmethod
    async def update_session(
        session_id: str,
        body: MiraClassSessionUpdate,
        mentor_user_id: str,
        db: AsyncSession,
    ) -> MiraClassSession:
        """Met à jour une session (PATCH, tous champs optionnels)."""
        # Charge la session et vérifie ownership
        session = await MiraClassSessionService.get_session(session_id, mentor_user_id, db)

        # Validation : ne peut updater que si status='planned'
        if session.status != "planned":
            raise ConflictError(
                f"Can only update sessions in 'planned' status. Current status: {session.status}"
            )

        # Détermine le type final (nouveau ou ancien)
        final_type = body.type if body.type is not None else session.type

        # Valide cohérence type/location
        if final_type == "virtual":
            # Sessions virtuelles ne doivent pas avoir d'adresse
            if body.location_address is not None and body.location_address != "":
                raise ValidationError("Virtual sessions cannot have location_address", "location_address")
        else:
            # Sessions présentiel/hybride doivent avoir une adresse
            final_address = body.location_address if body.location_address is not None else session.location_address
            if not final_address:
                raise ValidationError("Physical/hybrid sessions require location_address", "location_address")

        # Valide dates
        starts = body.starts_at if body.starts_at is not None else session.starts_at
        ends = body.ends_at if body.ends_at is not None else session.ends_at
        if ends <= starts:
            raise ValidationError("ends_at must be after starts_at", "ends_at")

        # Update les champs
        if body.type is not None:
            session.type = body.type
        if body.location_address is not None:
            session.location_address = body.location_address
        if body.location_city is not None:
            session.location_city = body.location_city
        if body.location_country is not None:
            session.location_country = body.location_country
        if body.capacity is not None:
            session.capacity = body.capacity
        if body.starts_at is not None:
            session.starts_at = body.starts_at
        if body.ends_at is not None:
            session.ends_at = body.ends_at
        if body.enrolment_deadline is not None:
            session.enrolment_deadline = body.enrolment_deadline

        await db.flush()
        return session

    @staticmethod
    async def delete_session(
        session_id: str,
        mentor_user_id: str,
        db: AsyncSession,
    ) -> None:
        """Soft-delete une session (set deleted_at)."""
        session = await MiraClassSessionService.get_session(session_id, mentor_user_id, db)
        session.deleted_at = datetime.utcnow()
        await db.flush()

