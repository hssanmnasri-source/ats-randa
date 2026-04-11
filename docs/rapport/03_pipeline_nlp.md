# Pipeline NLP et Intelligence Artificielle

## 4.1 Vue d'ensemble du pipeline

Le pipeline NLP d'ATS RANDA couvre le cycle complet de traitement d'un document CV, depuis le fichier PDF brut jusqu'au résultat de matching stocké en base de données.

```
┌─────────────────────────────────────────────────────────────────────┐
│                       FICHIER PDF (upload)                          │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTRACTION TEXTE (ocr.py)                        │
│                                                                     │
│  PDF numérique ──→ pdfplumber (extraction directe)                  │
│  PDF scanné    ──→ Tesseract OCR (fra+eng+ara, PSM 6 ou PSM 3)     │
│  Image JPG/PNG ──→ Tesseract OCR                                    │
│                                                                     │
│  Évaluation qualité : score 0-100 + niveau + conseils               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ texte brut
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       PARSING (parser.py)                           │
│                                                                     │
│  Format Keejob ──→ keejob_parser.py (regex, 15+ entités)           │
│  Format générique → general_cv_parser.py + generic_parser.py       │
│  Détection langue → language_detector.py (fr/en/ar)                │
│                                                                     │
│  Sortie : cv_entities (dict JSON)                                   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ cv_entities
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    GÉNÉRATION EMBEDDING (embedder.py)               │
│                                                                     │
│  cv_to_embed_text(cv_entities, cv_text) → texte structuré          │
│  Modèle : paraphrase-multilingual-MiniLM-L12-v2                     │
│  Sortie : vecteur 384-dim normalisé                                 │
│                                                                     │
│  ⚠ Toujours exécuté via run_in_executor (CPU-bound synchrone)      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ embedding 384-dim
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   STOCKAGE pgvector (PostgreSQL)                    │
│                                                                     │
│  cvs.embedding = vector(384)                                        │
│  Index ivfflat sur cvs.embedding (distance cosinus)                │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
          ┌────────────────────▼─────────────────────┐
          │         DÉCLENCHEMENT MATCHING            │
          │         (route POST /api/rh/offers/{id}/matching) │
          └────────────────────┬─────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│               PRÉ-FILTRE pgvector (top 200)                         │
│                                                                     │
│  SELECT id FROM cvs                                                 │
│  ORDER BY embedding <=> :offer_embedding                            │
│  LIMIT 200                                                          │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ 200 cv_ids proches
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│              SCORING MULTI-CRITÈRES (scorer.py)                     │
│                                                                     │
│  Pour chaque CV (200 max) :                                         │
│  ├── score_semantique = cosinus(cv_embed, offer_embed)    [40%]    │
│  ├── score_competences = Jaccard(cv_skills, offer_skills) [35%]    │
│  ├── score_experience = min(cv_years / req_years, 1.0)   [15%]    │
│  └── score_langue = binary(langue requise ∈ cv_langues)  [10%]    │
│                                                                     │
│  score_final = Σ (score_i × poids_i)                               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ top 50 résultats
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│              STOCKAGE RÉSULTATS (table resultats)                   │
│                                                                     │
│  Création ou mise à jour des enregistrements Resultat               │
│  decision = PENDING (jamais écrasé si RETAINED/REFUSED)             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4.2 Parsing des CVs

### Parser Keejob (`keejob_parser.py`)

Le format Keejob est un format PDF structuré utilisé par la plateforme d'emploi tunisienne Keejob.tn. Le parser utilise des expressions régulières calibrées sur ce format spécifique.

**Entités extraites** :

| Entité | Type | Description |
|--------|------|-------------|
| `id_keejob` | `str` | Identifiant unique Keejob |
| `titre_poste` | `str` | Intitulé du poste souhaité |
| `nom` | `str` | Nom de famille |
| `prenom` | `str` | Prénom |
| `age` | `int` | Âge (en années) |
| `email` | `str` | Adresse email |
| `telephone` | `str` | Numéro de téléphone |
| `adresse` | `str` | Adresse postale complète |
| `code_postal` | `str` | Code postal |
| `ville` | `str` | Ville de résidence |
| `niveau_etude` | `str` | Niveau d'études normalisé |
| `experience_annees` | `float` | Années d'expérience totales |
| `situation_pro` | `str` | Statut professionnel |
| `disponibilite` | `str` | Délai de disponibilité |
| `permis_conduire` | `bool` | Possession d'un permis |
| `salaire_souhaite` | `str` | Prétentions salariales |

**Entités imbriquées** :

```
competences: [{ nom: str, niveau: BEGINNER|INTERMEDIATE|EXPERT }]
experiences: [{ poste, entreprise, date_debut, date_fin, type_contrat, description }]
formations:  [{ diplome, etablissement, annee }]
langues:     [{ langue, niveau: BEGINNER|INTERMEDIATE|EXPERT }]
```

**Normalisation du niveau d'études** :

| Texte brut Keejob | Valeur normalisée |
|-------------------|-------------------|
| primaire, secondaire, bac | `BAC` |
| bac + 2 | `BAC+2` |
| bac + 3 | `BAC+3` |
| bac + 5, master, ingénieur | `BAC+5` |
| doctorat | `Doctorat` |

**Types de contrats reconnus** : CDI, CDD, SIVP, Stage, Freelance, Alternance.

### Parsers génériques

Pour les CVs non-Keejob (format `CANDIDAT` ou `AGENT` hors Keejob) :
- `general_cv_parser.py` : parser principal pour les CVs de format libre en français/anglais.
- `generic_parser.py` : parseur de repli pour les cas non couverts.
- `extractor.py` : utilitaires d'extraction de champs spécifiques (email, téléphone, dates).

### Détection de langue (`language_detector.py`)

Détecte la langue dominante du CV parmi : **français**, **anglais**, **arabe**. La détection se base sur une analyse statistique des n-grammes et des mots-clés. Le résultat est utilisé lors de la construction du texte d'embedding et du scoring de langue.

---

## 4.3 Embeddings sémantiques

### Modèle utilisé

**`paraphrase-multilingual-MiniLM-L12-v2`** (sentence-transformers)

| Caractéristique | Valeur |
|----------------|--------|
| Fournisseur | Hugging Face (UKPLab) |
| Architecture | MiniLM-L12 (couches Transformer réduites) |
| Paramètres | ~66 millions |
| Dimensions de sortie | 384 |
| Langues supportées | 50+ (dont français, anglais, arabe) |
| Métrique de similarité | Cosinus |
| Normalisation | Automatique (vecteurs unitaires) |

**Pourquoi ce modèle** :
- **Multilingue natif** : un seul modèle gère les CVs en français, anglais et arabe sans prétraitement de langue.
- **Léger** : taille réduite par rapport aux modèles BERT complets, inférence CPU viable.
- **Qualité** : excellents benchmarks sur des tâches de similarité sémantique en contexte professionnel.
- **Normalisation** : les vecteurs sortant sont déjà normalisés, ce qui rend la distance cosinus équivalente au produit scalaire (simplification de la requête pgvector).

### Construction du texte d'embedding

La fonction `cv_to_embed_text(cv_entities, cv_text)` construit une représentation textuelle prioritisée du CV :

```
[titre_poste]
[compétences séparées par virgules]
[expériences : "poste chez entreprise (date_debut–date_fin)"]
[formations : "diplome, etablissement, annee"]
[langues : "langue (niveau)"]
```

La fonction `offer_to_embed_text(offer)` construit la représentation de l'offre :
```
[titre]
[description tronquée à 500 caractères]
[compétences requises séparées par virgules]
```

### Stockage dans pgvector

Les vecteurs sont stockés dans la colonne `embedding vector(384)` des tables `cvs` et `job_offers`. Un index `ivfflat` accélère les requêtes de recherche des plus proches voisins :

```sql
CREATE INDEX ON cvs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

Le paramètre `lists = 100` partitionne l'espace vectoriel en 100 clusters pour la recherche approximative (compromis vitesse/précision).

### Règle critique : run_in_executor

Le modèle sentence-transformers est **synchrone et CPU-bound** : une inférence monopolise le thread Python pendant ~20–50 ms. Dans une application FastAPI asynchrone, appeler `encode()` directement depuis un handler `async def` bloquerait la boucle asyncio entière — toutes les autres requêtes (y compris les simples GET) seraient gelées jusqu'à la fin de l'inférence.

**La règle obligatoire** :

```python
# ✗ INCORRECT — bloque toutes les requêtes concurrentes
embedding = encode(text)

# ✓ CORRECT — délègue au thread pool OS
import asyncio
loop = asyncio.get_event_loop()
embedding = await loop.run_in_executor(None, encode, text)
```

`run_in_executor(None, ...)` place l'appel synchrone dans le thread pool par défaut de Python (`ThreadPoolExecutor`), libérant la boucle asyncio pour traiter d'autres requêtes pendant l'inférence.

### Pré-chargement au démarrage

```python
# backend/app/main.py — lifespan()
@asynccontextmanager
async def lifespan(app: FastAPI):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, encode, "warmup")  # cold-start ~5-10s
    yield
```

Le modèle est chargé en mémoire lors du démarrage du container (`lifespan`). Sans ce pré-chargement, la première requête de matching attendrait 5–10 secondes supplémentaires le temps que PyTorch charge les poids du modèle.

---

## 4.4 Algorithme de matching et scoring

### Flux complet

```
POST /api/rh/offers/{offer_id}/matching
  │
  ├─ 1. Vérifier/générer embedding offre (embed_offer si absent)
  │
  ├─ 2. pgvector KNN :
  │     SELECT id, (embedding <=> offer_embed) AS cosinus
  │     FROM cvs WHERE statut = 'INDEXED'
  │     ORDER BY embedding <=> offer_embed
  │     LIMIT 200
  │
  ├─ 3. Pour chaque CV parmi les 200 :
  │     score_semantique  = cosinus similarity (depuis l'étape 2)
  │     score_competences = Jaccard(cv_skills, offer_skills)
  │     score_experience  = min(cv_years / required_years, 1.0)
  │     score_langue      = 1.0 si langue requise ∈ cv_langues, sinon 0.0
  │     score_final       = Σ (score_i × poids_i)
  │
  ├─ 4. Tri par score_final décroissant → top N (défaut 50)
  │
  └─ 5. Upsert Resultats :
         Si Resultat existant RETAINED ou REFUSED → SKIP (décision immuable)
         Si Resultat existant PENDING → mise à jour des scores
         Si pas de Resultat → création avec decision=PENDING
```

### Formule de score final

```
score_final = score_semantique  × poids_semantique   (défaut 0.40)
            + score_competences × poids_competences   (défaut 0.35)
            + score_experience  × poids_experience    (défaut 0.15)
            + score_langue      × poids_langue        (défaut 0.10)
```

Les pondérations sont configurables **par offre** via `PUT /api/rh/offers/{id}/poids`. La contrainte est que la somme doit valoir approximativement 1.0 (±5 %).

### Détail de chaque sous-score

#### Score sémantique (40 % par défaut)

Mesure la proximité conceptuelle entre le profil du candidat et l'offre, indépendamment des mots exacts.

```python
score_semantique = min(1.0, max(0.0, cosine_similarity))
# cosine_similarity provient directement de l'opérateur pgvector <=>
# Plage de sortie : [0, 1]
```

C'est le critère le plus important car il capture la similarité globale du profil, même si les candidats n'utilisent pas exactement les mêmes termes que l'offre.

#### Score compétences (35 % par défaut)

Mesure le recouvrement entre les compétences du CV et les compétences requises par l'offre.

```python
# Algorithme : similarité de Jaccard
cv_skills = {s.lower() for s in competences_cv}
offer_skills = {s.lower() for s in competences_requises}

if not offer_skills:
    score_competences = 1.0  # aucune compétence requise → score parfait
else:
    intersection = cv_skills & offer_skills
    union = cv_skills | offer_skills
    score_competences = len(intersection) / len(union)
# Plage de sortie : [0, 1]
```

La normalisation en minuscules est appliquée pour éviter les faux négatifs (ex : "Python" vs "python").

#### Score expérience (15 % par défaut)

Compare les années d'expérience du candidat aux années requises par l'offre.

```python
if experience_requise == 0:
    score_experience = 1.0  # offre ouverte à tous niveaux
elif cv_years >= experience_requise:
    score_experience = 1.0  # candidat sur-qualifié → score parfait
else:
    score_experience = cv_years / experience_requise
# Plafonné à 1.0 — la sur-expérience n'est pas pénalisée
```

#### Score langue (10 % par défaut)

Vérifie si le candidat maîtrise la langue requise par l'offre.

```python
if not langue_requise or langue_requise == "":
    score_langue = 1.0  # aucune langue requise → score parfait
elif langue_requise.lower() in [l["langue"].lower() for l in cv_langues]:
    score_langue = 1.0  # langue trouvée
else:
    score_langue = 0.0  # langue absente
# Score binaire : 0.0 ou 1.0
```

### Justification des pondérations par défaut

| Critère | Poids | Justification |
|---------|-------|---------------|
| Similarité sémantique | 40 % | Capte la cohérence globale du profil — un développeur backend et un architecte logiciel partagent un contexte sémantique même sans mots-clés identiques |
| Compétences | 35 % | Critère le plus objectif — les compétences techniques requises sont souvent non négociables |
| Expérience | 15 % | Important mais moins discriminant — un junior très qualifié peut surpasser un senior peu pertinent |
| Langue | 10 % | Critère binaire mais structurant pour les offres internationales ou les postes bilingues |

### Précision des résultats

Tous les scores sont arrondis à 4 décimales dans le scorer. Les `Resultats` sont stockés avec `score_matching`, `score_skills`, `score_experience`, `score_langue` et `score_final` séparément, permettant au RH de voir le détail de la décomposition.

---

## 4.5 Tâches asynchrones Celery

### Infrastructure

Les tâches Celery s'exécutent dans un container `celery_worker` séparé (4 workers concurrents). Redis sert à la fois de **broker de messages** (file d'attente) et de **backend de résultats** (stockage des retours de tâches).

Le monitoring des tâches est accessible via **Flower** sur le port 5555.

### Tâche principale : `process_cv_on_upload(cv_id)`

Déclenchée automatiquement après tout upload de CV (candidat, agent, import Keejob). Orchestre l'ensemble du pipeline NLP :

```python
@celery_app.task(bind=True, max_retries=3, name="process_cv_on_upload")
def process_cv_on_upload(self, cv_id: int):
    # 1. Charger le CV avec toutes ses relations
    cv = load_cv_with_relations(cv_id)
    
    # 2. Extraire le texte si absent
    if not cv.cv_text:
        cv.cv_text = extract_text_from_pdf(cv.fichier_pdf)  # OCR si nécessaire
    
    # 3. Parser les entités si cv_entities est vide
    if not cv.cv_entities:
        if is_keejob_format(cv.cv_text):
            cv.cv_entities = parse_keejob_cv(cv.cv_text)
        else:
            cv.cv_entities = parse_generic_cv(cv.cv_text)
    
    # 4. Générer l'embedding
    text = cv_to_embed_text(cv.cv_entities, cv.cv_text)
    cv.embedding = encode(text)  # CPU-bound, acceptable dans le worker Celery
    cv.cv_version += 1
    cv.statut = "INDEXED"
    
    # 5. Mettre à jour les scores pour chaque offre active
    for offre in get_active_offers():
        resultat = get_resultat(cv_id, offre.id)
        if resultat and resultat.decision in ["RETAINED", "REFUSED"]:
            continue  # Décision immuable
        scores = compute_scores(cv, offre)
        upsert_resultat(cv_id, offre.id, scores)
```

**Retour de la tâche** :
```json
{
  "status": "ok",
  "cv_id": 42,
  "cv_version": 2,
  "offers_processed": 5,
  "created": 3,
  "updated": 2,
  "skipped_rh_decisions": 1
}
```

### Tâche : `embed_cv(cv_id)`

Génère uniquement l'embedding d'un CV déjà parsé. Utilisée pour les recalculs d'embedding après modification d'un profil. Max 3 tentatives.

### Tâche : `embed_all_cvs(batch_size=100)`

Backfill pour indexer tous les CVs sans embedding. Utilise `encode_batch()` pour l'efficacité :

```python
@celery_app.task(name="embed_all_cvs")
def embed_all_cvs(batch_size: int = 100):
    cvs = get_cvs_without_embedding()
    texts = [cv_to_embed_text(cv.cv_entities, cv.cv_text) for cv in cvs]
    embeddings = encode_batch(texts, batch_size=64)  # Traitement par lots
    for cv, emb in zip(cvs, embeddings):
        cv.embedding = emb
        cv.statut = "INDEXED"
    return {"status": "ok", "embedded": len(cvs)}
```

### Tâche : `embed_offer(offer_id)`

Génère l'embedding d'une offre à sa création ou lors de modifications majeures (titre, description, compétences). Max 3 tentatives.

### Commande de backfill

Pour réindexer tous les CVs existants sans embedding (ex : après migration) :
```bash
docker exec ats_backend python -m app.nlp.embed_existing_cvs --batch-size 128
```
