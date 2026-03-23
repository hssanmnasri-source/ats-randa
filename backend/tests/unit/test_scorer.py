"""
test_scorer.py — Tests unitaires du scoring multi-critères.
Aucune DB requise — pure logique Python.
"""
import pytest
import numpy as np
from app.nlp.scorer import (
    compute_final_score,
    score_semantique,
    score_competences,
    score_experience,
    score_langue,
)


def _make_embedding(seed: int = 42, dim: int = 384) -> list[float]:
    """Génère un vecteur normalisé reproductible."""
    rng = np.random.RandomState(seed)
    v = rng.randn(dim).astype(np.float32)
    return (v / np.linalg.norm(v)).tolist()


class TestScoreComposants:

    def test_score_semantique_meme_vecteur(self):
        assert score_semantique(1.0) == 1.0

    def test_score_semantique_oppose(self):
        assert score_semantique(-1.0) == 0.0

    def test_score_semantique_clamp(self):
        assert 0.0 <= score_semantique(1.5) <= 1.0
        assert 0.0 <= score_semantique(-0.5) <= 1.0

    def test_score_competences_match_total(self):
        entities = {"competences": ["Python", "FastAPI", "PostgreSQL"]}
        score = score_competences(entities, ["Python", "FastAPI", "PostgreSQL"])
        assert score == 1.0

    def test_score_competences_aucune_requise(self):
        entities = {"competences": ["Python"]}
        score = score_competences(entities, [])
        assert score == 1.0  # pas de compétence requise → score parfait

    def test_score_competences_aucune_cv(self):
        entities = {"competences": []}
        score = score_competences(entities, ["Python", "React"])
        assert score == 0.0

    def test_score_competences_case_insensitive(self):
        entities = {"competences": ["python", "fastapi"]}
        score = score_competences(entities, ["Python", "FastAPI"])
        assert score == 1.0

    def test_score_competences_partiel(self):
        entities = {"competences": ["Python", "Docker"]}
        score = score_competences(entities, ["Python", "Docker", "Kubernetes", "AWS"])
        # Jaccard : intersection=2, union=4 → 0.5
        assert 0.4 < score < 0.6

    def test_score_experience_suffisante(self):
        entities = {"experience_annees": 5}
        assert score_experience(entities, 3.0) == 1.0

    def test_score_experience_exacte(self):
        entities = {"experience_annees": 3}
        assert score_experience(entities, 3.0) == 1.0

    def test_score_experience_insuffisante(self):
        entities = {"experience_annees": 1}
        s = score_experience(entities, 4.0)
        assert abs(s - 0.25) < 0.01

    def test_score_experience_plafonnee(self):
        entities = {"experience_annees": 20}
        assert score_experience(entities, 2.0) == 1.0

    def test_score_experience_aucune_requise(self):
        entities = {"experience_annees": 0}
        assert score_experience(entities, 0.0) == 1.0

    def test_score_langue_match(self):
        entities = {"langues": [{"langue": "fr", "niveau": "C1"}]}
        assert score_langue(entities, "fr") == 1.0

    def test_score_langue_mismatch(self):
        entities = {"langues": [{"langue": "ar", "niveau": "C1"}]}
        assert score_langue(entities, "fr") == 0.0

    def test_score_langue_aucune_requise(self):
        entities = {"langues": []}
        assert score_langue(entities, None) == 1.0


class TestComputeFinalScore:

    def test_score_parfait(self):
        emb = _make_embedding(1)
        scores = compute_final_score(
            cosine_sim=1.0,
            cv_entities={
                "competences": ["Python", "FastAPI"],
                "experience_annees": 5,
                "langues": [{"langue": "fr", "niveau": "C1"}],
            },
            required_skills=["Python", "FastAPI"],
            required_years=3.0,
            required_langue="fr",
        )
        assert scores["score_final"] > 0.90
        assert scores["score_skills"] == 1.0
        assert scores["score_langue"] == 1.0
        assert scores["score_experience"] == 1.0

    def test_poids_respectes(self):
        emb = _make_embedding(1)
        scores = compute_final_score(
            cosine_sim=0.75,
            cv_entities={
                "competences": ["Python"],
                "experience_annees": 5,
                "langues": [{"langue": "fr"}],
            },
            required_skills=["Python"],
            required_years=5.0,
            required_langue="fr",
        )
        expected = (
            0.40 * scores["score_matching"] +
            0.35 * scores["score_skills"] +
            0.15 * scores["score_experience"] +
            0.10 * scores["score_langue"]
        )
        assert abs(scores["score_final"] - expected) < 0.001

    def test_score_entre_0_et_1(self):
        scores = compute_final_score(
            cosine_sim=0.5,
            cv_entities={"competences": [], "experience_annees": 0, "langues": []},
            required_skills=["Python", "React"],
            required_years=2.0,
            required_langue="fr",
        )
        for key, val in scores.items():
            assert 0.0 <= val <= 1.0, f"{key} = {val} hors de [0,1]"

    def test_pas_de_competences_requises(self):
        scores = compute_final_score(
            cosine_sim=0.8,
            cv_entities={"competences": [], "experience_annees": 2, "langues": []},
            required_skills=[],
            required_years=0.0,
            required_langue=None,
        )
        assert scores["score_skills"] == 1.0
        assert scores["score_experience"] == 1.0
        assert scores["score_langue"] == 1.0

    def test_retourne_cinq_cles(self):
        scores = compute_final_score(
            cosine_sim=0.5,
            cv_entities={},
            required_skills=[],
            required_years=0,
            required_langue=None,
        )
        expected_keys = {"score_matching", "score_skills", "score_experience", "score_langue", "score_final"}
        assert set(scores.keys()) == expected_keys
