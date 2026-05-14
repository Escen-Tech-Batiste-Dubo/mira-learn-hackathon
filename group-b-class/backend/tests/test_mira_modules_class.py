from app.core.auth import AuthenticatedUser, require_auth
from main import app
import pytest

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def _fake_antoine_auth() -> AuthenticatedUser:
    return AuthenticatedUser(
        user_id="b7246959-6255-4197-b140-cb4f1a290138",
        email="antoine.martin@hackathon.test",
        role="mentor",
    )


async def _fake_admin_auth() -> AuthenticatedUser:
    return AuthenticatedUser(
        user_id="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        email="admin@hackathon.test",
        role="admin",
    )


async def test_list_modules_returns_success_for_owned_seeded_class(client) -> None:
    app.dependency_overrides[require_auth] = _fake_antoine_auth
    try:
        response = await client.get("/v1/classes/33333333-0001-0000-0000-000000000001/modules")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    modules = body["data"]["modules"]
    assert isinstance(modules, list)
    assert [module["position"] for module in modules] == sorted(
        module["position"] for module in modules
    )
    assert all(
        module["class_id"] == "33333333-0001-0000-0000-000000000001" for module in modules
    )
    for module in modules:
        assert "quiz_count" in module
        assert isinstance(module["quiz_count"], int)
        assert module["quiz_count"] in (0, 1)


async def test_admin_cannot_access_mentor_modules_route(client) -> None:
    app.dependency_overrides[require_auth] = _fake_admin_auth
    try:
        response = await client.get("/v1/classes/33333333-0001-0000-0000-000000000001/modules")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 403
    body = response.json()
    assert body["status"] == "fail"
    assert body["data"]["detail"] == "Forbidden: requires role in ('mentor',)"


async def test_reorder_modules_returns_200_jsend(client) -> None:
    """PATCH reorder doit sérialiser sans MissingGreenlet (refresh post-commit)."""
    app.dependency_overrides[require_auth] = _fake_antoine_auth
    try:
        list_resp = await client.get("/v1/classes/33333333-0001-0000-0000-000000000001/modules")
        assert list_resp.status_code == 200
        modules = list_resp.json()["data"]["modules"]
        if len(modules) < 2:
            return
        ids = [m["id"] for m in sorted(modules, key=lambda x: x["position"])]
        rev = list(reversed(ids))
        reorder_resp = await client.patch(
            "/v1/classes/33333333-0001-0000-0000-000000000001/modules/reorder",
            json={"module_ids_in_order": rev},
        )
    finally:
        app.dependency_overrides.clear()

    assert reorder_resp.status_code == 200
    body = reorder_resp.json()
    assert body["status"] == "success"
    out = body["data"]["modules"]
    assert [m["id"] for m in sorted(out, key=lambda x: x["position"])] == rev
    for m in out:
        assert "quiz_count" in m
        assert isinstance(m["quiz_count"], int)
        assert m["quiz_count"] in (0, 1)
