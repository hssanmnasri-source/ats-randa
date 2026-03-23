"""
test_auth.py — Tests d'intégration : register + login + accès protégés.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestAuth:

    async def test_login_rh_success(self, client: AsyncClient):
        response = await client.post("/api/visitor/login", json={
            "email": "mehdi.rh@randa.tn",
            "password": "Rh2024",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["role"] == "RH"

    async def test_login_admin_success(self, client: AsyncClient):
        response = await client.post("/api/visitor/login", json={
            "email": "admin@randa.tn",
            "password": "Admin2024",
        })
        assert response.status_code == 200
        assert response.json()["role"] == "ADMIN"

    async def test_login_agent_success(self, client: AsyncClient):
        response = await client.post("/api/visitor/login", json={
            "email": "manel.agent@randa.tn",
            "password": "manel0000",
        })
        assert response.status_code == 200
        assert response.json()["role"] == "AGENT"

    async def test_login_wrong_password(self, client: AsyncClient):
        response = await client.post("/api/visitor/login", json={
            "email": "mehdi.rh@randa.tn",
            "password": "mauvaismdp",
        })
        assert response.status_code == 401

    async def test_login_unknown_email(self, client: AsyncClient):
        response = await client.post("/api/visitor/login", json={
            "email": "inconnu@example.com",
            "password": "password123",
        })
        assert response.status_code in (401, 404)

    async def test_protected_sans_token(self, client: AsyncClient):
        response = await client.get("/api/admin/users")
        assert response.status_code == 403

    async def test_protected_mauvais_role(self, client: AsyncClient, rh_token: str):
        response = await client.get(
            "/api/admin/users",
            headers={"Authorization": f"Bearer {rh_token}"},
        )
        assert response.status_code == 403

    async def test_token_invalide(self, client: AsyncClient):
        response = await client.get(
            "/api/admin/users",
            headers={"Authorization": "Bearer token.invalide.xxxx"},
        )
        assert response.status_code in (401, 403)

    async def test_register_candidat(self, client: AsyncClient):
        import time
        email = f"test.register.{int(time.time())}@example.com"
        response = await client.post("/api/visitor/register", json={
            "nom": "TestNom",
            "prenom": "TestPrenom",
            "email": email,
            "password": "password123",
        })
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["role"] == "CANDIDATE"

    async def test_register_email_duplique(self, client: AsyncClient):
        email = "mehdi.rh@randa.tn"  # email existant
        response = await client.post("/api/visitor/register", json={
            "nom": "Dup",
            "prenom": "Test",
            "email": email,
            "password": "password123",
        })
        assert response.status_code in (400, 409)
