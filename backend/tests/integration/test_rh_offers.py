"""
test_rh_offers.py — Tests d'intégration : offres RH.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestRHOffers:

    async def test_list_offers_rh(self, client: AsyncClient, rh_token: str):
        response = await client.get(
            "/api/rh/offers",
            headers={"Authorization": f"Bearer {rh_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, (dict, list))

    async def test_get_offer_by_id(self, client: AsyncClient, rh_token: str):
        response = await client.get(
            "/api/rh/offers/1",
            headers={"Authorization": f"Bearer {rh_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("id") == 1
        assert "titre" in data

    async def test_get_offer_inexistante(self, client: AsyncClient, rh_token: str):
        response = await client.get(
            "/api/rh/offers/99999",
            headers={"Authorization": f"Bearer {rh_token}"},
        )
        assert response.status_code == 404

    async def test_liste_offers_publiques(self, client: AsyncClient):
        """Les offres actives sont publiques (pas d'auth requise)."""
        response = await client.get("/api/visitor/offers")
        assert response.status_code == 200
