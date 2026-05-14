"""
Tests unitaires pour les enrolements (candidatures).

Convention Hello Mira :
    - Tests unitaires pour le service (logique métier)
    - Tests d'intégration pour les endpoints HTTP
    - Couverture minimum 30%
"""
from datetime import datetime, timezone

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models.mira_class_enrolment import MiraClassEnrolment
from app.models.mira_class_session import MiraClassSession
from app.services.enrolment_service import (
    cancel_enrolment,
    create_enrolment,
    decide_enrolment,
    get_enrolment,
    list_enrolments_for_session,
)

# UUID fixes (user_id / class_id PostgreSQL)
CLASS_ID = "550e8400-e29b-41d4-a716-446655440000"
USER_A = "550e8400-e29b-41d4-a716-446655440001"
USER_B = "550e8400-e29b-41d4-a716-446655440002"
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
UNKNOWN_ENROLMENT_ID = "00000000-0000-4000-8000-000000000001"
UNKNOWN_ENROLMENT_ID_HTTP = "00000000-0000-4000-8000-000000000099"


def _enrolled_now() -> datetime:
    return datetime.now(timezone.utc)


@pytest.mark.asyncio
class TestEnrolmentService:
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

    async def test_get_enrolment_not_found(self, db: AsyncSession) -> None:
        """Récupération d'une candidature inexistante → NotFoundError."""
        with pytest.raises(NotFoundError):
            await get_enrolment(db, UNKNOWN_ENROLMENT_ID)

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

        items, total = await list_enrolments_for_session(db, test_session.id)
        assert total == 5
        assert len(items) == 5

        items_applied, total_applied = await list_enrolments_for_session(
            db, test_session.id, status="applied"
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

        result = await decide_enrolment(db, enrolment.id, USER_B, "accept", "Welcome!")

        assert result.status == "accepted"
        assert result.decision_by_mentor_id == USER_B
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
            await decide_enrolment(db, enrolment.id, USER_B, "reject")

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

        result = await decide_enrolment(db, enrolment.id, USER_B, "reject", "Not suitable")

        assert result.status == "rejected"
        assert result.decision_reason == "Not suitable"


@pytest.mark.asyncio
class TestEnrolmentEndpoints:
    """Tests d'intégration des endpoints HTTP."""

    async def test_list_session_enrolments_requires_auth(self, client: AsyncClient, test_session: MiraClassSession) -> None:
        """GET /v1/sessions/{session_id}/enrolments sans auth → 401."""
        response = await client.get(f"/v1/sessions/{test_session.id}/enrolments")
        assert response.status_code == 401

    async def test_get_enrolment_detail_requires_auth(self, client: AsyncClient) -> None:
        """GET /v1/enrolments/{id} sans auth → 401."""
        response = await client.get(f"/v1/enrolments/{UNKNOWN_ENROLMENT_ID_HTTP}")
        assert response.status_code == 401

    async def test_apply_to_session_requires_auth(self, client: AsyncClient, test_session: MiraClassSession) -> None:
        """POST /v1/sessions/{session_id}/enrolments sans auth → 401."""
        response = await client.post(
            f"/v1/sessions/{test_session.id}/enrolments",
            json={"application_data": {}},
        )
        assert response.status_code == 401

    async def test_cancel_enrolment_requires_auth(self, client: AsyncClient) -> None:
        """POST /v1/enrolments/{id}/cancel sans auth → 401."""
        response = await client.post(
            f"/v1/enrolments/{UNKNOWN_ENROLMENT_ID_HTTP}/cancel",
            json={},
        )
        assert response.status_code == 401

    async def test_decide_enrolment_requires_auth(self, client: AsyncClient) -> None:
        """PATCH /v1/enrolments/{id}/decision sans auth → 401."""
        response = await client.patch(
            f"/v1/enrolments/{UNKNOWN_ENROLMENT_ID_HTTP}/decision",
            json={"decision": "accept"},
        )
        assert response.status_code == 401


@pytest_asyncio.fixture
async def test_session(db: AsyncSession) -> MiraClassSession:
    """Session de test pour les enrolements."""
    session = MiraClassSession(
        class_id=CLASS_ID,
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
