# Backend — Architecture & Structure

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Framework | FastAPI (Python 3.11) |
| Base de données | PostgreSQL 15 + pgvector |
| ORM | SQLAlchemy 2.x (AsyncSession) |
| Driver async | asyncpg |
| Auth | JWT (python-jose) + bcrypt |
| NLP / Parsing | regex, pdfplumber, pytesseract |
| Embeddings | sentence-transformers (paraphrase-multilingual-MiniLM-L12-v2, 384-dim) |
| OCR | Tesseract 5 (ara + fra + eng) |
| Tâches async | Celery + Redis |
| Conteneurisation | Docker + docker-compose |
| Reverse proxy | Nginx |

---

## Structure des dossiers

```
backend/
└── app/
    ├── main.py                   # Point d'entrée FastAPI, enregistrement des routers
    │
    ├── core/                     # Configuration transversale
    │   ├── config.py             # Variables d'environnement (Settings via pydantic-settings)
    │   ├── database.py           # Engine SQLAlchemy async, AsyncSessionLocal
    │   ├── security.py           # Hash bcrypt, création/vérification JWT
    │   └── celery_app.py         # Instance Celery + config Redis broker
    │
    ├── models/                   # Couche de données
    │   ├── db_models.py          # Modèles SQLAlchemy (tables PostgreSQL)
    │   └── schemas/              # Schémas Pydantic (validation I/O)
    │       ├── visitor_schemas.py
    │       ├── agent_schemas.py
    │       ├── rh_schemas.py
    │       ├── candidate_schemas.py
    │       └── admin_schemas.py
    │
    ├── api/                      # Couche HTTP
    │   ├── dependencies.py       # Dépendances FastAPI (get_db, require_agent, require_rh…)
    │   └── routes/               # Endpoints organisés par rôle
    │       ├── visitor/
    │       │   ├── auth.py       # POST /api/auth/login, /register
    │       │   └── offers.py     # GET /api/offers (offres publiques)
    │       ├── agent/
    │       │   ├── cvs.py        # CRUD CVs
    │       │   ├── candidates.py # CRUD Candidats
    │       │   └── import_keejob.py  # POST /api/agent/import/keejob (upload PDF unique)
    │       ├── rh/
    │       │   ├── offers.py     # CRUD Offres d'emploi
    │       │   ├── matching.py   # GET /api/rh/offers/{id}/matching
    │       │   └── dashboard.py  # Stats RH
    │       ├── candidate/
    │       │   ├── cvs.py        # Upload CV personnel
    │       │   ├── profile.py    # Profil candidat
    │       │   └── applications.py  # Candidatures
    │       └── admin/
    │           ├── users.py      # Gestion utilisateurs
    │           ├── roles.py      # Gestion rôles
    │           ├── filiates.py   # Gestion filiales
    │           ├── audit.py      # Logs d'audit
    │           └── system.py     # Santé système
    │
    ├── services/                 # Logique métier (entre routes et repositories)
    │   ├── visitor/
    │   │   ├── auth_service.py   # Login, register, refresh token
    │   │   └── offer_service.py  # Lecture offres publiques
    │   ├── agent/
    │   │   ├── cv_service.py     # Parse + stocke un CV uploadé
    │   │   └── candidate_service.py
    │   ├── rh/
    │   │   ├── offer_service.py  # Créer/modifier offres
    │   │   ├── matching_service.py   # Orchestration du matching pgvector
    │   │   ├── scoring_service.py    # Score multi-critères par CV
    │   │   └── stats_service.py      # KPIs dashboard RH
    │   ├── candidate/
    │   │   ├── cv_service.py
    │   │   ├── profile_service.py
    │   │   └── application_service.py
    │   ├── admin/
    │   │   ├── user_service.py
    │   │   ├── role_service.py
    │   │   └── system_service.py
    │   └── shared/
    │       ├── email_service.py  # Envoi emails (SMTP)
    │       └── file_service.py   # Gestion fichiers uploadés
    │
    ├── repositories/             # Accès base de données (requêtes SQLAlchemy)
    │   ├── cv_repository.py      # CRUD CV + add_competences + add_experiences + list_by_agent
    │   ├── candidate_repository.py   # CRUD Candidat + get_or_create
    │   ├── offer_repository.py   # CRUD Offre
    │   ├── user_repository.py    # CRUD User
    │   ├── result_repository.py  # CRUD Resultat matching
    │   └── filiale_repository.py
    │
    ├── nlp/                      # Pipeline NLP & traitement de documents
    │   ├── keejob_parser.py      # Parser regex CVs format Keejob (15+ champs)
    │   ├── keejob_importer.py    # CLI bulk import (PDF/JPG/PNG/DOCX/DOC)
    │   ├── parser.py             # Parser générique CVs libres
    │   ├── extractor.py          # Extraction entités (email, téléphone, adresse…)
    │   ├── embedder.py           # Génération embeddings 384-dim (sentence-transformers)
    │   ├── scorer.py             # Score matching multi-critères
    │   ├── language_detector.py  # Détection langue du CV
    │   └── ocr.py                # OCR Tesseract (images & PDFs scannés)
    │
    └── tasks/                    # Tâches Celery (asynchrones)
        ├── cv_tasks.py           # Embedding CVs en arrière-plan
        └── offer_tasks.py        # Embedding offres en arrière-plan
```

---

## Modèles de données

### Enums

```python
class UserRole(str, Enum):
    ADMIN     = "ADMIN"
    RH        = "RH"
    AGENT     = "AGENT"
    CANDIDAT  = "CANDIDAT"
    VISITEUR  = "VISITEUR"

class CVStatus(str, Enum):
    UPLOADED  = "UPLOADED"   # Fichier reçu, pas encore parsé
    PARSING   = "PARSING"    # En cours de parsing
    INDEXED   = "INDEXED"    # Parsé + embedding généré
    ERROR     = "ERROR"      # Échec parsing/embedding

class CVSource(str, Enum):
    KEEJOB    = "KEEJOB"     # Import bulk depuis la plateforme Keejob
    AGENT     = "AGENT"      # Uploadé manuellement par un agent
    CANDIDAT  = "CANDIDAT"   # Soumis par le candidat (portail futur)
    EMAIL     = "EMAIL"      # Reçu par email (futur)
    LINKEDIN  = "LINKEDIN"   # Importé depuis LinkedIn (futur)

class SkillLevel(str, Enum):
    BEGINNER      = "BEGINNER"
    INTERMEDIATE  = "INTERMEDIATE"
    EXPERT        = "EXPERT"
```

### Tables principales

| Table | Description |
|-------|-------------|
| `users` | Comptes utilisateurs (agents, RH, admins, candidats) |
| `candidates` | Profils candidats (nom, email, téléphone, adresse) |
| `cvs` | CVs : texte brut, entités JSON, embedding 384-dim, source, statut |
| `competences` | Compétences extraites d'un CV (nom + niveau) |
| `experiences` | Expériences professionnelles extraites d'un CV |
| `job_offers` | Offres d'emploi créées par les RH |
| `resultats` | Résultats matching : score cosinus CV ↔ offre |
| `filiates` | Filiales / entités de l'entreprise |

### Champs clés — table `cvs`

```sql
id            SERIAL PRIMARY KEY
id_candidate  FK → candidates.id
id_agent      FK → users.id  (NULL si import automatique)
source        CVSource  (KEEJOB | AGENT | CANDIDAT | EMAIL | LINKEDIN)
statut        CVStatus  (UPLOADED | PARSING | INDEXED | ERROR)
fichier_pdf   TEXT      (chemin ou URL du fichier original)
cv_text       TEXT      (texte brut extrait)
cv_entities   JSONB     (entités parsées : nom, email, compétences…)
embedding     VECTOR(384) (embedding pgvector pour le matching)
created_at    TIMESTAMP
```

---

## Flux de traitement d'un CV

```
Fichier entrant (PDF / JPG / PNG / DOCX / DOC)
        │
        ▼
  extract_text()          ← pdfplumber | Tesseract OCR | python-docx
        │
        ▼
  parse_keejob_cv()       ← regex 15+ champs (nom, email, expériences…)
        │
        ▼
  get_or_create(candidate) ← déduplication par email
        │
        ▼
  cv_repository.create()  ← statut = INDEXED, source = KEEJOB/AGENT/…
        │
        ├── add_competences()
        ├── add_experiences()
        └── [Celery task] embedder.encode() → pgvector
```

---

## Authentification & Autorisations

```
POST /api/auth/login  →  JWT (expire 24h)
                          │
                    Bearer token
                          │
           ┌──────────────┼──────────────┐
      require_admin  require_rh   require_agent   require_candidat
           │               │             │                │
        /admin/*       /rh/*        /agent/*        /candidate/*
```

Les dépendances FastAPI (`api/dependencies.py`) vérifient le rôle dans le payload JWT et injectent l'utilisateur courant dans chaque route.

---

## Pipeline NLP / Matching

```
CVs (embedding 384-dim)  ──┐
                           ├──► pgvector <#> cosine similarity ──► score [0-1]
Offre (embedding 384-dim) ─┘
```

Le score final combine :
- **Score sémantique** — cosinus embedding CV vs offre (pgvector)
- **Score compétences** — intersection compétences requises / présentes
- **Score expérience** — années d'expérience vs minimum requis
- **Score langue** — langues requises vs langues du CV

---

## Import bulk Keejob

```bash
# CVs format Keejob uniquement (défaut)
python -m app.nlp.keejob_importer /data/cvs --agent-id 1

# Tous formats : PDF + images + Word
python -m app.nlp.keejob_importer /data/cvs --all-files

# Simulation sans écriture DB
python -m app.nlp.keejob_importer /data/cvs --dry-run
```

Résultats sur le jeu de données Keejob (4489 fichiers) :

| Statut | Nombre |
|--------|--------|
| Importés | 4 130 |
| Doublons ignorés | 422 |
| Erreurs (fichiers corrompus) | 46 |

---

## Variables d'environnement

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/ats_randa
SECRET_KEY=...
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REDIS_URL=redis://localhost:6379/0
```

Voir `.env.example` à la racine du projet.
