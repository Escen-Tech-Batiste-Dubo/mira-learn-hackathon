import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_my_classes_requires_mentor_auth(client: AsyncClient) -> None:
    response = await client.get("/v1/classes/me")

    assert response.status_code == 401
    body = response.json()
    assert body["status"] == "fail"
