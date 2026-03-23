# Règles Métier — Matching ATS RANDA

## Règle 1 — Déclenchement automatique

Tout upload ou modification de CV déclenche automatiquement via Celery :
1. Génération d'un nouvel embedding (sentence-transformers, 384-dim)
2. Recalcul du matching contre toutes les offres ACTIVE
3. Création/mise à jour des résultats PENDING uniquement

**Implémentation :** `tasks.process_cv_on_upload` déclenché par :
- `services/candidate/cv_service.py` → `upload_cv()` et `create_cv_from_form()`
- `services/agent/cv_service.py` → `register_cv_upload()` et `register_cv()`

---

## Règle 2 — Immutabilité des décisions RH ⚠️ CRITIQUE

```
decision = RETAINED → jamais modifiée par recalcul automatique
decision = REFUSED  → jamais modifiée par recalcul automatique
decision = PENDING  → mise à jour à chaque recalcul
```

**Pourquoi :** Le RH a pris une décision métier sur un candidat.
Cette décision est définitive et ne doit jamais être écrasée par un recalcul technique.

**Implémentation :**
- Dans `tasks/cv_tasks.py` : vérification avant update/create
- Dans `services/rh/matching_service.py` :
  - `delete_pending_by_offer()` au lieu de `delete_by_offer()` (préserve RETAINED/REFUSED)
  - Chargement des `protected_cv_ids` avant insertion des nouveaux résultats
- Dans `repositories/result_repository.py` :
  - `delete_pending_by_offer()` — filtre `decision == PENDING`
  - `get_by_cv_offer()` — lookup par couple (cv_id, offer_id)

---

## Règle 3 — Matching hybride (RH)

Quand le RH clique "Lancer matching" :
- `force=False` (défaut) → retourne résultats existants si disponibles
- `force=True` → recalcul complet, mais avec préservation RETAINED/REFUSED

`last_matching_at` sur `job_offers` tracée à chaque matching.

---

## Règle 4 — Scoring multi-critères

| Dimension    | Poids | Méthode                                  |
|--------------|-------|------------------------------------------|
| Sémantique   | 40%   | Cosinus embedding CV ↔ offre (normalisé) |
| Compétences  | 35%   | Jaccard similarity (insensible à la casse) |
| Expérience   | 15%   | Années CV / années requises (plafonné 1) |
| Langue       | 10%   | Présence langue requise dans CV          |

Note : si `competences_requises` est vide → score_skills = 1.0 (score parfait neutre)

---

## Règle 5 — Versions CV

À chaque modification de CV : `cv_version += 1` (départ à 1).
Tracé dans `cvs.cv_version` — permet d'auditer le nombre de versions soumises.

---

## Règle 6 — Résultats triés

- Triés par `score_final DESC`
- Top 50 affichés par défaut au RH
- Candidats sans embedding ignorés du matching

---

## Colonnes DB ajoutées

| Table       | Colonne                | Type       | Description                          |
|-------------|------------------------|------------|--------------------------------------|
| `cvs`       | `cv_version`           | INTEGER    | Compteur de versions (≥ 1)           |
| `cvs`       | `updated_at`           | TIMESTAMPTZ| Dernière modification                 |
| `resultats` | `last_score_updated_at`| TIMESTAMPTZ| Dernier recalcul des scores          |
| `job_offers`| `last_matching_at`     | TIMESTAMPTZ| Dernière exécution du matching        |

---

## Celery — Tasks enregistrées

| Task name                    | Déclenchement           | Description                        |
|------------------------------|-------------------------|------------------------------------|
| `tasks.embed_cv`             | Manuel / legacy         | Embedding seul (sans matching)     |
| `tasks.embed_all_cvs`        | Manuel (batch)          | Embedding batch des CVs sans embed |
| `tasks.process_cv_on_upload` | Upload/modif CV (auto)  | Embedding + matching complet       |
