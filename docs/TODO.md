# ATS RANDA — TODO LIST COMPLÈTE
> Audit du : 2026-03-31
> Basé sur lecture exhaustive de tous les fichiers du projet

## LÉGENDE
- ✅ Complété et fonctionnel
- 🔄 Partiellement implémenté
- ❌ Manquant ou cassé
- 🚨 Bug critique (corrigé ou à corriger)
- ⚡ Amélioration importante
- 💡 Nice to have

---

## 1. BACKEND — API Routes

### Visitor (auth publique)
- ✅ `POST /api/visitor/register` — inscription candidat
- ✅ `POST /api/visitor/login` — connexion tous rôles → JWT 7 jours
- ✅ `GET  /api/visitor/offers` — liste offres publiques (paginée)
- ✅ `GET  /api/visitor/offers/{id}` — détail offre publique

### Candidate
- ✅ `GET  /api/candidate/profile` — profil complet (champs étendus)
- ✅ `PUT  /api/candidate/profile` — mise à jour profil global
- ✅ `PUT  /api/candidate/profile/personal` — infos personnelles + mobilité
- ✅ `PUT  /api/candidate/profile/professional` — statut pro + secteurs
- ✅ `PUT  /api/candidate/profile/visibility` — visibilité profil
- ✅ `GET  /api/candidate/profile/completion` — score complétion profil
- ✅ `POST /api/candidate/profile/photo` — upload photo de profil
- ✅ `GET  /api/candidate/profile/full` — profil complet + formations + langues
- ✅ `GET  /api/candidate/profile/experiences` — liste expériences
- ✅ `POST /api/candidate/profile/experiences` — ajouter expérience
- ✅ `DELETE /api/candidate/profile/experiences/{id}` — supprimer expérience
- ✅ `GET  /api/candidate/profile/skills` — liste compétences
- ✅ `POST /api/candidate/profile/skills` — ajouter compétence
- ✅ `DELETE /api/candidate/profile/skills/{id}` — supprimer compétence
- ✅ `GET  /api/candidate/cvs` — mes CVs
- ✅ `POST /api/candidate/cvs` — soumettre CV (upload ou formulaire)
- ✅ `GET  /api/candidate/applications` — mes candidatures
- ✅ `GET  /api/candidate/applications/{id}/detail` — timeline candidature
- ✅ `POST /api/candidate/offers/{id}/apply` — postuler à une offre
- ✅ `DELETE /api/candidate/applications/{id}` — retirer candidature (PENDING)
- ✅ `GET  /api/candidate/cover-letters` — lettres de motivation
- ✅ `POST /api/candidate/cover-letters` — créer lettre
- ✅ `PUT  /api/candidate/cover-letters/{id}` — modifier lettre
- ✅ `DELETE /api/candidate/cover-letters/{id}` — supprimer lettre
- ✅ `GET  /api/candidate/documents` — documents personnels
- ✅ `POST /api/candidate/documents/upload` — upload document
- ✅ `DELETE /api/candidate/documents/{id}` — supprimer document

### Agent
- ✅ `GET  /api/agent/dashboard` — stats + candidats récents (20 derniers)
- ✅ `GET  /api/agent/candidates/{cv_id}/results` — résultats matching d'un CV
- ✅ `POST /api/agent/cvs/upload` — upload CV physique (OCR) + feedback qualité
- ✅ `POST /api/agent/cvs/batch` — upload jusqu'à 10 CVs en batch
- ✅ `GET  /api/agent/cvs` — liste CVs de cet agent (paginée)
- ✅ `GET  /api/agent/cvs/{id}` — détail CV
- ✅ `GET  /api/agent/history` — historique activité agent (paginé)
- ✅ `POST /api/agent/import-keejob` — import CV format Keejob

### RH
- ✅ `GET  /api/rh/dashboard` — stats globales RH
- ✅ `GET  /api/rh/dashboard/stats` — KPIs enrichis + candidatures 24h
- ✅ `GET  /api/rh/offers` — liste offres (paginée)
- ✅ `POST /api/rh/offers` — créer offre (→ Celery embed_offer)
- ✅ `GET  /api/rh/offers/{id}` — détail offre
- ✅ `PUT  /api/rh/offers/{id}` — modifier offre
- ✅ `DELETE /api/rh/offers/{id}` — archiver offre (soft delete)
- ✅ `POST /api/rh/offers/{id}/matching` — lancer matching pgvector + scoring
- ✅ `GET  /api/rh/offers/{id}/matching` — résultats matchng (paginés, filtrables)
- ✅ `PATCH /api/rh/offers/{id}/matching/{rid}` — décision + feedback RH + email notif
- ✅ `GET  /api/rh/offers/{id}/export/pdf` — export rapport matching PDF
- ✅ `GET  /api/rh/cvs/search` — recherche sémantique cvthèque

### Admin
- ✅ `GET  /api/admin/stats` — statistiques globales enrichies (users/CVs/offres/matching/top RH)
- ✅ `GET  /api/admin/system/health` — santé services (PG, pgvector, Redis, Celery)
- ✅ `POST /api/admin/system/reindex` — relancer embedding de tous les CVs
- ✅ `GET  /api/admin/audit/logs` — logs d'audit paginés (filtrables)
- ✅ `GET  /api/admin/cvs` — tous les CVs (toutes sources, paginés)
- ✅ `GET  /api/admin/users` — liste utilisateurs
- ✅ `POST /api/admin/users` — créer utilisateur
- ✅ `GET  /api/admin/users/{id}` — détail utilisateur
- ✅ `PUT  /api/admin/users/{id}` — modifier utilisateur
- ✅ `PATCH /api/admin/users/{id}/toggle` — activer/désactiver compte
- ❌ `GET  /api/admin/audit/logs` — enregistré dans system.py mais doublon avec audit.py non registeré
- 💡 `GET  /api/admin/roles` — gestion rôles (fichier existe: routes/admin/roles.py, NON enregistré)
- 💡 `* /api/admin/filiates` — gestion filiates (fichier existe: routes/admin/filiates.py, NON enregistré)

---

## 2. BACKEND — Modèles de données (db_models.py)

- ✅ `User` — id, nom, prenom, email, hashed_pwd, role, departement, id_filiale, is_active
- ✅ `Candidate` — profil étendu (photo, titre, niveau_etude, mobilité, visibilité, alertes...)
- ✅ `CV` — source (KEEJOB/AGENT/CANDIDAT/EMAIL/LINKEDIN), statut, embedding 384-dim, cv_entities JSONB
- ✅ `Competence` — id_cv, nom_competence, niveau (BEGINNER/INTERMEDIATE/EXPERT)
- ✅ `Experience` — id_cv, poste, entreprise, dates, type_contrat, missions (Keejob-style)
- ✅ `JobOffer` — titre, description, competences_requises, experience_requise, embedding, statut
- ✅ `Resultat` — 4 scores + score_final, decision, feedback_rh, feedback_visible, date_decision
- ✅ `CoverLetter` — id_candidate, titre, contenu
- ✅ `CandidateDocument` — id_candidate, nom, fichier, type_doc
- ✅ `AuditLog` — user_id, action, resource, resource_id, details, ip_address
- ✅ `Filiale` — nom_filiale, adresse, ville

---

## 3. BACKEND — NLP Pipeline

- ✅ `keejob_parser.py` — parser regex CVs Keejob (15+ champs)
- ✅ `keejob_importer.py` — import en masse avec fallback OCR
- ✅ `embedder.py` — sentence-transformers (paraphrase-multilingual-MiniLM-L12-v2, 384-dim)
- ✅ `scorer.py` — scoring hybride 40/35/15/10 (`compute_final_score`)
- ✅ `ocr.py` — Tesseract OCR (ar/fr/en) + `evaluate_ocr_quality` (score 0-100)
- ✅ `general_cv_parser.py` — parser générique CVs non-Keejob
- ✅ `generic_parser.py` — parser de fallback
- ✅ `extractor.py` — utilitaires extraction de champs
- ✅ `language_detector.py` — détection langue CV
- ✅ `parser.py` — point d'entrée unifié
- ✅ `embed_existing_cvs.py` — script backfill embeddings (CLI)
- ✅ `matching_service.py` — orchestration pgvector + scoring (pool 200 → top 50)
- ✅ `mailer.py` — emails transactionnels HTML (CV reçu, candidature, décision)

---

## 4. BACKEND — Celery Tasks

- ✅ `cv_tasks.py::embed_cv` — embedding d'un CV (legacy)
- ✅ `cv_tasks.py::embed_all_cvs` — batch embedding CVs sans embedding
- ✅ `cv_tasks.py::process_cv_on_upload` — pipeline complet: OCR → parser → embedding → matching
- ✅ `offer_tasks.py::embed_offer` — embedding d'une offre

---

## 5. BACKEND — Tests

- ✅ `tests/conftest.py` — fixtures: client, rh_token, admin_token, agent_token
- ✅ `tests/unit/test_scorer.py` — 15 tests unitaires (score_semantique, score_competences, etc.)
- ✅ `tests/unit/test_keejob_parser.py` — tests parser Keejob
- ✅ `tests/unit/test_security.py` — tests JWT + bcrypt
- ✅ `tests/integration/test_auth.py` — tests login/register
- ✅ `tests/integration/test_matching.py` — tests matching end-to-end
- ✅ `tests/integration/test_admin.py` — tests routes admin
- ✅ `tests/integration/test_rh_offers.py` — tests CRUD offres RH

---

## 6. FRONTEND — Layouts

- ✅ `PublicLayout.tsx` — layout pages publiques
- ✅ `AuthLayout.tsx` — layout login/register
- ✅ `CandidateLayout.tsx` — sidebar + header espace candidat
- ✅ `AgentLayout.tsx` — sidebar + header espace agent
- ✅ `RHLayout.tsx` — sidebar + header espace RH
- ✅ `AdminLayout.tsx` — sidebar + header espace admin

---

## 7. FRONTEND — Pages Publiques

- ✅ `/` — `HomePage` (liste offres publiques)
- ✅ `/offers/:id` — `OfferDetailPage`
- ✅ `/login` — `LoginPage`
- ✅ `/register` — `RegisterPage`

---

## 8. FRONTEND — Espace Candidat

- ✅ `/candidate` — `DashboardPage`
- ✅ `/candidate/cv` — `MyCVPage` (upload + formulaire + voir)
- ✅ `/candidate/cv-generator` — `CVGeneratorPage` (react-to-print, style Keejob)
- ✅ `/candidate/offres` — `OffresPage` (liste offres avec favoris localStorage)
- ✅ `/candidate/offres/:id` — `OffreDetailPage`
- ✅ `/candidate/applications` — `ApplicationsPage` (timeline 4 étapes + scores + feedback RH)
- ✅ `/candidate/profile` — `ProfilePage` (profil étendu + avatar)
- ✅ `/candidate/favorites` — `FavoritesPage` (favoris localStorage)
- ✅ `/candidate/cover-letters` — `CoverLettersPage`
- ✅ `/candidate/documents` — `DocumentsPage`
- ✅ `/candidate/settings` — `SettingsPage`

---

## 9. FRONTEND — Espace Agent

- ✅ `/agent` — `DashboardPage` (stats + candidats récents)
- ✅ `/agent/upload` — `UploadCVPage` (OCR + feedback qualité)
- ✅ `/agent/batch` — `BatchUploadPage` (multi-upload)
- ✅ `/agent/cvs` — `CVListPage` (liste candidats de l'agent)
- ✅ `/agent/history` — `HistoryPage` (historique activité)

---

## 10. FRONTEND — Espace RH

- ✅ `/rh` — `DashboardPage` (KPIs + graphiques)
- ✅ `/rh/offers` — `OffersPage` (CRUD offres)
- ✅ `/rh/offers/new` — `OfferFormPage` (créer offre)
- ✅ `/rh/offers/:id/edit` — `OfferFormPage` (modifier offre)
- ✅ `/rh/matching` — `MatchingPage` (lancer + visualiser résultats)
- ✅ `/rh/results` — `ResultsPage` (décisions RH)
- ✅ `/rh/cvtheque` — `CVthequePage` (recherche sémantique)
- ✅ `/rh/candidatures` — `CandidaturesPage` (toutes candidatures)

---

## 11. FRONTEND — Espace Admin

- ✅ `/admin` — `DashboardPage`
- ✅ `/admin/users` — `UsersPage`
- ✅ `/admin/users/new` — `UserFormPage`
- ✅ `/admin/audit` — `AuditPage`
- ✅ `/admin/system/health` — `SystemHealthPage`
- ✅ `/admin/cvs` — `AdminCVsPage`

---

## 12. FRONTEND — Composants

- ✅ `common/LoadingSpinner.tsx`
- ✅ `common/ErrorAlert.tsx`
- ✅ `common/PageHeader.tsx`
- ✅ `common/AppHeader.tsx`
- ✅ `common/MessageProvider.tsx`
- ✅ `dashboard/StatsCard.tsx`
- ✅ `dashboard/MatchChart.tsx`
- ✅ `matching/ScoreBar.tsx`
- ✅ `matching/DecisionBadge.tsx`
- ✅ `matching/MatchResultTable.tsx` (modal feedback avant confirmation)
- ✅ `offer/OfferCard.tsx`
- ✅ `offer/OfferBadge.tsx`
- ✅ `offer/OfferForm.tsx`
- ✅ `cv/CVDocument.tsx` (React.forwardRef, A4, style Keejob)
- ✅ `cv/CVUploadForm.tsx`
- ✅ `cv/CVReviewForm.tsx`
- ✅ `candidature/CandidatureTimeline.tsx` (drawer 4 étapes)
- ✅ `candidate/ProfileSummaryCard.tsx`
- ✅ `candidate/AvatarUpload.tsx`

---

## 13. DEVOPS & INFRA

- ✅ `docker-compose.yml` — 8 services (postgres, redis, backend, celery_worker, flower, nginx, prometheus, grafana)
- ✅ `nginx/nginx.conf` — proxy /api → backend:8000, / → host:3000
- ✅ `Makefile` — make up/down/build/logs/migrate/test/lint/format
- ✅ `backend/requirements.txt`
- ✅ `frontend/package.json`
- ✅ `monitoring/prometheus.yml`
- 💡 `docker-compose.prod.yml` — manquant (images multi-stage)
- 💡 `nginx/nginx.prod.conf` — manquant (rate limiting, security headers)
- 💡 `.github/workflows/ci.yml` — manquant (CI/CD GitHub Actions)
- 💡 `scripts/backup.sh` — manquant (sauvegarde DB + uploads)

---

## 14. BUGS CRITIQUES — CORRIGÉS ✅

### 🚨 BUG-01 : `embed_all_cvs` — filtre incorrect (CORRIGÉ)
**Fichier** : `backend/app/tasks/cv_tasks.py:59`
**Avant** : `.where(CV.statut == CVStatus.INDEXED)` — les CVs INDEXED ont déjà un embedding → tâche ne fait rien
**Après** : `.where(CV.statut != CVStatus.ERROR)` — traite tous les CVs sans embedding non-erreur

### 🚨 BUG-02 : Poids scoring incorrects dans OpenAPI (CORRIGÉ)
**Fichier** : `backend/app/main.py:86`
**Avant** : "30% compétences / 20% expérience"
**Après** : "35% compétences / 15% expérience" (cohérent avec `scorer.py`)

### 🚨 BUG-03 : `__init__.py` manquants dans répertoires Python (CORRIGÉ)
**Fichiers créés** :
- `backend/app/api/routes/agent/__init__.py`
- `backend/app/core/__init__.py`
- `backend/app/tasks/__init__.py`
- `backend/app/services/agent/__init__.py`
- `backend/app/services/shared/__init__.py`
- `backend/app/schemas/__init__.py`

---

## 15. BUGS RESTANTS À CORRIGER

### 🚨 BUG-04 : `backend/app/services/shared/email_service.py` vide (0 octets)
**Impact** : si importé, NameError. Actuellement la logique email est dans `core/mailer.py`.
**Action** : soit supprimer ce fichier, soit y mettre un re-export vers `core/mailer.py`

### 🚨 BUG-05 : `backend/app/services/shared/file_service.py` vide (0 octets)
**Impact** : si importé, NameError.
**Action** : soit supprimer, soit implémenter la logique de gestion de fichiers

### 🚨 BUG-06 : `backend/app/schemas/` — 5 fichiers vides (répertoire legacy)
**Impact** : confusion avec `backend/app/models/schemas/` (le vrai répertoire)
**Action** : supprimer `backend/app/schemas/` ou ajouter des re-exports

### ⚡ BUG-07 : `embed_all_cvs` ne met pas à jour le statut vers INDEXED
**Fichier** : `backend/app/tasks/cv_tasks.py:70-72`
**Impact** : après embedding batch, les CVs restent en statut UPLOADED/PARSING
**Action** : ajouter `cv.statut = CVStatus.INDEXED` dans la boucle

---

## 16. AMÉLIORATIONS PRIORITAIRES

### ⚡ AMÉLIO-01 : Routes admin non enregistrées
`routes/admin/roles.py` et `routes/admin/filiates.py` existent mais ne sont pas incluses dans `main.py`.
Décision : les enregistrer ou les supprimer.

### ⚡ AMÉLIO-02 : Bundle frontend trop large (2.2MB)
Ajouter du code splitting dans `vite.config.ts` :
```ts
manualChunks: { antd: ['antd'], recharts: ['recharts'], ... }
```

### ⚡ AMÉLIO-03 : CI/CD GitHub Actions
Créer `.github/workflows/ci.yml` avec : lint → tests → build frontend → Docker build.

### ⚡ AMÉLIO-04 : docker-compose.prod.yml
Dockerfile multi-stage pour la production (backend + frontend buildé servi par nginx).

### 💡 AMÉLIO-05 : Tests d'intégration coverage
Ajouter tests pour : CV upload, batch upload, applications candidat, notifications email.

### 💡 AMÉLIO-06 : Rate limiting API
Ajouter `slowapi` ou middleware FastAPI pour limiter les appels login/register.

### 💡 AMÉLIO-07 : Pagination frontend cohérente
Standardiser les composants de pagination à travers toutes les pages liste.

### 💡 AMÉLIO-08 : Notifications temps réel
Ajouter WebSocket ou SSE pour notifications candidat (décision RH sans refresh).

---

## 17. ÉTAT GLOBAL DU PROJET

| Dimension | État | Détail |
|-----------|------|--------|
| Backend API | ✅ 95% | Toutes les routes clés fonctionnelles |
| Modèles DB | ✅ 100% | Schema complet avec pgvector |
| NLP Pipeline | ✅ 90% | Keejob + générique + OCR + scoring |
| Celery Tasks | ✅ 85% | 3 tâches clés — statut embed manquant |
| Tests | ✅ 80% | 8 fichiers de tests, bonne couverture unitaire |
| Frontend | ✅ 95% | Toutes les pages existent, build ✅ |
| Devops | 🔄 70% | Dev OK, prod manquant |
| **Estimation globale** | **✅ ~88%** | |

---

## 18. PROCHAINES ÉTAPES (ORDER OF PRIORITY)

1. **[URGENT]** Corriger `email_service.py` et `file_service.py` vides → risque d'erreur runtime si importés
2. **[URGENT]** Fixer `embed_all_cvs` statut INDEXED après embedding (BUG-07)
3. **[IMPORTANT]** Nettoyer `backend/app/schemas/` (répertoire legacy vide)
4. **[IMPORTANT]** Décider du sort des routes admin non enregistrées (roles, filiates)
5. **[IMPORTANT]** Ajouter code-splitting Vite pour réduire bundle (2.2MB → <1MB)
6. **[MEDIUM]** Créer `.github/workflows/ci.yml` pour automatiser tests + build
7. **[MEDIUM]** Créer `docker-compose.prod.yml` + `nginx/nginx.prod.conf`
8. **[LOW]** Compléter tests d'intégration (upload CV, applications)
9. **[LOW]** Ajouter rate limiting sur routes auth
10. **[LOW]** Documentation DEVOPS.md + ARCHITECTURE.md
