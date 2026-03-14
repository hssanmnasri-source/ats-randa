# ATS RANDA — Projet de Fin d'Études

## Présentation

**ATS RANDA** (Applicant Tracking System) est une plateforme web de gestion et d'analyse de CVs développée dans le cadre d'un **Projet de Fin d'Études (PFE)** en Tunisie.

L'objectif est d'automatiser le processus de recrutement : import massif de CVs, extraction d'entités par NLP/regex/OCR, matching sémantique avec les offres d'emploi, et tableau de bord RH.

---

## Architecture générale

```
┌─────────────────────────────────────────────────────────────────┐
│                          ATS RANDA                              │
│                                                                 │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────────────┐   │
│  │ Frontend │   │   Backend    │   │      Base de données  │   │
│  │ React/TS │◄──│  FastAPI     │◄──│  PostgreSQL + pgvector│   │
│  │          │   │  Python 3.11 │   │                      │   │
│  └──────────┘   └──────────────┘   └──────────────────────┘   │
│                        │                                        │
│              ┌─────────┴──────────┐                           │
│              │   Pipeline NLP     │                           │
│              │  pdfplumber / OCR  │                           │
│              │  keejob_parser.py  │                           │
│              └────────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Stack technique

| Couche | Technologie |
|--------|------------|
| Backend | FastAPI, Python 3.11, SQLAlchemy (async), asyncpg |
| Base de données | PostgreSQL 15, pgvector (embeddings 384-dim) |
| NLP / Parsing | pdfplumber, pytesseract (OCR), python-docx, regex |
| Auth | JWT (Bearer), rôles : VISITOR / CANDIDATE / AGENT / RH / ADMIN |
| Frontend | React, TypeScript |
| Infra | Docker, docker-compose, Nginx |

---

## Rôles utilisateurs

| Rôle | Permissions |
|------|-------------|
| `VISITOR` | Consulter les offres publiques |
| `CANDIDATE` | Créer un compte, soumettre un CV, suivre ses candidatures |
| `AGENT` | Importer des CVs, gérer les candidatures |
| `RH` | Créer des offres, accéder aux résultats de matching |
| `ADMIN` | Gestion complète (utilisateurs, filiates, configuration) |

---

## Modèle de données principal

```
candidates          cvs                  job_offers
──────────          ────                 ──────────
id                  id                   id
nom                 id_candidate ────►   titre
prenom              id_agent     ────►   description
email               statut               competences_requises
telephone           source               experience_requise
adresse             fichier_pdf          statut
date_naissance      cv_text
                    cv_entities (JSONB)       resultats
                    embedding (384-dim)       ─────────
                    score_final               id_cv ──►
                                              id_offre ──►
competences         experiences               score_matching
───────────         ───────────               score_final
id_cv ──►           id_cv ──►                 decision
nom_competence      poste
niveau              entreprise
                    date_debut
                    date_fin
                    description
```

---

## Sources de CVs (`CVSource`)

| Valeur | Description |
|--------|-------------|
| `KEEJOB` | Importé depuis la plateforme Keejob (bulk import automatique) |
| `AGENT` | Uploadé manuellement par un agent via l'interface |
| `CANDIDAT` | Soumis par le candidat via le portail candidat *(futur)* |
| `EMAIL` | Reçu et parsé depuis un email entrant *(futur)* |
| `LINKEDIN` | Importé depuis un profil LinkedIn *(futur)* |

---

## Formats de CVs supportés

| Format | Méthode d'extraction |
|--------|---------------------|
| PDF natif (texte) | pdfplumber |
| PDF scanné (image) | pdfplumber → fallback OCR Tesseract (ara+fra+eng) |
| Image JPG / PNG | OCR Tesseract direct |
| DOCX | python-docx |
| DOC (ancien format) | antiword → fallback bytes bruts |

---

## Pipeline d'import Keejob

Voir [KEEJOB_PIPELINE.md](KEEJOB_PIPELINE.md) pour le détail complet.

**Résumé des imports effectués :**

| Lot | Fichiers | Importés | Doublons | Erreurs |
|-----|---------|---------|---------|---------|
| CVs Keejob (`cv_keejob_*.pdf`) | 2 896 | 2 474 | 422 | 0 |
| CVs libres (UUID, PDF) | 1 128 | ~1 000 | ~128 | 0 |
| Images + Word (DOCX/DOC/JPG/PNG) | 401 | 448 | 261 | 46 |
| **Total en base** | — | **4 130** | — | — |

---

## Structure du projet

```
ats-randa/
├── backend/
│   └── app/
│       ├── api/
│       │   ├── dependencies.py          # Auth JWT, require_agent, require_rh...
│       │   └── routes/
│       │       ├── agent/
│       │       │   └── import_keejob.py # POST /api/agent/import/keejob
│       │       └── visitor/
│       ├── core/
│       │   └── database.py              # AsyncSessionLocal, Base
│       ├── models/
│       │   └── db_models.py             # SQLAlchemy ORM (CV, Candidate, User...)
│       ├── nlp/
│       │   ├── keejob_parser.py         # Parseur regex CVs Keejob
│       │   └── keejob_importer.py       # CLI import en masse (PDF/DOCX/images)
│       └── repositories/
│           ├── cv_repository.py
│           └── candidate_repository.py
├── frontend/                            # React / TypeScript
├── docs/                                # Documentation
│   ├── PROJECT.md                       # Ce fichier
│   └── KEEJOB_PIPELINE.md              # Pipeline NLP détaillé
├── docker-compose.yml
└── nginx/
```

---

## Commandes Docker essentielles

```bash
# Démarrer la stack
docker-compose up -d

# Import bulk Keejob (CVs Keejob uniquement)
docker exec ats_backend sh -c "cd /app && python -m app.nlp.keejob_importer /app/uploads/keejob"

# Import tous formats (PDF + images + Word)
docker exec ats_backend sh -c "cd /app && python -m app.nlp.keejob_importer /app/uploads/keejob --all-files"

# Stats base de données
docker exec ats_backend python -c "
import asyncio, sys
sys.path.insert(0, '/app')
from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def main():
    async with AsyncSessionLocal() as db:
        for t in ['candidates', 'cvs', 'competences', 'experiences']:
            r = await db.execute(text(f'SELECT COUNT(*) FROM {t}'))
            print(f'{t}: {r.scalar()}')

asyncio.run(main())
"

# Vérifier la distribution par source
docker exec ats_backend python -c "
import asyncio, sys
sys.path.insert(0, '/app')
from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def main():
    async with AsyncSessionLocal() as db:
        r = await db.execute(text('SELECT source, COUNT(*) FROM cvs GROUP BY source'))
        for row in r.fetchall():
            print(f'{row[0]}: {row[1]}')

asyncio.run(main())
"
```

---

## API — Endpoints principaux

| Méthode | Route | Rôle requis | Description |
|---------|-------|-------------|-------------|
| `POST` | `/api/visitor/login` | — | Authentification |
| `POST` | `/api/visitor/register` | — | Inscription candidat |
| `GET` | `/api/visitor/offres` | — | Liste des offres publiques |
| `POST` | `/api/agent/import/keejob` | `AGENT` | Import d'un CV Keejob (PDF) |
| `GET` | `/api/agent/cvs` | `AGENT` | Liste des CVs |

Documentation interactive : `http://localhost:8000/docs`

---

## Évolutions prévues

- [ ] Portail candidat : dépôt de CV + suivi des candidatures
- [ ] Matching sémantique CV ↔ offres via embeddings pgvector
- [ ] Import automatique depuis email (parsing pièce jointe)
- [ ] Import profil LinkedIn
- [ ] Dashboard RH avec statistiques et graphiques
- [ ] Notifications candidats (email)
