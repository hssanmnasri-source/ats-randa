# Diagrammes UML — Modélisation du Système ATS RANDA

## Vue d'ensemble

Ce chapitre présente l'ensemble des diagrammes UML produits pour modéliser le système ATS RANDA. Onze diagrammes couvrent toutes les facettes du système : structure des données, cas d'utilisation par rôle, séquences des flux principaux, organisation des composants, cycles de vie des entités, processus métier, infrastructure de déploiement et organisation du code source.

Tous les diagrammes sont disponibles en deux formats :
- **Mermaid** (`docs/uml/*.md`) — rendu natif sur GitHub/GitLab et dans VS Code avec l'extension *Markdown Preview Mermaid Support*.
- **PlantUML + draw.io** (`docs/uml/drawio/`) — fichiers `.puml` importables dans draw.io via *Insert → Advanced → From Text* ; les fichiers `.drawio` sont éditables directement dans draw.io ou diagrams.net.

---

## Index des diagrammes

| # | Type UML | Fichier | Priorité de lecture |
|---|----------|---------|:------------------:|
| 01 | Classes | `01_diagramme_classes.md` | 1 |
| 02 | Cas d'utilisation | `02_diagramme_cas_utilisation.md` | 2 |
| 03 | Séquence — Authentification | `03_diagramme_sequence_authentification.md` | 3 |
| 04 | Séquence — Pipeline NLP & Matching | `04_diagramme_sequence_matching.md` | 4 |
| 05 | Séquence — Cycle de vie candidature | `05_diagramme_sequence_candidature.md` | 5 |
| 06 | Composants | `06_diagramme_composants.md` | 6 |
| 07 | États | `07_diagramme_etats.md` | 7 |
| 08 | Activités | `08_diagramme_activites.md` | 8 |
| 09 | Déploiement | `09_diagramme_deploiement.md` | 9 |
| 10 | Séquence — App Mobile Flutter | `10_diagramme_sequence_mobile.md` | 10 |
| 11 | Packages | `11_diagramme_packages.md` | 11 |

---

## 1. Diagramme de Classes — Modèle de données

### Objet

Le diagramme de classes représente le modèle de données persistant complet tel que défini dans `backend/app/models/db_models.py`. Il constitue la **référence unique du schéma** : toute modification du schéma PostgreSQL doit se refléter dans ce diagramme.

### Contenu

Le modèle comporte **12 tables** organisées autour de la classe centrale `CV` :

| Entité | Rôle |
|--------|------|
| `Filiale` | Entité juridique/succursale rattachée aux utilisateurs |
| `User` | Compte utilisateur avec rôle RBAC (VISITOR/CANDIDATE/AGENT/RH/ADMIN) et support OAuth2 Google |
| `Candidate` | Profil étendu du candidat : données personnelles, mobilité, préférences de recherche |
| `CV` | Document central : texte brut, entités parsées (JSONB), vecteur embedding 384-dim, version |
| `Competence` | Compétences extraites d'un CV (relation N:1 vers `CV`) |
| `Experience` | Expériences professionnelles extraites (N:1 vers `CV`) |
| `JobOffer` | Offre d'emploi avec son propre embedding 384-dim et pondérations de scoring |
| `Resultat` | Jonction pivot CV ↔ Offre : 4 sous-scores, décision RH, feedback |
| `CoverLetter` | Lettres de motivation rédigées par le candidat |
| `CandidateDocument` | Documents joints (diplômes, pièces d'identité) |
| `Entretien` | Entretien planifié manuellement ou via n8n |
| `AuditLog` | Journal d'audit de toutes les actions utilisateur |

### Énumérations

| Énumération | Valeurs |
|-------------|---------|
| `UserRole` | VISITOR, CANDIDATE, AGENT, RH, ADMIN |
| `CVStatus` | UPLOADED, PARSING, INDEXED, ERROR |
| `CVSource` | KEEJOB, AGENT, CANDIDAT, EMAIL, LINKEDIN |
| `OfferStatus` | ACTIVE, INACTIVE, ARCHIVED, BROUILLON, EN_VALIDATION, PROCHAINEMENT, DESACTIVEE, EXPIREE, REFUSEE |
| `Decision` | RETAINED, PENDING, REFUSED |
| `SkillLevel` | BEGINNER, INTERMEDIATE, EXPERT |

### Points techniques

- **Colonnes pgvector** : `cvs.embedding` et `job_offers.embedding` sont de type `Vector(384)`. Un index `ivfflat` (100 listes, distance cosinus) est créé sur `cvs.embedding` pour la recherche des plus proches voisins lors du matching.
- **Colonnes JSONB** : `cv_entities` (15+ entités parsées), `job_offers.competences_requises` (liste utilisée pour le score Jaccard), `job_offers.details` (champs libres), `candidates.secteurs_recherche` / `metiers_recherche`.
- **Absence de table `candidatures`** : la candidature est représentée par un enregistrement `Resultat` avec `decision=PENDING`, créé à l'appel de `POST /api/candidate/offers/{id}/apply`.

---

## 2. Diagramme de Cas d'Utilisation

### Objet

Le diagramme de cas d'utilisation identifie les **5 acteurs** du système et leurs fonctionnalités respectives, dérivées des routes enregistrées dans `backend/app/main.py` et `frontend/src/router/index.tsx`.

### Acteurs et périmètres

| Acteur | Portail | Cas d'utilisation principaux |
|--------|---------|------------------------------|
| **Visiteur** | `/` (public) | Consulter les offres, s'inscrire, se connecter (local ou Google OAuth2) |
| **Candidat** | `/candidate/*` | Gérer son profil, déposer un CV, postuler, suivre ses candidatures (timeline 4 étapes), générer un CV PDF, gérer ses lettres de motivation et documents |
| **Agent** | `/agent/*` | Importer des CVs (Keejob individuel ou batch), consulter la qualité OCR, gérer la liste des candidats, consulter l'historique des imports |
| **RH** | `/rh/*` | Créer/gérer des offres, déclencher le matching, consulter les résultats rankés, prendre des décisions (retenir/refuser) avec feedback, planifier des entretiens, consulter les statistiques |
| **Admin** | `/admin/*` | Gérer les utilisateurs et filiates, consulter les logs d'audit, surveiller la santé système |
| **n8n** | Webhooks `/api/n8n/*` | Recevoir les créneaux générés, confirmer l'envoi des emails d'entretien |

### Contrôle d'accès (RBAC)

L'accès à chaque cas d'utilisation est contrôlé par les dépendances FastAPI définies dans `api/dependencies.py` (`require_candidate`, `require_agent`, `require_rh`, `require_admin`). Toute requête vers une route protégée doit présenter un token JWT valide avec le rôle approprié.

---

## 3. Diagramme de Séquence — Authentification

### Objet

Ces diagrammes décrivent les flux d'authentification implémentés dans `security.py`, `routes/visitor/auth.py` et `routes/auth/google.py`.

### Flux 1 : Connexion locale (email / mot de passe)

```
Client → POST /api/visitor/login → FastAPI
    → SELECT user WHERE email=? (PostgreSQL)
    → Vérification bcrypt (password vs hashed_pwd)
    → create_access_token({ sub: email, role })
    → { access_token, token_type: "bearer" }
```

Le token est stocké dans `localStorage` (React via Zustand) ou `flutter_secure_storage` (Flutter). Il est transmis sur chaque requête dans l'en-tête `Authorization: Bearer <token>`.

### Flux 2 : Connexion Google OAuth2

```
Client → GET /api/auth/google/login → Redirect Google OAuth2
    → Google → Callback /api/auth/google/callback?code=...
    → Échange code → access_token Google → GET userinfo
    → Upsert User (google_id, email, avatar_url, auth_provider="google")
    → create_access_token ATS RANDA → Redirect /auth/callback?token=...
    → Frontend stocke token, redirige vers le bon portail selon role
```

### Flux 3 : Validation token sur requête protégée

```
Authorization: Bearer <token>
    → HTTPBearer() → decode_token() (PyJWT, clé SECRET_KEY)
    → Lecture sub (email) + role
    → require_role(*roles) → 403 si rôle insuffisant
    → Injection User dans le handler
```

Gestion d'expiration : une réponse `401` déclenche automatiquement la déconnexion et la redirection vers `/login` via l'intercepteur Axios (React) et le `_AuthInterceptor` Dio (Flutter).

---

## 4. Diagramme de Séquence — Pipeline NLP et Matching

### Objet

Ces diagrammes décrivent le pipeline NLP complet depuis l'import d'un CV jusqu'à la prise de décision RH, basés sur `cv_tasks.py`, `embedder.py`, `scorer.py` et `routes/rh/matching.py`.

### Flux 1 : Import CV Keejob (synchrone)

L'import Keejob est le seul parsing **synchrone** du système — il s'exécute dans la requête HTTP, pas dans Celery.

```
Agent → POST /api/agent/import/keejob (PDF)
    → Validation taille ≤ 10 Mo
    → extract_text_from_pdf() (pdfplumber ou Tesseract OCR)
    → keejob_parser.parse_keejob_cv() : 15+ champs regex
    → INSERT Candidate + CV (statut=INDEXED, source=KEEJOB)
    → INSERT Competences + Experiences
    → Réponse immédiate avec cv_entities extraites
```

### Flux 2 : Traitement asynchrone Celery — `process_cv_on_upload`

Déclenché automatiquement après tout upload ou modification de CV :

```
Celery → process_cv_on_upload(cv_id)
    1. extract_text_from_pdf() si cv_text vide
    2. keejob_parser (source=KEEJOB) ou generic_parser (AGENT/CANDIDAT)
    3. cv_to_embed_text() → encode() via run_in_executor → Vector(384)
    4. cv_version++ → statut=INDEXED
    5. Pour chaque offre ACTIVE :
        - Cosinus pgvector (embedding <=> offer_embedding)
        - scorer.py : 4 critères pondérés → score_final
        - INSERT Resultat si nouveau, UPDATE si PENDING existant
        - SKIP si RETAINED ou REFUSED (règle d'immuabilité)
```

### Flux 3 : Matching manuel déclenché par le RH

```
RH → POST /api/rh/offers/{id}/matching?force=false
    → Si force=False et résultats existants → retourne résultats en cache
    → Si force=True ou aucun résultat :
        → pgvector : SELECT cvs ORDER BY embedding <=> offer.embedding LIMIT 200
        → scorer.py : 4 critères pondérés pour chaque CV
        → Stockage TOP 50 en base (PENDING uniquement — RETAINED/REFUSED préservés)
```

### Algorithme de scoring (`scorer.py`)

| Critère | Poids | Méthode |
|---------|-------|---------|
| Similarité sémantique | 40 % | Cosinus pgvector (embedding CV vs offre) |
| Compétences | 35 % | Jaccard (intersection / union des compétences) |
| Expérience | 15 % | Ratio années requises / années réelles (plafonné à 1,0) |
| Langue | 10 % | Correspondance langue principale |

**Règle d'immuabilité des décisions** : Les décisions `RETAINED` et `REFUSED` ne sont **jamais écrasées**. Seuls les résultats `PENDING` sont recalculés ou créés lors d'un nouveau matching.

---

## 5. Diagramme de Séquence — Cycle de vie d'une Candidature

### Objet

Ce diagramme trace le parcours complet d'une candidature depuis la soumission du CV par le candidat jusqu'à la planification d'un entretien via n8n.

### Étapes principales

```
Candidat → POST /api/candidate/offers/{id}/apply
    → INSERT Resultat (decision=PENDING, source=CANDIDAT)
    → Celery : process_cv_on_upload → scoring → statut=INDEXED

RH → GET /api/rh/offers/{id}/matching
    → Résultats rankés par score_final

RH → PATCH /api/rh/offers/{id}/matching/{result_id}
    → { decision: "RETAINED", feedback_rh: "...", feedback_visible: true }
    → send_decision_notification() (email, fire-and-forget)

n8n → POST /api/n8n/declencher-generation
    → Génération créneaux d'entretien pour candidats RETAINED
    → INSERT Entretien (statut=PROPOSE)

n8n → POST /api/n8n/envoyer-emails-backend
    → send_entretien_invitation() via mailer.py
    → Entretien.statut = ENVOYE
```

### Timeline candidat (4 étapes)

`GET /api/candidate/applications/{id}/detail` retourne la progression sur 4 étapes :

| Étape | Statut | Condition |
|-------|--------|-----------|
| 1 — Postulé | Toujours visible | Résultat créé |
| 2 — Analyse IA | Visible | CV indexé (statut=INDEXED) |
| 3 — En examen | Visible | RH a consulté les résultats |
| 4 — Décision | Visible | decision ≠ PENDING |

---

## 6. Diagramme de Composants — Architecture Technique

### Objet

Le diagramme de composants représente l'architecture distribuée telle que définie dans `docker-compose.yml` : 11 services Docker, leurs flux de communication et les clients externes.

### Services et responsabilités

| Composant | Image / Build | Port | Rôle |
|-----------|--------------|------|------|
| **Nginx** | `nginx:1.25-alpine` | 80 | Reverse proxy, point d'entrée unique |
| **FastAPI Backend** | Build local | 8000 | API REST, NLP, auth JWT |
| **Celery Worker** | Build local | — | 4 workers, tâches CPU-bound (embed, parse, match) |
| **Flower** | Build local | 5555 | Monitoring des tâches Celery |
| **PostgreSQL + pgvector** | `pgvector/pgvector:pg16` | 5432 | Base de données principale, vecteurs 384-dim |
| **Redis** | `redis:7.2-alpine` | 6379 | Broker Celery + backend résultats tâches |
| **n8n** | `n8nio/n8n:latest` | 5678 | Orchestrateur de workflows entretiens |
| **Prometheus** | `prom/prometheus:v2.52.0` | 9090 | Collecte métriques |
| **Grafana** | `grafana/grafana:10.4.0` | 3001 | Tableaux de bord métriques |
| **redis-exporter** | `oliver006/redis_exporter` | — | Export métriques Redis → Prometheus |
| **postgres-exporter** | `prometheuscommunity/postgres_exporter` | — | Export métriques PG → Prometheus |

### Flux réseau

```
Clients (Browser React / App Flutter)
    ↓ HTTP :80
Nginx
    ├─ /api/* ──────→ FastAPI :8000
    │                     ├─→ PostgreSQL :5432
    │                     ├─→ Redis :6379 (Celery dispatch)
    │                     └─→ Mailer SMTP
    └─ / ──────────→ npm dev server host:3000

Celery Worker
    ├─ Consomme Redis :6379 (queue tâches)
    ├─ Lit/écrit PostgreSQL :5432
    └─ Charge modèle NLP (sentence-transformers, mémoire partagée)

n8n :5678
    └─ POST /api/n8n/* → FastAPI (sécurisé X-N8N-Secret)
```

---

## 7. Diagrammes d'États — Cycles de vie des entités

### Objet

Ces diagrammes modélisent les transitions d'état de chaque entité principale, dérivées des énumérations dans `db_models.py` et de la logique dans les services/tasks.

### États d'un CV (`cvs.statut`)

```
[UPLOAD] → UPLOADED → PARSING (Celery) → INDEXED ✓
                                        ↘ ERROR (après 3 tentatives)
```

- `UPLOADED` : fichier stocké, tâche Celery non encore démarrée.
- `PARSING` : tâche `process_cv_on_upload` en cours (extraction texte + NLP + embedding).
- `INDEXED` : pipeline terminé avec succès, `embedding` Vector(384) renseigné. L'état repasse à INDEXED (sans passer par PARSING) lors d'un re-embedding déclenché par une validation candidat.
- `ERROR` : échec irrémédiable (PDF corrompu, texte vide, exception après 3 retries).

### États d'un Résultat / Candidature (`resultats.decision`)

```
[Création] → PENDING → RETAINED (décision définitive)
                      ↘ REFUSED  (décision définitive)
```

`RETAINED` et `REFUSED` sont **immuables** — aucune tâche Celery ni action RH ne peut les écraser.

### États d'une Offre (`job_offers.statut`)

```
BROUILLON → EN_VALIDATION → ACTIVE → INACTIVE → ARCHIVED
                                    ↘ PROCHAINEMENT
                                    ↘ EXPIREE (date_expiration dépassée)
                                    ↘ DESACTIVEE
         → REFUSEE (validation refusée)
```

### États d'un Entretien (`entretiens.statut`)

```
[Création n8n] → PROPOSE → CONFIRME → ENVOYE ✓
                          ↘ ANNULE
                PLANIFIE (entrée manuelle RH)
```

---

## 8. Diagrammes d'Activités — Processus Métier

### Objet

Les diagrammes d'activités utilisent des swimlanes pour modéliser les processus métier bout en bout, en distinguant les rôles de chaque acteur dans le flux global.

### Processus 1 : Recrutement bout en bout

Swimlanes : **Agent** | **Système NLP (Celery)** | **RH** | **Candidat** | **n8n**

Étapes clés :
1. Agent reçoit le PDF et choisit le format (Keejob ou générique).
2. Celery parse, génère l'embedding et fait le matching initial.
3. RH consulte les résultats rankés, filtre par critères avancés, prend les décisions.
4. n8n génère les créneaux d'entretien pour les RETAINED et envoie les emails.
5. Candidat reçoit la notification et confirme le créneau.

### Processus 2 : Import batch de CVs

Swimlane : **Agent** | **Système (API + Celery)**

Pour chaque fichier du batch, le système détecte le format, extrait le texte (pdfplumber ou OCR Tesseract ara+fra+eng), et lance une tâche Celery indépendante par CV.

### Processus 3 : Candidature en ligne (portail candidat)

Swimlane : **Candidat** | **Système (API)** | **RH**

Le candidat complète son profil → uploade ou remplit un CV → postule → reçoit la confirmation → suit la timeline 4 étapes → reçoit le feedback et la décision → confirme éventuellement l'entretien.

---

## 9. Diagramme de Déploiement — Infrastructure

### Objet

Le diagramme de déploiement documente l'environnement d'exécution réel : machine hôte (Windows 11 ou Linux), Docker Engine et les clients externes.

### Architecture hybride hôte + Docker

```
Machine Hôte
├── npm dev server (React 18, Vite :3000)    ← hors Docker
├── Flutter Web (chrome, port aléatoire)      ← hors Docker
└── Docker Engine
    └── Réseau bridge ats_network
        ├── ats_nginx      :80   (point d'entrée)
        ├── ats_backend    :8000 (FastAPI)
        ├── ats_celery           (worker asynchrone)
        ├── ats_flower     :5555
        ├── ats_postgres   :5432 (+ volume postgres_data)
        ├── ats_redis      :6379 (+ volume redis_data)
        ├── ats_n8n        :5678 (+ volume n8n_data)
        ├── ats_prometheus :9090 (+ volume prometheus_data)
        ├── ats_grafana    :3001 (+ volume grafana_data)
        ├── redis-exporter
        └── postgres-exporter
```

### Volumes persistants

| Volume | Données |
|--------|---------|
| `postgres_data` | Tables PostgreSQL (CVs, candidats, offres, résultats) |
| `redis_data` | Queues Celery persistées |
| `uploads_data` | Fichiers PDF/images uploadés (`/app/uploads/`) |
| `n8n_data` | Workflows n8n configurés |
| `prometheus_data` | Métriques historiques (rétention 15 jours) |
| `grafana_data` | Dashboards Grafana provisionnés |

### URLs d'accès

| Service | URL |
|---------|-----|
| Application web | http://localhost |
| Swagger UI | http://localhost:8000/docs |
| Flower (Celery) | http://localhost:5555 |
| n8n | http://localhost:5678 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |

---

## 10. Diagramme de Séquence — Application Mobile Flutter

### Objet

Ce diagramme décrit les flux spécifiques à l'application mobile Flutter : démarrage avec restauration de session, gestion de l'état Riverpod, et flux de matching depuis un écran mobile.

### Flux 1 : Démarrage et restauration de session

```
Flutter main() → ProviderScope → authStateProvider (AsyncNotifierProvider)
    → flutter_secure_storage.read('access_token')
    → Si token présent : GET /api/rh/me → RhUser
    → GoRouter redirect : /dashboard (RH) ou /candidate/dashboard (CANDIDATE)
    → Si 401 : clearTokens() → redirect /login
```

### Flux 2 : Invalidation Riverpod après mutation

```
RH → Swipe décision (Retenir/Refuser)
    → PATCH /api/rh/offers/{id}/matching/{result_id}
    → ref.invalidate(matchingResultsProvider(offerId))
    → Riverpod re-fetch automatique → UI mise à jour
```

### Flux 3 : Recherche live d'offres (candidat)

```
Candidat → Saisie dans le champ de recherche
    → candidateOfferSearchProvider (StateProvider<String>) mis à jour
    → candidateOffersProvider (FutureProvider.autoDispose) watch() → re-fetch
    → GET /api/visitor/offers?search=... → UI mise à jour
```

### Architecture d'authentification GoRouter

`_AuthChangeNotifier` observe `authStateProvider` via `ref.listen` et appelle `notifyListeners()`. GoRouter réevalue les redirections déclarativement à chaque changement — aucun `context.go` manuel n'est nécessaire dans les écrans.

---

## 11. Diagramme de Packages — Organisation du Code Source

### Objet

Le diagramme de packages montre l'organisation modulaire des trois surfaces applicatives et les dépendances entre modules.

### Backend FastAPI

```
main.py (point d'entrée)
├── api/
│   ├── dependencies.py     ← Auth RBAC (require_candidate/agent/rh/admin)
│   └── routes/
│       ├── visitor/        ← login, register, offres publiques
│       ├── auth/           ← Google OAuth2 callback
│       ├── candidate/      ← profile, cvs, applications, cover_letters
│       ├── agent/          ← cvs, import_keejob, candidates, dashboard
│       ├── rh/             ← offers, matching, dashboard, calendar, n8n
│       └── admin/          ← users, stats, system, audit
├── services/               ← Logique métier (miroir de routes/)
├── repositories/           ← Accès SQL (AsyncSession)
├── models/
│   ├── db_models.py        ← Source of truth SQLAlchemy
│   └── schemas/            ← Pydantic (entrée/sortie)
├── nlp/                    ← OCR, parser, embedder, scorer
├── tasks/                  ← Celery (cv_tasks, offer_tasks, alert_tasks)
└── core/                   ← config, database, security, mailer, celery_app
```

### Frontend React (TypeScript)

```
src/
├── router/         ← React Router 6 + ProtectedRoute + lazy loading
├── pages/          ← Composants de page par rôle
├── components/     ← Composants réutilisables (cv/, offer/, matching/, …)
├── hooks/          ← Hooks TanStack Query personnalisés
├── services/       ← api.ts (Axios + JWT) + services par rôle
├── store/          ← Zustand (authStore, notificationStore)
├── types/          ← Interfaces TypeScript
├── layouts/        ← Layouts par rôle (sidebar + header)
└── theme.ts        ← Couleurs + thème Ant Design
```

### Application Mobile Flutter

```
lib/
├── main.dart           ← ProviderScope → AtsRandaApp
├── router.dart         ← GoRouter (2 ShellRoutes RH + Candidat)
├── core/
│   ├── api_client.dart ← Dio + _AuthInterceptor
│   └── theme.dart      ← kPrimary, kGold, kGoldLight, kDarkBrown
├── models/             ← Freezed (RH) + classes plain Dart (Candidat)
├── repositories/       ← Wrappers API fins
├── providers/          ← Riverpod (AsyncNotifier, FutureProvider.autoDispose)
└── ui/
    ├── screens/        ← Écrans RH + écrans Candidat
    └── widgets/        ← AppShell, CandidateShell, StatusBadge
```

---

## Cohérence des noms

Les noms de classes, tables, routes et champs sont identiques dans tous les diagrammes et correspondent au code source :

| Concept | Nom dans le code |
|---------|-----------------|
| Table candidats | `candidates` (ORM : `Candidate`) |
| Table résultats | `resultats` (ORM : `Resultat`) |
| Table offres | `job_offers` (ORM : `JobOffer`) |
| Table entretiens | `entretiens` (ORM : `Entretien`) |
| CV indexé | `INDEXED` (enum `CVStatus`) |
| Décision retenu | `RETAINED` (enum `Decision`) |
| Colonne vecteur CV | `embedding Vector(384)` |
| Pondération sémantique | `poids_semantique` (défaut `0.40`) |

---

## Comment visualiser les diagrammes

### VS Code
Installer l'extension **Markdown Preview Mermaid Support** puis `Ctrl+Shift+V`.

### En ligne
Copier le contenu d'un bloc ` ```mermaid ``` ` sur **https://mermaid.live**.

### draw.io
Ouvrir un fichier `.drawio` depuis `docs/uml/drawio/` directement dans draw.io ou diagrams.net.
Pour les fichiers `.puml` : *Insert → Advanced → From Text → onglet PlantUML*.

### GitHub / GitLab
Les fichiers `.md` avec blocs Mermaid sont rendus nativement dans l'interface web.
