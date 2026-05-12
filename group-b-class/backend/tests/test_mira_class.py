from collections.abc import AsyncIterator
from datetime import datetime, timezone
from types import SimpleNamespace

import pytest
from httpx import AsyncClient

from app.core import auth as auth_module
from app.core.auth import AuthenticatedUser, require_auth
from app.core.db import get_db
from app.services import mentor_profile_service, mira_class_service
from main import app


async def _fake_db() -> AsyncIterator[object]:
    yield object()


def _mira_class_stub(mentor_user_id: str) -> SimpleNamespace:
    now = datetime(2026, 5, 11, tzinfo=timezone.utc)
    return SimpleNamespace(
        id="33333333-0001-0000-0000-000000000001",
        application_id=None,
        mentor_user_id=mentor_user_id,
        title="Pitcher pour lever 500k",
        description="Un parcours concret pour structurer un pitch investisseur.",
        skills_taught=[
            "11111111-0001-0000-0000-000000000001",
            "11111111-0001-0000-0000-000000000002",
        ],
        total_hours_collective=8,
        total_hours_individual=2,
        total_hours=10,
        format_envisaged="both",
        rythm_pattern="weekly_session",
        target_cities=[{"name": "Barcelone", "country_code": "ES"}],
        recommended_price_per_hour_collective_cents=0,
        recommended_price_per_hour_individual_cents=0,
        status="validated_draft",
        rejection_reason=None,
        ai_assisted=False,
        source_suggestion_id=None,
        submitted_at=None,
        validated_at=now,
        published_at=None,
        archived_at=None,
        created_at=now,
        updated_at=now,
    )


@pytest.mark.asyncio
async def test_require_auth_reads_role_from_user_metadata(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_decode_jwt(token: str) -> dict[str, object]:
        return {
            "sub": "b7246959-6255-4197-b140-cb4f1a290138",
            "email": "antoine.martin@hackathon.test",
            "app_metadata": {},
            "user_metadata": {"role": "mentor"},
        }

    monkeypatch.setattr(auth_module, "_decode_jwt", fake_decode_jwt)

    user = await auth_module.require_auth("Bearer valid-token")

    assert user.user_id == "b7246959-6255-4197-b140-cb4f1a290138"
    assert user.email == "antoine.martin@hackathon.test"
    assert user.role == "mentor"


@pytest.mark.asyncio
async def test_list_my_classes_requires_mentor_auth(client: AsyncClient) -> None:
    response = await client.get("/v1/classes/me")

    assert response.status_code == 401
    body = response.json()
    assert body["status"] == "fail"


@pytest.mark.asyncio
async def test_list_my_classes_requires_mentor_role(client: AsyncClient) -> None:
    async def fake_auth() -> AuthenticatedUser:
        return AuthenticatedUser(
            user_id="aaaaaaaa-0000-0000-0000-000000000001",
            email="anna.lopez@hackathon.test",
            role="nomad",
        )

    app.dependency_overrides[require_auth] = fake_auth
    try:
        response = await client.get("/v1/classes/me")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 403
    body = response.json()
    assert body["status"] == "fail"
    assert "mentor" in body["message"]


@pytest.mark.asyncio
async def test_list_my_classes_requires_active_mentor_profile(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_auth() -> AuthenticatedUser:
        return AuthenticatedUser(
            user_id="aaaaaaaa-0000-0000-0000-000000000002",
            email="emma.rossi@hackathon.test",
            role="mentor",
        )

    async def fake_has_active_mentor_profile(db: object, user_id: str) -> bool:
        return False

    app.dependency_overrides[require_auth] = fake_auth
    app.dependency_overrides[get_db] = _fake_db
    monkeypatch.setattr(
        mentor_profile_service,
        "has_active_mentor_profile",
        fake_has_active_mentor_profile,
    )
    try:
        response = await client.get("/v1/classes/me")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 403
    body = response.json()
    assert body["status"] == "fail"
    assert body["message"] == "Forbidden: active Mira Mentor profile required"


@pytest.mark.asyncio
async def test_list_my_classes_filters_with_authenticated_mentor_id(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    antoine_user_id = "b7246959-6255-4197-b140-cb4f1a290138"
    captured_mentor_user_ids: list[str] = []

    async def fake_auth() -> AuthenticatedUser:
        return AuthenticatedUser(
            user_id=antoine_user_id,
            email="antoine.martin@hackathon.test",
            role="mentor",
        )

    async def fake_has_active_mentor_profile(db: object, user_id: str) -> bool:
        return user_id == antoine_user_id

    async def fake_list_classes_for_mentor(db: object, mentor_user_id: str) -> list[SimpleNamespace]:
        captured_mentor_user_ids.append(mentor_user_id)
        return [_mira_class_stub(mentor_user_id=mentor_user_id)]

    app.dependency_overrides[require_auth] = fake_auth
    app.dependency_overrides[get_db] = _fake_db
    monkeypatch.setattr(
        mentor_profile_service,
        "has_active_mentor_profile",
        fake_has_active_mentor_profile,
    )
    monkeypatch.setattr(
        mira_class_service,
        "list_classes_for_mentor",
        fake_list_classes_for_mentor,
    )
    try:
        response = await client.get("/v1/classes/me")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert body["data"]["total"] == 1
    assert body["data"]["items"][0]["mentor_user_id"] == antoine_user_id
    assert body["data"]["items"][0]["title"] == "Pitcher pour lever 500k"
    assert captured_mentor_user_ids == [antoine_user_id]
