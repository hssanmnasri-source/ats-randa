# ATS RANDA — Améliorations Techniques

> Synthèse des 5 améliorations implémentées dans le cadre du projet PFE.

---

## 0. Auto-Matching IA après Upload CV

**Objectif** : déclencher automatiquement l'embedding et le matching à chaque dépôt de CV.

**Implémentation** :
- `backend/app/tasks/cv_tasks.py` — tâche Celery `process_cv_on_upload`
  - Encode le CV (sentence-transformers 384 dimensions) en arrière-plan
  - Calcule la similarité cosinus avec toutes les offres actives via numpy dot product
  - Applique le scoring multi-critères (sémantique + compétences + expérience + langue)
  - **Règle immuable** : les décisions RETAINED/REFUSED ne sont jamais écrasées
- `backend/app/services/rh/matching_service.py` — `delete_pending_by_offer()` au lieu de tout supprimer
- `backend/app/models/db_models.py` — colonnes `cv_version`, `updated_at`, `last_matching_at`, `last_score_updated_at`
- `backend/BUSINESS_RULES.md` — documentation des règles métier

**Résultat** : chaque CV uploadé est automatiquement scoré et classé sans intervention manuelle.

---

## 1. Tests Automatisés (pytest)

**Objectif** : 70+ tests unitaires et d'intégration pour valider la logique métier.

**Structure** :
```
backend/tests/
├── conftest.py                  # Fixtures function-scoped (asyncpg event loop)
├── unit/
│   ├── test_scorer.py          # 21 tests — compute_final_score, score_*
│   ├── test_keejob_parser.py   # 13 tests — parse_keejob_cv
│   └── test_security.py        #  9 tests — JWT, hash, verify
└── integration/
    ├── test_auth.py            # 10 tests — login, register, routes protégées
    ├── test_matching.py        # 10 tests — matching, règle RETAINED immuable
    ├── test_admin.py           #  3 tests — liste users, stats, RBAC
    └── test_rh_offers.py       #  4 tests — CRUD offres RH
```

**Commandes** :
```bash
docker exec ats_backend pytest tests/ -v --tb=short
docker exec ats_backend pytest tests/ --cov=app --cov-report=term-missing
```

**Résultat** : 70/70 tests passent ✅

---

## 2. Monitoring Grafana + Prometheus

**Objectif** : observabilité complète de l'API FastAPI en production.

**Implémentation** :
- `backend/app/main.py` — endpoint `/metrics` via `prometheus-fastapi-instrumentator`
- `monitoring/grafana/provisioning/dashboards/ats_dashboard.json` — dashboard "ATS RANDA — Monitoring" avec 9 panneaux :
  - Requêtes/s (taux global)
  - Latence P95 par endpoint
  - Taux d'erreurs 5xx
  - Top 10 endpoints les plus appelés
  - Requêtes en cours (in-flight)
  - Uptime
  - Mémoire RSS processus
  - Latence par méthode HTTP
  - Distribution des codes HTTP (pie chart)

**Accès** : http://localhost:3001 (admin/admin)

**Résultat** : dashboard provisionné automatiquement au démarrage de Grafana ✅

---

## 3. Notifications Email Transactionnelles

**Objectif** : informer automatiquement les candidats par email des événements clés.

**Implémentation** :
- `backend/app/core/mailer.py` — 3 fonctions async avec templates HTML RANDA :
  - `send_cv_received()` — après upload ou soumission de CV
  - `send_application_received()` — après candidature à une offre
  - `send_decision_notification()` — après décision RETAINED/REFUSED du RH
- Intégration `asyncio.create_task()` (fire-and-forget) dans :
  - `services/candidate/cv_service.py` (upload + formulaire)
  - `services/candidate/application_service.py` (candidature)
  - `api/routes/rh/matching.py` (décision PATCH)

**Configuration** (`.env`) :
```
MAIL_ENABLED=true
MAIL_USERNAME=ats.randa.noreply@gmail.com
MAIL_PASSWORD=<app_password_gmail>
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
```

> Par défaut `MAIL_ENABLED=false` — les emails sont loggés sans être envoyés.

**Résultat** : pipeline email complet, désactivé par défaut pour les environnements de dev ✅

---

## 4. Export PDF des Résultats de Matching

**Objectif** : permettre aux RH d'exporter un rapport PDF professionnel des résultats de matching.

**Implémentation** :
- `backend/app/services/rh/pdf_export.py` — `generate_matching_pdf()` avec reportlab :
  - En-tête RANDA brandé (palette #8B1A1A / #C9A84C / #3D0C02)
  - Tableau des informations de l'offre
  - Description de l'offre
  - Tableau paginé des candidats classés (rang, nom, email, scores détaillés, décision colorée)
  - Pied de page avec date et numéro de page
- `backend/app/api/routes/rh/matching.py` — `GET /api/rh/offers/{id}/export/pdf`
  - Retourne un `application/pdf` avec `Content-Disposition: attachment`
  - Nom de fichier : `matching_{id}_{titre_offre}.pdf`
- `frontend/src/pages/rh/MatchingPage.tsx` — bouton "Exporter PDF"
  - Visible uniquement quand des résultats sont chargés
  - Téléchargement direct via `fetch` + `URL.createObjectURL`

**Accès** :
```
GET /api/rh/offers/{offer_id}/export/pdf
Authorization: Bearer <rh_token>
```

**Résultat** : PDF généré (≥4 KB), valide, téléchargeable depuis l'interface RH ✅

---

## Stack Technique

| Composant | Technologie |
|-----------|------------|
| Backend   | FastAPI + SQLAlchemy (async) + PostgreSQL + pgvector |
| Frontend  | React 18 + TypeScript + Ant Design 5 + Vite |
| ML        | sentence-transformers (all-MiniLM-L6-v2, 384 dim) |
| Queue     | Celery + Redis |
| Tests     | pytest + pytest-asyncio + httpx |
| Monitoring| Prometheus + Grafana |
| Email     | fastapi-mail (SMTP Gmail) |
| PDF       | reportlab |
| Auth      | JWT (HS256) + RBAC (ADMIN / RH / AGENT / CANDIDAT) |
