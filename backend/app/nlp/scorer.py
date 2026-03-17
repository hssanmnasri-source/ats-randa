"""
scorer.py
Score multi-critères pour le matching CV ↔ Offre.

Score final = weighted sum de 4 dimensions :
  - sémantique  (40%) : cosinus pgvector embedding
  - compétences (35%) : jaccard entre skills CV et skills requises
  - expérience  (15%) : années d'expérience vs minimum requis
  - langue      (10%) : langue requise présente dans le CV
"""
from __future__ import annotations


# Pondérations par défaut (modifiables par l'appelant)
DEFAULT_WEIGHTS = {
    "semantique":  0.40,
    "competences": 0.35,
    "experience":  0.15,
    "langue":      0.10,
}


def score_semantique(cosine_similarity: float) -> float:
    """
    pgvector retourne déjà le cosinus entre deux embeddings normalisés.
    On ramène la valeur dans [0, 1].
    """
    return max(0.0, min(1.0, float(cosine_similarity)))


def score_competences(cv_entities: dict, required_skills: list) -> float:
    """
    Jaccard entre les compétences du CV et celles requises par l'offre.
    Insensible à la casse et aux espaces.
    """
    if not required_skills:
        return 1.0  # aucune compétence requise → score parfait

    def normalize(s) -> str:
        if isinstance(s, dict):
            s = s.get("nom", "")
        return str(s).lower().strip()

    cv_skills = {
        normalize(c)
        for c in cv_entities.get("competences", [])
        if normalize(c)
    }
    req_skills = {normalize(s) for s in required_skills if normalize(s)}

    if not req_skills:
        return 1.0

    intersection = cv_skills & req_skills
    union        = cv_skills | req_skills
    return len(intersection) / len(union) if union else 0.0


def score_experience(cv_entities: dict, required_years: float) -> float:
    """
    Compare les années d'expérience du CV avec le minimum requis.
    - CV >= requis         → 1.0
    - CV = 0 et requis = 0 → 1.0
    - CV < requis          → ratio (plafonné à 1)
    """
    if required_years <= 0:
        return 1.0

    cv_years = cv_entities.get("experience_annees") or 0
    try:
        cv_years = float(cv_years)
    except (TypeError, ValueError):
        cv_years = 0.0

    return min(1.0, cv_years / required_years)


def score_langue(cv_entities: dict, required_langue: str | None) -> float:
    """
    Vérifie si la langue requise est présente dans les langues du CV.
    Retourne 1.0 si présente ou si aucune langue requise.
    """
    if not required_langue:
        return 1.0

    req = required_langue.lower().strip()

    langues = cv_entities.get("langues") or []
    for l in langues:
        if isinstance(l, dict):
            name = l.get("langue", "")
        else:
            name = str(l)
        if req in name.lower():
            return 1.0

    # Fallback : chercher dans le texte des entités
    cv_text_lang = str(cv_entities.get("langue_cv", "")).lower()
    if req in cv_text_lang:
        return 1.0

    return 0.0


def compute_final_score(
    cosine_sim: float,
    cv_entities: dict,
    required_skills: list,
    required_years: float,
    required_langue: str | None,
    weights: dict | None = None,
) -> dict:
    """
    Calcule les 4 scores individuels et le score final pondéré.

    Returns:
        {
          "score_matching":   float,  # score sémantique seul
          "score_skills":     float,
          "score_experience": float,
          "score_langue":     float,
          "score_final":      float,  # weighted sum
        }
    """
    w = weights or DEFAULT_WEIGHTS

    s_sem  = score_semantique(cosine_sim)
    s_comp = score_competences(cv_entities, required_skills)
    s_exp  = score_experience(cv_entities, required_years)
    s_lang = score_langue(cv_entities, required_langue)

    final = (
        s_sem  * w.get("semantique",  0.40) +
        s_comp * w.get("competences", 0.35) +
        s_exp  * w.get("experience",  0.15) +
        s_lang * w.get("langue",      0.10)
    )

    return {
        "score_matching":   round(s_sem,  4),
        "score_skills":     round(s_comp, 4),
        "score_experience": round(s_exp,  4),
        "score_langue":     round(s_lang, 4),
        "score_final":      round(final,  4),
    }
