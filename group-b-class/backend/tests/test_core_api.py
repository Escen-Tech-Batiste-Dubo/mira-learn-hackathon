"""Core API smoke tests for the Group B service."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health(client: AsyncClient) -> None:
    """Health check sans auth."""
    response = await client.get("/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert body["data"]["status"] == "ok"


@pytest.mark.asyncio
async def test_version(client: AsyncClient) -> None:
    """Version endpoint."""
    response = await client.get("/v1/version")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert "service" in body["data"]
    assert "build_sha" in body["data"]


@pytest.mark.asyncio
async def test_unknown_template_endpoint_is_not_exposed(client: AsyncClient) -> None:
    """Le router de demo du template n'est pas expose dans l'API Groupe B."""
    response = await client.get("/v1/examples")
    assert response.status_code == 404
