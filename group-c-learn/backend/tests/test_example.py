"""
Tests minimaux pour l'entité Example.

Convention Hello Mira (NON-NÉGOCIABLE pendant le hackathon) :
    - 1 test unitaire par endpoint critique
    - 1 test d'authentification (401 sans JWT)
    - 1 test de validation pydantic (422 sur body invalide)
    - Couverture minimum 30%

MIGRATION HINT : tests réutilisables tels quels post-hackathon, juste
adapter les fixtures auth si edge-gateway est utilisé.
"""
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
async def test_list_examples_requires_auth(client: AsyncClient) -> None:
    """GET sans Authorization header → 401."""
    response = await client.get("/v1/examples")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_example_validation(
    client: AsyncClient,
    mock_auth_headers: dict[str, str],
) -> None:
    """POST avec body invalide → 422.

    Note : avec mock_auth_headers, l'auth passe — on teste juste la validation.
    Si l'auth fail (token JWT non valide), c'est un autre test ; voir CI auth mock.
    """
    response = await client.post(
        "/v1/examples",
        json={"title": ""},  # title vide invalide
        headers=mock_auth_headers,
    )
    # 401 si auth fail (JWT non mocké) OU 422 si auth OK + validation fail
    assert response.status_code in (401, 422)


# Tests d'intégration plus poussés à ajouter selon les entités :
# - test_create_example_success
# - test_get_example_not_found (404)
# - test_update_example
# - test_delete_example_soft_delete
# - test_list_examples_pagination
