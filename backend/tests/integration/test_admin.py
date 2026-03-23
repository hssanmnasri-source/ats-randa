"""
test_admin.py — Tests d'intégration : routes admin.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestAdminUsers:

    async def test_list_users_admin(self, client: AsyncClient, admin_token: str):
        response = await client.get(
            "/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "users" in data or isinstance(data, list) or "total" in data

    async def test_list_users_forbidden_rh(self, client: AsyncClient, rh_token: str):
        response = await client.get(
            "/api/admin/users",
            headers={"Authorization": f"Bearer {rh_token}"},
        )
        assert response.status_code == 403

    async def test_stats_admin(self, client: AsyncClient, admin_token: str):
        response = await client.get(
            "/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        # Stats doivent contenir des compteurs
        assert isinstance(data, dict)
