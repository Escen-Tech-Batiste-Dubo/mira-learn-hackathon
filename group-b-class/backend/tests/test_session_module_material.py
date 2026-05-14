"""Integration tests for session module materials API."""

import pytest
from httpx import AsyncClient

from app.core.auth import AuthenticatedUser, require_auth
from main import app

pytestmark = pytest.mark.asyncio(loop_scope="session")

ANTOINE_CLASS_ID = "33333333-0001-0000-0000-000000000001"


async def _fake_antoine_auth() -> AuthenticatedUser:
    return AuthenticatedUser(
        user_id="b7246959-6255-4197-b140-cb4f1a290138",
        email="antoine.martin@hackathon.test",
        role="mentor",
    )


async def test_create_and_list_module_material(client: AsyncClient) -> None:
    app.dependency_overrides[require_auth] = _fake_antoine_auth
    try:
        sess_resp = await client.post(
            f"/v1/classes/{ANTOINE_CLASS_ID}/sessions",
            json={
                "type": "virtual",
                "online_meeting_provider": "meet",
                "online_meeting_default_url": "https://meet.example.com/abc",
                "capacity": 10,
                "waitlist_enabled": True,
                "waitlist_max_size": 20,
                "price_cents": 0,
                "starts_at": "2026-07-01T10:00:00+00:00",
                "ends_at": "2026-07-01T12:00:00+00:00",
            },
        )
        assert sess_resp.status_code == 200, sess_resp.text
        session_id = sess_resp.json()["data"]["id"]

        list_m = await client.get(f"/v1/classes/{ANTOINE_CLASS_ID}/modules")
        assert list_m.status_code == 200
        mods = list_m.json()["data"]["modules"]
        next_pos = max((m["position"] for m in mods), default=0) + 1

        mod_resp = await client.post(
            f"/v1/classes/{ANTOINE_CLASS_ID}/modules",
            json={
                "position": next_pos,
                "title": "Module test matériel",
                "description": "d",
                "type": "theory",
                "duration_hours": 1.0,
            },
        )
        assert mod_resp.status_code == 201, mod_resp.text
        module_id = mod_resp.json()["data"]["module"]["id"]

        mat_resp = await client.post(
            f"/v1/classes/{ANTOINE_CLASS_ID}/sessions/{session_id}/modules/{module_id}/materials",
            json={
                "phase": "before",
                "material_type": "link",
                "material_url": "https://example.com/intro",
                "label": "Lecture intro",
                "description": "",
                "ordering": 0,
                "required": False,
            },
        )
        assert mat_resp.status_code == 201, mat_resp.text
        body = mat_resp.json()
        assert body["status"] == "success"
        assert body["data"]["material_type"] == "link"
        assert body["data"]["label"] == "Lecture intro"

        list_resp = await client.get(
            f"/v1/classes/{ANTOINE_CLASS_ID}/sessions/{session_id}/modules/{module_id}/materials",
        )
        assert list_resp.status_code == 200
        materials = list_resp.json()["data"]["materials"]
        assert len(materials) == 1
        assert materials[0]["material_url"] == "https://example.com/intro"

        counts_resp = await client.get(f"/v1/classes/{ANTOINE_CLASS_ID}/module-material-counts")
        assert counts_resp.status_code == 200
        counts = counts_resp.json()["data"]["counts"]
        assert counts.get(module_id, 0) >= 1
    finally:
        app.dependency_overrides.clear()


async def test_list_materials_empty_without_session_module_row(client: AsyncClient) -> None:
    """Avant tout matériel, pas de ligne session_module → liste vide (pas 404)."""
    app.dependency_overrides[require_auth] = _fake_antoine_auth
    try:
        sess_resp = await client.post(
            f"/v1/classes/{ANTOINE_CLASS_ID}/sessions",
            json={
                "type": "virtual",
                "online_meeting_provider": "meet",
                "online_meeting_default_url": "https://meet.example.com/abc",
                "capacity": 8,
                "waitlist_enabled": True,
                "waitlist_max_size": 10,
                "price_cents": 0,
                "starts_at": "2026-08-01T10:00:00+00:00",
                "ends_at": "2026-08-01T11:30:00+00:00",
            },
        )
        assert sess_resp.status_code == 200
        session_id = sess_resp.json()["data"]["id"]

        list_m = await client.get(f"/v1/classes/{ANTOINE_CLASS_ID}/modules")
        assert list_m.status_code == 200
        mods = list_m.json()["data"]["modules"]
        next_pos = max((m["position"] for m in mods), default=0) + 1

        mod_resp = await client.post(
            f"/v1/classes/{ANTOINE_CLASS_ID}/modules",
            json={
                "position": next_pos,
                "title": "Module vide matériel",
                "description": "x",
                "type": "practice",
                "duration_hours": 2.0,
            },
        )
        assert mod_resp.status_code == 201
        module_id = mod_resp.json()["data"]["module"]["id"]

        list_resp = await client.get(
            f"/v1/classes/{ANTOINE_CLASS_ID}/sessions/{session_id}/modules/{module_id}/materials",
        )
        assert list_resp.status_code == 200
        assert list_resp.json()["data"]["materials"] == []
    finally:
        app.dependency_overrides.clear()
