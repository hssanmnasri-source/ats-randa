# ATS RANDA — État du Projet
Date : 2026-03-17

---

## ✅ Fonctionnalités Complétées

### Backend — Infrastructure
- [x] FastAPI 0.111 avec lifespan, CORS, tags Swagger enrichis
- [x] SQLAlchemy 2.x AsyncSession + asyncpg
- [x] PostgreSQL 16 + pgvector (Vector 384-dim)
- [x] Authentification JWT (python-jose + bcrypt)
- [x] Modèles DB complets : User, Candidate, CV, Competence, Experience, JobOffer, Resultat, Filiale
- [x] Enums : UserRole, CVStatus, CVSource, SkillLevel, OfferStatus, Decision

### Backend — Routes
- [x] `POST /api/visitor/login` + `POST /api/visitor/register`
- [x] `GET  /api/visitor/offers` — offres publiques
- [x] `GET/POST/PUT/DELETE /api/rh/offers` — CRUD offres RH
- [x] `GET  /api/rh/dashboard` — stats globales
- [x] `GET/POST /api/agent/cvs` — liste CVs + upload
- [x] `GET /api/agent/candidates` — liste candidats
- [x] `POST /api/agent/import/keejob` — import PDF Keejob unique
- [x] `GET/POST /api/candidate/cvs` — CV candidat
- [x] CRUD Admin users (`/api/admin/users`)

### NLP Pipeline
- [x] `keejob_parser.py` — parser regex 15+ champs pour CVs Keejob
- [x] `keejob_importer.py` — import bulk (PDF natif + OCR + DOCX/DOC + JPG/PNG)
- [x] `embedder.py` — encode() + encode_batch() + cv_to_embed_text() + offer_to_embed_text()
- [x] `scorer.py` — score_semantique / score_competences / score_experience / score_langue / compute_final_score()
- [x] `ocr.py` — Tesseract OCR ara+fra+eng
- [x] OCR intégré dans keejob_importer (fallback PDF scanné + images + Word)

### Repositories
- [x] `cv_repository.py` — CRUD + add_competences + add_experiences + list_by_agent
- [x] `candidate_repository.py` — CRUD + get_or_create (déduplication)
- [x] `offer_repository.py` — CRUD + list_active + list_by_rh
- [x] `user_repository.py`
- [x] `result_repository.py` — create_many + list_by_offer + update_decision + delete_by_offer
- [x] `filiale_repository.py`

### Data
- [x] **4 130 CVs** importés et indexés (statut INDEXED)
- [x] **4 127 candidats** en base
- [x] Source KEEJOB : 4 130 CVs (id_agent = NULL)
- [x] `CVSource` enum ajouté + backfill OK
- [x] Formats importés : PDF natif, PDF scanné (OCR), JPG, PNG, DOCX, DOC

### Documentation
- [x] `docs/PROJECT.md` — description complète du projet
- [x] `docs/BACKEND.md` — architecture, structure, data model, flux NLP
- [x] `docs/API_REFERENCE.md` — référence complète des endpoints
- [x] `docs/KEEJOB_PIPELINE.md` — pipeline d'import détaillé
- [x] `/docs` Swagger enrichi avec description, tags, contact

---

## 🔲 En Cours

- [ ] `matching_service.py` — orchestration pgvector + scoring (fichier vide)
- [ ] `api/routes/rh/matching.py` — endpoints matching (fichier vide)
- [ ] Embeddings non encore générés pour les 4 130 CVs existants
- [ ] `sentence-transformers` absent de requirements.txt

---

## ❌ Reste à Faire

### Backend — Matching Engine (priorité 1)
- [ ] Ajouter `sentence-transformers` dans requirements.txt
- [ ] `matching_service.py` — run_matching(offer_id, top_n) via pgvector
- [ ] `api/routes/rh/matching.py` — POST + GET + PATCH decision
- [ ] Script de génération d'embeddings pour les 4 130 CVs existants
- [ ] `tasks/cv_tasks.py` — Celery task embedding CVs en arrière-plan
- [ ] `tasks/offer_tasks.py` — Celery task embedding offres en arrière-plan

### Backend — NLP Complémentaire
- [ ] `parser.py` — parser générique CVs libres (non-Keejob)
- [ ] `extractor.py` — extraction entités transversale
- [ ] `language_detector.py` — détection langue du CV
- [ ] `scoring_service.py` — service scoring (actuellement dans scorer.py)

### Backend — Routes manquantes
- [ ] `PATCH /api/rh/offers/{id}/matching/{result_id}` — décision RETAINED/REFUSED
- [ ] `GET /api/agent/cvs/{id}` — détail CV complet
- [ ] Routes candidate/profile + applications
- [ ] Admin : audit, roles, filiates, system

### Frontend (priorité 2)
- [ ] React Dashboard RH (stats, offres, résultats matching)
- [ ] Interface Agent (import CVs, liste candidats)
- [ ] Portail Candidat (dépôt CV, suivi candidatures)
- [ ] Flutter Mobile *(optionnel pour la PFE)*

### DevOps (priorité 3)
- [ ] Monitoring Prometheus + Grafana
- [ ] CI/CD GitHub Actions (lint + tests + build)
- [ ] `docker-compose.prod.yml` configuré pour prod
- [ ] Nginx config HTTPS + reverse proxy

---

## 📊 Statistiques DB

| Table | Lignes |
|-------|--------|
| `cvs` | 4 130 |
| `candidates` | 4 127 |
| `users` | ~5 |
| `job_offers` | 0 |
| `resultats` | 0 |
| `competences` | ~18 000+ |
| `experiences` | ~12 000+ |

> Docker arrêté au moment de l'audit — chiffres basés sur dernier import connu.

---

## 🗂️ Structure Fichiers Python

```
backend/app/
├── main.py                          ✅ complet
├── core/
│   ├── config.py                    ✅
│   ├── database.py                  ✅
│   ├── security.py                  ✅
│   └── celery_app.py                ✅
├── models/
│   ├── db_models.py                 ✅ complet (tous les modèles + enums)
│   └── schemas/                     ✅ (visitor/agent/rh/candidate/admin)
├── api/routes/
│   ├── visitor/auth.py              ✅
│   ├── visitor/offers.py            ✅
│   ├── agent/cvs.py                 ✅
│   ├── agent/candidates.py          ✅
│   ├── agent/import_keejob.py       ✅
│   ├── rh/offers.py                 ✅
│   ├── rh/dashboard.py              ✅
│   ├── rh/matching.py               ❌ vide
│   ├── candidate/cvs.py             ✅
│   ├── candidate/profile.py         ⬜ partiel
│   ├── candidate/applications.py    ⬜ partiel
│   └── admin/users.py               ✅
├── services/
│   ├── visitor/auth_service.py      ✅
│   ├── agent/cv_service.py          ✅
│   ├── agent/candidate_service.py   ✅
│   ├── rh/offer_service.py          ✅
│   ├── rh/matching_service.py       ❌ vide
│   ├── rh/scoring_service.py        ❌ vide
│   ├── rh/stats_service.py          ✅
│   └── shared/email_service.py      ⬜ partiel
├── repositories/
│   ├── cv_repository.py             ✅
│   ├── candidate_repository.py      ✅
│   ├── offer_repository.py          ✅
│   ├── result_repository.py         ✅
│   ├── user_repository.py           ✅
│   └── filiale_repository.py        ✅
├── nlp/
│   ├── keejob_parser.py             ✅ complet (regex 15+ champs)
│   ├── keejob_importer.py           ✅ complet (PDF+OCR+DOCX+images)
│   ├── embedder.py                  ✅ complet
│   ├── scorer.py                    ✅ complet
│   ├── ocr.py                       ✅
│   ├── parser.py                    ❌ vide
│   ├── extractor.py                 ❌ vide
│   └── language_detector.py         ❌ vide
└── tasks/
    ├── cv_tasks.py                  ❌ vide
    └── offer_tasks.py               ❌ vide
```

---

## 🚀 Prochaine Action

**Démarrer Docker puis lancer :**
```bash
# 1. Générer les embeddings des 4130 CVs existants
docker exec ats_backend python -m app.nlp.embed_existing_cvs

# 2. Tester le matching sur une offre
curl -X POST http://localhost:8000/api/rh/offers/1/matching
```
