"""
pytest fixtures globales.

MIGRATION HINT (post-hackathon) :
    Remplacé par `ms-common-api.testing` qui propose des fixtures pré-câblées
    (test_db, async_client, mock_auth, mock_nats, etc.).
"""
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.core.db import AsyncSessionLocal


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """HTTP test client async."""
    # WHY : import tardif — évite de charger l'app FastAPI (lifespan DB) avant les tests unitaires DB-only,
    # ce qui provoquait des conflits d'event loop (asyncpg) avec pytest-asyncio sur certaines versions Python.
    from main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def db():
    """Session DB pour tests directs (sans HTTP)."""
    async with AsyncSessionLocal() as session:
        yield session
        await session.rollback()


@pytest.fixture
def mock_auth_headers() -> dict[str, str]:
    """Headers d'auth mockés pour tests (JWT factice).

    MIGRATION HINT : en V1 prod, les tests passent par edge-gateway test ou
    injectent directement X-User-Id / X-Computed-Scopes headers.
    """
    # JWT factice — l'auth mock côté tests bypass la validation JWKS
    return {"Authorization": "Bearer FAKE_TEST_TOKEN"}
