# NLP & Matching Engine — Documentation Complète

## Vue d'ensemble

Le moteur NLP/Matching d'ATS RANDA est composé de deux pipelines distincts :

```
PIPELINE 1 — INGESTION
  Fichier (PDF / Image / Word)
       │
       ▼
  extract_text()       ← pdfplumber | Tesseract OCR | python-docx
       │
       ▼
  parse_keejob_cv()    ← regex 15+ champs
       │
       ▼
  PostgreSQL (cvs + competences + experiences)

PIPELINE 2 — MATCHING
  CV text + entities  ──► encode() ──► embedding 384-dim ──► pgvector
  Offre text          ──► encode() ──► embedding 384-dim ──┘
                                                            │
                                              cosine similarity <=>
                                                            │
                                           score multi-critères
                                                            │
                                              table resultats (rangé)
```

---

## Fichiers du pipeline NLP

### `backend/app/nlp/keejob_parser.py`
**Rôle :** Parser regex pour CVs au format Keejob (formulaire standardisé 2 colonnes).

#### Problème technique — Layout 2 colonnes
pdfplumber fusionne les colonnes ligne par ligne :
```
"Saif Eddine Ben Étude: Bac + 5"     ← nom + niveau_etude sur la même ligne
"Directeur Commercial Exp: 11 ans"   ← titre_poste + experience sur la même ligne
```
Le parser exploite ce comportement pour extraire les champs labelisés.

#### Sections détectées
```python
SECTIONS = [
    "POINTS FORTS", "EXPÉRIENCES PROFESSIONNELLES",
    "FORMATIONS", "COMPÉTENCES", "LANGUES",
    "CENTRES D'INTÉRÊTS", "LETTRE DE MOTIVATION"  # ← stop ici
]
```

#### Champs extraits (15+)

| Champ | Regex / Méthode | Exemple |
|-------|----------------|---------|
| `nom` | Texte avant "Étude:" sur la première ligne | `"Ben Ali"` |
| `prenom` | Même ligne, avant le nom | `"Mohamed"` |
| `email` | `[\w.+-]+@[\w-]+\.[a-z]{2,}` | `"m.benali@gmail.com"` |
| `telephone` | `(\+?\d[\d\s\-\.]{7,})` | `"+216 98 123 456"` |
| `age` | `(\d{2})\s*[Aa]ns?` | `32` |
| `adresse` | Label `Adresse\s*:` | `"Tunis, Tunisie"` |
| `ville` | Dernier mot de l'adresse | `"Tunis"` |
| `niveau_etude` | `[ÉE]tude\s*:\s*(.+)` | `"Bac + 5"` |
| `experience_annees` | `Exp\s*:\s*(\d+)\s*ann` | `11` |
| `situation_pro` | Label `Situation pro` | `"En poste"` |
| `disponibilite` | Label `Disponibilité` | `"Immédiatement"` |
| `permis` | Label `Permis` | `"B"` |
| `salaire` | Label `Salaire` | `"3000 TND"` |
| `titre_poste` | Ligne après entête | `"Directeur Commercial"` |
| `competences` | `findall` + niveaux | `[{"nom": "Python", "niveau": "EXPERT"}]` |
| `langues` | Une par ligne + niveau | `[{"langue": "Français", "niveau": "Courant"}]` |
| `experiences` | Détection contrat CDI/CDD/SIVP | liste de dicts |
| `formations` | 4 formats A/B/C/D | liste de dicts |

#### Mapping niveaux compétences
```python
"Débutant"       → SkillLevel.BEGINNER
"Intermédiaire"  → SkillLevel.INTERMEDIATE
"Avancé"         → SkillLevel.INTERMEDIATE
"Expert"         → SkillLevel.EXPERT
```

#### Fonction principale
```python
def parse_keejob_cv(text: str) -> dict:
    """
    Retourne un dict avec tous les champs extraits.
    Toujours retourne un dict (jamais d'exception propagée).
    """
```

---

### `backend/app/nlp/keejob_importer.py`
**Rôle :** Import bulk de CVs depuis un dossier (CLI). Gère PDF, images, Word.

#### Extraction texte — `extract_text(path)`

| Extension | Méthode |
|-----------|---------|
| `.pdf` | pdfplumber → si texte < 30 chars : fallback OCR Tesseract page/page |
| `.jpg` `.jpeg` `.png` `.bmp` `.tif` | OCR Tesseract direct (`ara+fra+eng`) |
| `.docx` | python-docx → paragraphes |
| `.doc` | antiword ou lecture bytes bruts latin-1 |

#### Flux d'import d'un fichier — `import_single_cv()`
```
extract_text(path)
      │
      ▼ (texte vide → status=error)
parse_keejob_cv(text)
      │
      ▼
candidate_repository.get_or_create()   ← dédup par email
      │
      ├── candidat nouveau → créer CV → add_competences → add_experiences
      └── candidat existant + CV existant → status=duplicate
```

#### Statuts de retour
- `imported`  — CV créé en DB
- `duplicate` — candidat déjà présent avec un CV
- `error`     — extraction ou parsing échoué
- `dry_run`   — simulation, rien écrit

#### Usage CLI
```bash
# CVs format Keejob uniquement (défaut)
python -m app.nlp.keejob_importer /data/cvs --agent-id 1

# Tous formats : PDF + images + Word
python -m app.nlp.keejob_importer /data/cvs --all-files

# Tous PDFs (pas seulement cv_keejob_*)
python -m app.nlp.keejob_importer /data/cvs --all-pdfs

# Simulation
python -m app.nlp.keejob_importer /data/cvs --dry-run
```

#### Résultats sur le jeu de données Keejob (4489 fichiers)
```
✓ Importés  : 4 130
⚠ Doublons  : 422
✗ Erreurs   : 46   (fichiers corrompus)
  TOTAL     : 4 598
```

---

### `backend/app/nlp/embedder.py`
**Rôle :** Génération d'embeddings 384-dim avec sentence-transformers.

#### Modèle utilisé
```
paraphrase-multilingual-MiniLM-L12-v2
  - Dimensions : 384
  - Langues    : 50+ (fr, ar, en inclus)
  - Taille     : ~470 MB
  - Normalisé  : oui (normalize_embeddings=True)
```

#### Fonctions

```python
def encode(text: str) -> list[float]:
    """Encode un texte → vecteur 384-dim. Texte vide → vecteur nul."""

def encode_batch(texts: list[str], batch_size: int = 64) -> list[list[float]]:
    """Batch encoding (progress bar si > 100 textes)."""

def cv_to_embed_text(cv_entities: dict, cv_text: str = "") -> str:
    """
    Construit le texte représentatif d'un CV pour l'embedding.
    Priorité : titre_poste > compétences > expériences > formations > langues
    Fallback  : cv_text[:1000] si entités vides
    Format    : "Directeur Commercial | Compétences : Python, SQL | ..."
    """

def offer_to_embed_text(offer: JobOffer) -> str:
    """Construit le texte représentatif d'une offre."""
```

#### Singleton (performance)
Le modèle est chargé une seule fois via `@lru_cache(maxsize=1)`. Les appels suivants réutilisent l'instance en mémoire.

---

### `backend/app/nlp/scorer.py`
**Rôle :** Scoring multi-critères pour le matching CV ↔ Offre.

#### Formule du score final
```
score_final = score_semantique  × 0.40
            + score_competences × 0.35
            + score_experience  × 0.15
            + score_langue      × 0.10
```

#### Détail des 4 critères

**1. Score sémantique (40%)**
```python
def score_semantique(cosine_similarity: float) -> float:
    """
    Cosinus déjà calculé par pgvector (1 - distance <=>).
    Ramené dans [0, 1].
    """
```

**2. Score compétences (35%) — Jaccard**
```python
def score_competences(cv_entities: dict, required_skills: list) -> float:
    """
    Jaccard = |intersection| / |union|
    Insensible à la casse.
    Si aucune compétence requise → 1.0 (score parfait)
    """
```

**3. Score expérience (15%)**
```python
def score_experience(cv_entities: dict, required_years: float) -> float:
    """
    Si cv_years >= required_years → 1.0
    Sinon → cv_years / required_years (ratio)
    """
```

**4. Score langue (10%)**
```python
def score_langue(cv_entities: dict, required_langue: str) -> float:
    """
    Cherche la langue requise dans cv_entities["langues"].
    1.0 si trouvée, 0.0 sinon.
    """
```

#### Exemple de résultat
```python
compute_final_score(
    cosine_sim=0.82,
    cv_entities={"competences": ["Python", "SQL"], "experience_annees": 4, ...},
    required_skills=["Python", "React"],
    required_years=3,
    required_langue="fr"
) → {
    "score_matching":   0.82,
    "score_skills":     0.333,   # 1 match sur 3 unique (Python)
    "score_experience": 1.0,     # 4 ans >= 3 ans requis
    "score_langue":     1.0,
    "score_final":      0.694    # weighted sum
}
```

---

### `backend/app/nlp/embed_existing_cvs.py`
**Rôle :** Script CLI pour backfiller les embeddings des CVs déjà en DB.

```bash
python -m app.nlp.embed_existing_cvs
python -m app.nlp.embed_existing_cvs --batch-size 128
python -m app.nlp.embed_existing_cvs --limit 500   # test sur sous-ensemble
```

**Résultat :** 4130/4130 embeddings générés (100%).

**Détail technique :** Utilise `WHERE embedding IS NULL` sans offset — après chaque commit, les CVs traités disparaissent automatiquement de la requête suivante.

---

### `backend/app/nlp/ocr.py`
**Rôle :** Interface Tesseract pour l'OCR multilingue.

```python
# Langues disponibles dans le container
tesseract --list-langs → ara, fra, eng

# Config OCR utilisée
pytesseract.image_to_string(img, lang="ara+fra+eng")
```

---

## Fichiers du pipeline Matching

### `backend/app/services/rh/matching_service.py`
**Rôle :** Orchestration complète du matching pour une offre.

#### Algorithme `run_matching(offer_id, top_n, force)`

```
1. Charger l'offre depuis DB
   └── Si déjà des résultats en DB et force=False → retourner les résultats existants

2. Générer l'embedding de l'offre si absent
   └── encode(offer_to_embed_text(offer)) → sauvegarder en DB

3. Requête pgvector (pool de 200 candidats)
   SELECT id, cv_entities, 1 - (embedding <=> offer_vec) AS cosine_sim
   FROM cvs
   WHERE embedding IS NOT NULL AND statut = 'INDEXED'
   ORDER BY embedding <=> offer_vec
   LIMIT 200

4. Scoring multi-critères pour chaque candidat
   └── compute_final_score(cosine_sim, entities, skills, years, langue)

5. Trier par score_final DESC → garder top_n

6. Supprimer anciens résultats + insérer nouveaux
   └── Résultats stockés dans table resultats avec rang

7. Retourner la liste des résultats
```

#### Paramètres
| Paramètre | Défaut | Description |
|-----------|--------|-------------|
| `top_n` | 50 | Nombre de CVs dans les résultats finaux |
| `force` | False | Recalculer si résultats existent déjà |
| `_PGVECTOR_POOL` | 200 | Candidats pré-sélectionnés par pgvector |

---

### `backend/app/api/routes/rh/matching.py`
**Rôle :** Endpoints REST pour déclencher et consulter le matching.

#### Endpoints

```
POST   /api/rh/offers/{id}/matching
       ?top_n=50&force=false
       → Lance le matching, retourne les résultats
       → Auth : RH requis

GET    /api/rh/offers/{id}/matching
       ?decision=RETAINED&skip=0&limit=50
       → Résultats paginés avec filtre décision
       → Auth : RH requis

PATCH  /api/rh/offers/{id}/matching/{result_id}
       Body: {"decision": "RETAINED" | "PENDING" | "REFUSED"}
       → Mettre à jour la décision RH sur un candidat
       → Auth : RH requis
```

#### Format de réponse POST/GET
```json
{
  "offer_id": 1,
  "titre": "Développeur Full Stack",
  "total": 50,
  "resultats": [
    {
      "id": 1,
      "id_cv": 234,
      "rang": 1,
      "score_final": 0.847,
      "score_matching": 0.92,
      "score_skills": 0.75,
      "score_experience": 1.0,
      "score_langue": 1.0,
      "decision": "PENDING",
      "date_analyse": "2026-03-17T10:30:00"
    }
  ]
}
```

---

### `backend/app/repositories/result_repository.py`
**Rôle :** Accès DB pour la table `resultats`.

```python
create_many(db, rows: list[dict])             # Insert batch résultats
list_by_offer(db, offer_id, decision, skip, limit)  # Résultats paginés
get_by_id(db, result_id)                      # Un résultat par ID
update_decision(db, result, decision)          # Mettre à jour décision RH
delete_by_offer(db, offer_id)                 # Supprimer avant re-matching
```

---

### `backend/app/tasks/cv_tasks.py` & `offer_tasks.py`
**Rôle :** Tâches Celery pour embedding asynchrone.

```python
# Embedding d'un CV (déclenché après upload)
embed_cv.delay(cv_id=123)

# Backfill batch 100 CVs sans embedding
embed_all_cvs.delay(batch_size=100)

# Embedding d'une offre (après création)
embed_offer.delay(offer_id=5)
```

---

## Structure de la table `resultats`

```sql
CREATE TABLE resultats (
    id               SERIAL PRIMARY KEY,
    id_cv            INT REFERENCES cvs(id),
    id_offre         INT REFERENCES job_offers(id),
    score_matching   FLOAT,    -- cosinus pgvector [0-1]
    score_skills     FLOAT,    -- Jaccard compétences [0-1]
    score_experience FLOAT,    -- ratio années [0-1]
    score_langue     FLOAT,    -- langue trouvée [0 ou 1]
    score_final      FLOAT,    -- weighted sum [0-1]
    rang             INT,      -- classement dans l'offre
    decision         Decision, -- RETAINED | PENDING | REFUSED
    date_analyse     TIMESTAMP
);
```

---

## Statistiques de production

| Métrique | Valeur |
|----------|--------|
| CVs total en DB | 4 130 |
| CVs avec embedding | 4 130 (100%) |
| Dimension embedding | 384 |
| Modèle | paraphrase-multilingual-MiniLM-L12-v2 |
| Langues OCR | ara + fra + eng |
| Formats supportés | PDF, PDF scanné, JPG, PNG, DOCX, DOC |
| Candidats indexés | 4 127 |
| Compétences extraites | ~18 000+ |
| Expériences extraites | ~12 000+ |

---

## Commandes utiles

```bash
# Générer les embeddings manquants
docker exec ats_backend python -m app.nlp.embed_existing_cvs --batch-size 128

# Tester le parser sur un CV
docker exec ats_backend python -c "
from app.nlp.keejob_parser import parse_keejob_cv
import pdfplumber, json
with pdfplumber.open('/app/uploads/keejob/cv_keejob_12345.pdf') as pdf:
    text = '\n'.join(p.extract_text() or '' for p in pdf.pages)
print(json.dumps(parse_keejob_cv(text), indent=2, ensure_ascii=False))
"

# Lancer le matching sur une offre (après avoir créé l'offre via API)
curl -X POST http://localhost:8000/api/rh/offers/1/matching \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"

# Vérifier les scores en DB
docker exec ats_postgres psql -U ats_user -d ats_db -c \
  "SELECT rang, score_final, score_matching, score_skills, decision
   FROM resultats WHERE id_offre=1 ORDER BY rang LIMIT 10;"
```
