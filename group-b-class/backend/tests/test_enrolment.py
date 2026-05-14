"""
Tests unitaires pour les enrolements (candidatures).

Convention Hello Mira :
    - Tests unitaires pour le service (logique métier)
    - Tests d'intégration pour les endpoints HTTP
    - Couverture minimum 30%
"""
from datetime import datetime, timezone
import uuid

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models.mira_class import MiraClass
from app.models.mira_class_enrolment import MiraClassEnrolment
from app.models.mira_class_session import MiraClassSession
from app.services.enrolment_service import (
    cancel_enrolment,
    create_enrolment,
    decide_enrolment,
    get_enrolment,
    get_enrolment_for_mentor,
    list_enrolments_for_session,
)

# UUID fixes (user_id PostgreSQL)
USER_A = "550e8400-e29b-41d4-a716-446655440001"
USER_B = "550e8400-e29b-41d4-a716-446655440002"
# Owns the MiraClass created per test_session fixture (mentor-only enrolment routes).
MENTOR_USER_ID = USER_B
OTHER_MENTOR_ID = "550e8400-e29b-41d4-a716-446655440099"
LIST_USERS = [
    "550e8400-e29b-41d4-a716-446655440010",
    "550e8400-e29b-41d4-a716-446655440011",
    "550e8400-e29b-41d4-a716-446655440012",
    "550e8400-e29b-41d4-a716-446655440013",
    "550e8400-e29b-41d4-a716-446655440014",
]
CAPACITY_FILL_USERS = (
    "550e8400-e29b-41d4-a716-446655440020",
    "550e8400-e29b-41d4-a716-446655440021",
)


def _random_uuid() -> str:
    return str(uuid.uuid4())


def _enrolled_now() -> datetime:
    return datetime.now(timezone.utc)


@pytest.mark.asyncio
class Test01EnrolmentService:
    """Tests unitaires du service enrolment_service."""

    async def test_get_enrolment_success(self, db: AsyncSession, test_session: MiraClassSession) -> None:
        """Récupération d'une candidature existante."""
        enrolment = MiraClassEnrolment(
            session_id=test_session.id,
            user_id=USER_A,
            status="applied",
            application_data={"motivation": "test"},
            enrolled_at=_enrolled_now(),
        )
        db.add(enrolment)
        await db.flush()

        result = await get_enrolment(db, enrolment.id)
        assert result.id == enrolment.id
        assert result.session_id == test_session.id
        assert result.user_id == USER_A
        assert result.status == "applied"

    async def test_list_enrolments_for_session(self, db: AsyncSession, test_session: MiraClassSession) -> None:
        """Liste des candidatures d'une session."""
        enrolments = [
            MiraClassEnrolment(
                session_id=test_session.id,
                user_id=LIST_USERS[i],
                status="applied" if i % 2 == 0 else "accepted",
                application_data={"motivation": f"test {i}"},
                enrolled_at=_enrolled_now(),
            )
            for i in range(5)
        ]
        for enrolment in enrolments:
            db.add(enrolment)
        await db.flush()

        items, total = await list_enrolments_for_session(db, test_session.id, MENTOR_USER_ID)
        assert total == 5
        assert len(items) == 5

        items_applied, total_applied = await list_enrolments_for_session(
            db, test_session.id, MENTOR_USER_ID, status="applied"
        )
        assert total_applied == 3
        assert len(items_applied) == 3

    async def test_create_enrolment_success(self, db: AsyncSession, test_session: MiraClassSession) -> None:
        """Création d'une candidature réussie."""
        application_data = {"motivation": "I want to learn", "experience": "beginner"}

        enrolment = await create_enrolment(db, test_session.id, USER_A, application_data)

        assert enrolment.session_id == test_session.id
        assert enrolment.user_id == USER_A
        assert enrolment.status == "applied"
        assert enrolment.application_data == application_data
        assert enrolment.enrolled_at is not None

    async def test_create_enrolment_capacity_reached(self, db: AsyncSession, test_session: MiraClassSession) -> None:
        """Création d'une candidature quand la capacité est atteinte → waitlist."""
        test_session.capacity = 2
        await db.flush()
        now = _enrolled_now()
        for uid in CAPACITY_FILL_USERS:
            db.add(
                MiraClassEnrolment(
                    session_id=test_session.id,
                    user_id=uid,
                    status="accepted",
                    application_data={},
                    enrolled_at=now,
                )
            )
        await db.flush()

        enrolment = await create_enrolment(db, test_session.id, USER_A, {})

        assert enrolment.status == "waitlist"
        assert enrolment.waitlist_position == 1

    async def test_create_enrolment_duplicate_active(self, db: AsyncSession, test_session: MiraClassSession) -> None:
        """Création d'une candidature pour un user qui a déjà une candidature active → ConflictError."""
        existing = MiraClassEnrolment(
            session_id=test_session.id,
            user_id=USER_A,
            status="applied",
            application_data={},
            enrolled_at=_enrolled_now(),
        )
        db.add(existing)
        await db.flush()

        with pytest.raises(ConflictError):
            await create_enrolment(db, test_session.id, USER_A, {})

    async def test_cancel_enrolment_success(self, db: AsyncSession, test_session: MiraClassSession) -> None:
        """Annulation d'une candidature réussie."""
        enrolment = MiraClassEnrolment(
            session_id=test_session.id,
            user_id=USER_A,
            status="applied",
            application_data={},
            enrolled_at=_enrolled_now(),
        )
        db.add(enrolment)
        await db.flush()

        result = await cancel_enrolment(db, enrolment.id, "Changed my mind")

        assert result.status == "cancelled"
        assert result.cancellation_reason == "Changed my mind"
        assert result.cancellation_at is not None
        assert result.waitlist_position is None

    async def test_cancel_enrolment_invalid_status(self, db: AsyncSession, test_session: MiraClassSession) -> None:
        """Annulation d'une candidature dans un status invalide → ConflictError."""
        enrolment = MiraClassEnrolment(
            session_id=test_session.id,
            user_id=USER_A,
            status="completed",
            application_data={},
            enrolled_at=_enrolled_now(),
        )
        db.add(enrolment)
        await db.flush()

        with pytest.raises(ConflictError):
            await cancel_enrolment(db, enrolment.id)

    async def test_decide_enrolment_accept(self, db: AsyncSession, test_session: MiraClassSession) -> None:
        """Décision mentor : accepter une candidature."""
        enrolment = MiraClassEnrolment(
            session_id=test_session.id,
            user_id=USER_A,
            status="applied",
            application_data={},
            enrolled_at=_enrolled_now(),
        )
        db.add(enrolment)
        await db.flush()

        result = await decide_enrolment(db, enrolment.id, MENTOR_USER_ID, "accept", "Welcome!")

        assert result.status == "accepted"
        assert result.decision_by_mentor_id == MENTOR_USER_ID
        assert result.decision_reason == "Welcome!"
        assert result.decision_at is not None
        assert result.waitlist_position is None

    async def test_decide_enrolment_reject_without_reason(self, db: AsyncSession, test_session: MiraClassSession) -> None:
        """Décision mentor : rejeter sans raison → ValidationError."""
        enrolment = MiraClassEnrolment(
            session_id=test_session.id,
            user_id=USER_A,
            status="applied",
            application_data={},
            enrolled_at=_enrolled_now(),
        )
        db.add(enrolment)
        await db.flush()

        with pytest.raises(ValidationError):
            await decide_enrolment(db, enrolment.id, MENTOR_USER_ID, "reject")

    async def test_decide_enrolment_reject_with_reason(self, db: AsyncSession, test_session: MiraClassSession) -> None:
        """Décision mentor : rejeter avec raison."""
        enrolment = MiraClassEnrolment(
            session_id=test_session.id,
            user_id=USER_A,
            status="applied",
            application_data={},
            enrolled_at=_enrolled_now(),
        )
        db.add(enrolment)
        await db.flush()

        result = await decide_enrolment(db, enrolment.id, MENTOR_USER_ID, "reject", "Not suitable")

        assert result.status == "rejected"
        assert result.decision_reason == "Not suitable"

    async def test_list_enrolments_wrong_mentor(self, db: AsyncSession, test_session: MiraClassSession) -> None:
        """Mentor qui ne possède pas la class → 404 (pas de fuite d'existence)."""
        with pytest.raises(NotFoundError):
            await list_enrolments_for_session(db, test_session.id, OTHER_MENTOR_ID)

    async def test_decide_enrolment_wrong_mentor(self, db: AsyncSession, test_session: MiraClassSession) -> None:
        """Décision par un mentor non propriétaire → NotFoundError."""
        enrolment = MiraClassEnrolment(
            session_id=test_session.id,
            user_id=USER_A,
            status="applied",
            application_data={},
            enrolled_at=_enrolled_now(),
        )
        db.add(enrolment)
        await db.flush()

        with pytest.raises(NotFoundError):
            await decide_enrolment(db, enrolment.id, OTHER_MENTOR_ID, "accept")

    async def test_get_enrolment_for_mentor_success(self, db: AsyncSession, test_session: MiraClassSession) -> None:
        enrolment = MiraClassEnrolment(
            session_id=test_session.id,
            user_id=USER_A,
            status="applied",
            application_data={},
            enrolled_at=_enrolled_now(),
        )
        db.add(enrolment)
        await db.flush()

        result = await get_enrolment_for_mentor(db, enrolment.id, MENTOR_USER_ID)
        assert result.id == enrolment.id

    async def test_get_enrolment_for_mentor_wrong_mentor(self, db: AsyncSession, test_session: MiraClassSession) -> None:
        enrolment = MiraClassEnrolment(
            session_id=test_session.id,
            user_id=USER_A,
            status="applied",
            application_data={},
            enrolled_at=_enrolled_now(),
        )
        db.add(enrolment)
        await db.flush()

        with pytest.raises(NotFoundError):
            await get_enrolment_for_mentor(db, enrolment.id, OTHER_MENTOR_ID)

    async def test_get_enrolment_not_found(self, db: AsyncSession) -> None:
        """Récupération d'une candidature inexistante → NotFoundError (après tests avec test_session : évite conflit event-loop)."""
        with pytest.raises(NotFoundError):
            await get_enrolment(db, _random_uuid())


@pytest.mark.asyncio
class Test02EnrolmentEndpoints:
    """Tests d'intégration des endpoints HTTP."""

    async def test_list_session_enrolments_requires_auth(self, client: AsyncClient) -> None:
        """GET /v1/sessions/{session_id}/enrolments sans auth → 401."""
        fake_session = "00000000-0000-4000-8000-0000000000aa"
        response = await client.get(f"/v1/sessions/{fake_session}/enrolments")
        assert response.status_code == 401

    async def test_get_enrolment_detail_requires_auth(self, client: AsyncClient) -> None:
        """GET /v1/enrolments/{id} sans auth → 401."""
        response = await client.get(f"/v1/enrolments/{_random_uuid()}")
        assert response.status_code == 401

    async def test_apply_to_session_requires_auth(self, client: AsyncClient) -> None:
        """POST /v1/sessions/{session_id}/enrolments sans auth → 401."""
        fake_session = "00000000-0000-4000-8000-0000000000bb"
        response = await client.post(
            f"/v1/sessions/{fake_session}/enrolments",
            json={"application_data": {}},
        )
        assert response.status_code == 401

    async def test_cancel_enrolment_requires_auth(self, client: AsyncClient) -> None:
        """POST /v1/enrolments/{id}/cancel sans auth → 401."""
        response = await client.post(
            f"/v1/enrolments/{_random_uuid()}/cancel",
            json={},
        )
        assert response.status_code == 401

    async def test_decide_enrolment_requires_auth(self, client: AsyncClient) -> None:
        """PATCH /v1/enrolments/{id}/decision sans auth → 401."""
        response = await client.patch(
            f"/v1/enrolments/{_random_uuid()}/decision",
            json={"decision": "accept"},
        )
        assert response.status_code == 401


@pytest_asyncio.fixture
async def test_session(db: AsyncSession) -> MiraClassSession:
    """Session de test pour les enrolements (class + session uniques par test)."""
    class_id = str(uuid.uuid4())
    mira_class = MiraClass(
        id=class_id,
        mentor_user_id=MENTOR_USER_ID,
        title="Test class",
        description="",
        status="published",
    )
    db.add(mira_class)
    await db.flush()

    session = MiraClassSession(
        class_id=class_id,
        type="virtual",
        capacity=10,
        waitlist_enabled=True,
        waitlist_max_size=20,
        status="open_enrolment",
        starts_at=datetime(2026, 6, 1, 10, 0, 0, tzinfo=timezone.utc),
        ends_at=datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc),
    )
    db.add(session)
    await db.flush()
    return session
