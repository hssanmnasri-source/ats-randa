"""
test_matching.py — Tests d'intégration : matching + règles métier.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestMatchingResults:

    async def test_get_results_offre_1(self, client: AsyncClient, rh_token: str):
        response = await client.get(
            "/api/rh/offers/1/matching",
            headers={"Authorization": f"Bearer {rh_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "resultats" in data
        assert data["total"] > 0

    async def test_scores_entre_0_et_1(self, client: AsyncClient, rh_token: str):
        response = await client.get(
            "/api/rh/offers/1/matching",
            headers={"Authorization": f"Bearer {rh_token}"},
        )
        results = response.json().get("resultats", [])
        assert len(results) > 0
        for r in results[:20]:
            assert 0.0 <= r["score_final"] <= 1.0, f"score_final={r['score_final']}"
            assert 0.0 <= r["score_matching"] <= 1.0
            assert 0.0 <= r["score_skills"] <= 1.0
            assert 0.0 <= r["score_experience"] <= 1.0

    async def test_resultats_tries_par_score(self, client: AsyncClient, rh_token: str):
        response = await client.get(
            "/api/rh/offers/1/matching",
            headers={"Authorization": f"Bearer {rh_token}"},
        )
        results = response.json().get("resultats", [])
        scores = [r["score_final"] for r in results]
        assert scores == sorted(scores, reverse=True), \
            "Résultats non triés par score décroissant"

    async def test_matching_sans_auth(self, client: AsyncClient):
        response = await client.get("/api/rh/offers/1/matching")
        assert response.status_code == 403

    async def test_matching_offre_inexistante(self, client: AsyncClient, rh_token: str):
        response = await client.get(
            "/api/rh/offers/99999/matching",
            headers={"Authorization": f"Bearer {rh_token}"},
        )
        assert response.status_code in (200, 404)

    async def test_filtre_decision_pending(self, client: AsyncClient, rh_token: str):
        response = await client.get(
            "/api/rh/offers/1/matching?decision=PENDING",
            headers={"Authorization": f"Bearer {rh_token}"},
        )
        assert response.status_code == 200
        results = response.json().get("resultats", [])
        for r in results:
            assert r["decision"] == "PENDING"

    async def test_candidat_a_nom_prenom(self, client: AsyncClient, rh_token: str):
        response = await client.get(
            "/api/rh/offers/1/matching",
            headers={"Authorization": f"Bearer {rh_token}"},
        )
        results = response.json().get("resultats", [])
        # Au moins quelques candidats ont un nom
        has_name = any(
            r.get("candidat_nom") or r.get("candidat_prenom")
            for r in results[:10]
        )
        assert has_name, "Aucun candidat avec nom/prénom dans les résultats"


@pytest.mark.asyncio
class TestDecisionImmutability:

    async def test_retained_preserved_after_relaunch(self, client: AsyncClient, rh_token: str):
        """RÈGLE MÉTIER : RETAINED ne doit pas être modifié par un re-matching."""
        response = await client.get(
            "/api/rh/offers/2/matching",
            headers={"Authorization": f"Bearer {rh_token}"},
        )
        results = response.json().get("resultats", [])
        retained_list = [r for r in results if r["decision"] == "RETAINED"]

        if not retained_list:
            pytest.skip("Pas de résultat RETAINED pour cette offre")

        retained = retained_list[0]
        result_id = retained["id"]

        # Re-lancer le matching
        await client.post(
            "/api/rh/offers/2/matching?force=true",
            headers={"Authorization": f"Bearer {rh_token}"},
        )

        # Vérifier que le RETAINED est toujours présent
        response2 = await client.get(
            "/api/rh/offers/2/matching",
            headers={"Authorization": f"Bearer {rh_token}"},
        )
        results2 = response2.json().get("resultats", [])
        retained2 = [r for r in results2 if r["id"] == result_id]
        assert len(retained2) == 1, "Résultat RETAINED disparu après re-matching"
        assert retained2[0]["decision"] == "RETAINED", "Décision RETAINED modifiée"

    async def test_update_decision_valide(self, client: AsyncClient, rh_token: str):
        """Tester PATCH décision sur un résultat PENDING."""
        response = await client.get(
            "/api/rh/offers/1/matching?decision=PENDING",
            headers={"Authorization": f"Bearer {rh_token}"},
        )
        results = response.json().get("resultats", [])
        if not results:
            pytest.skip("Pas de résultat PENDING disponible")

        result_id = results[0]["id"]
        patch_resp = await client.patch(
            f"/api/rh/offers/1/matching/{result_id}",
            json={"decision": "PENDING"},
            headers={"Authorization": f"Bearer {rh_token}"},
        )
        assert patch_resp.status_code == 200
        assert patch_resp.json()["decision"] == "PENDING"

    async def test_update_decision_invalide(self, client: AsyncClient, rh_token: str):
        response = await client.patch(
            "/api/rh/offers/1/matching/1",
            json={"decision": "INVALIDE"},
            headers={"Authorization": f"Bearer {rh_token}"},
        )
        assert response.status_code == 422
