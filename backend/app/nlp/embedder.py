"""
embedder.py
Génération d'embeddings 384-dim avec sentence-transformers.
Modèle : paraphrase-multilingual-MiniLM-L12-v2 (multilingue : fr/ar/en)
"""
from __future__ import annotations
from functools import lru_cache
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sentence_transformers import SentenceTransformer

_MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"


@lru_cache(maxsize=1)
def _get_model() -> "SentenceTransformer":
    """Charge le modèle une seule fois (singleton via lru_cache)."""
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer(_MODEL_NAME)


def encode(text: str) -> list[float]:
    """Encode un texte en vecteur 384-dim normalisé."""
    if not text or not text.strip():
        return [0.0] * 384
    vector = _get_model().encode(text, normalize_embeddings=True)
    return vector.tolist()


def encode_batch(texts: list[str], batch_size: int = 64) -> list[list[float]]:
    """Encode une liste de textes en batch."""
    if not texts:
        return []
    vectors = _get_model().encode(
        texts,
        batch_size=batch_size,
        normalize_embeddings=True,
        show_progress_bar=len(texts) > 100,
    )
    return [v.tolist() for v in vectors]


def cv_to_embed_text(cv_entities: dict, cv_text: str = "") -> str:
    """
    Construit le texte représentatif d'un CV pour l'embedding.
    Priorité : titre > compétences > expériences > formations > langues.
    """
    parts: list[str] = []

    if cv_entities.get("titre_poste"):
        parts.append(cv_entities["titre_poste"])

    if cv_entities.get("competences"):
        skills = [
            c.get("nom", c) if isinstance(c, dict) else c
            for c in cv_entities["competences"]
        ]
        parts.append("Compétences : " + ", ".join(str(s) for s in skills))

    if cv_entities.get("experiences"):
        for exp in cv_entities["experiences"][:3]:
            if isinstance(exp, dict):
                if exp.get("poste"):
                    parts.append(exp["poste"])
                if exp.get("description"):
                    parts.append(exp["description"][:200])

    if cv_entities.get("formations"):
        for f in cv_entities["formations"][:2]:
            if isinstance(f, dict) and f.get("diplome"):
                parts.append(f["diplome"])

    if cv_entities.get("langues"):
        langs = [
            l.get("langue", l) if isinstance(l, dict) else l
            for l in cv_entities["langues"]
        ]
        parts.append("Langues : " + ", ".join(str(l) for l in langs))

    # Fallback sur le texte brut
    if not parts and cv_text:
        parts.append(cv_text[:1000])

    return " | ".join(parts)


def offer_to_embed_text(offer) -> str:
    """Construit le texte représentatif d'une offre pour l'embedding."""
    parts: list[str] = []

    if offer.titre:
        parts.append(offer.titre)

    if offer.description:
        parts.append(offer.description[:500])

    if offer.competences_requises:
        skills = [
            c.get("nom", c) if isinstance(c, dict) else str(c)
            for c in offer.competences_requises
        ]
        parts.append("Compétences requises : " + ", ".join(skills))

    return " | ".join(parts)
