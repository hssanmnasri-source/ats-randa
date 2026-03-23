"""
conftest.py — Fixtures globales pour les tests ATS RANDA.
Utilise la DB réelle (ats_db) en lecture seule pour les tests d'intégration.
"""
import asyncio
import pytest
from httpx import AsyncClient, ASGITransport


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def client():
    from app.main import app
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


@pytest.fixture
async def rh_token(client: AsyncClient) -> str:
    response = await client.post("/api/visitor/login", json={
        "email": "mehdi.rh@randa.tn",
        "password": "Rh2024",
    })
    assert response.status_code == 200, f"Login RH échoué: {response.text}"
    return response.json()["access_token"]


@pytest.fixture
async def admin_token(client: AsyncClient) -> str:
    response = await client.post("/api/visitor/login", json={
        "email": "admin@randa.tn",
        "password": "Admin2024",
    })
    assert response.status_code == 200, f"Login Admin échoué: {response.text}"
    return response.json()["access_token"]


@pytest.fixture
async def agent_token(client: AsyncClient) -> str:
    response = await client.post("/api/visitor/login", json={
        "email": "manel.agent@randa.tn",
        "password": "manel0000",
    })
    assert response.status_code == 200, f"Login Agent échoué: {response.text}"
    return response.json()["access_token"]
