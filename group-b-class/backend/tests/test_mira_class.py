import pytest
from httpx import AsyncClient
from pydantic import ValidationError

from app.schemas.mira_class import MiraClassCreate


@pytest.mark.asyncio
async def test_list_my_classes_requires_mentor_auth(client: AsyncClient) -> None:
    response = await client.get("/v1/classes/me")

    assert response.status_code == 401
    body = response.json()
    assert body["status"] == "fail"


@pytest.mark.asyncio
async def test_create_mira_class_requires_mentor_auth(client: AsyncClient) -> None:
    response = await client.post(
        "/v1/classes",
        json={
            "title": "Pitch nomade",
            "description": "Un parcours concret pour structurer un pitch clair.",
            "skill_ids": ["11111111-1111-1111-1111-111111111111"],
            "delivery_format": "virtual",
        },
    )

    assert response.status_code == 401
    body = response.json()
    assert body["status"] == "fail"


@pytest.mark.asyncio
async def test_list_skills_requires_mentor_auth(client: AsyncClient) -> None:
    response = await client.get("/v1/skills")

    assert response.status_code == 401
    body = response.json()
    assert body["status"] == "fail"


def test_mira_class_create_rejects_empty_skill_list() -> None:
    with pytest.raises(ValidationError):
        MiraClassCreate(
            title="Pitch nomade",
            description="Un parcours concret pour structurer un pitch clair.",
            skill_ids=[],
            delivery_format="virtual",
        )
