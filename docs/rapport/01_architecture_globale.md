# Architecture Globale du Système ATS RANDA

## 2.1 Vue d'ensemble

ATS RANDA repose sur une architecture **3-tiers** classique, enrichie d'une couche de traitement asynchrone et d'un proxy HTTP centralisé.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│                                                             │
│   ┌──────────────────┐        ┌──────────────────────┐      │
│   │  Navigateur Web  │        │  App Flutter Mobile  │      │
│   │  React 18 / TS   │        │  Android / iOS / Web │      │
│   │  Port 3000 (dev) │        │  Port aléatoire      │      │
│   └────────┬─────────┘        └──────────┬───────────┘      │
└────────────┼──────────────────────────────┼─────────────────┘
             │ HTTP/REST                    │ HTTP/REST
             ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     NGINX (Port 80)                         │
│               Reverse Proxy + Load Balancer                 │
│  /          → host.docker.internal:3000 (frontend npm)      │
│  /api/*     → backend:8000                                  │
│  /docs      → backend:8000/docs (Swagger UI)                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND FastAPI (Port 8000)                │
│                                                             │
│  Routes → Services → Repositories                           │
│  JWT Auth + RBAC (5 rôles)                                   │
│  AsyncSession SQLAlchemy                                     │
│  NLP : OCR + Parser + Embedder + Scorer                      │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌───────────────┐   │
│  │  Celery Task │   │  Mailer SMTP │   │  n8n Webhooks │   │
│  │  (embed_cv)  │   │  Gmail/SMTP  │   │  X-N8N-Secret │   │
│  └──────┬───────┘   └──────────────┘   └───────────────┘   │
└─────────┼───────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────────┐
│                    COUCHE DONNÉES                           │
│                                                             │
│  ┌─────────────────────┐     ┌──────────────────────────┐  │
│  │ PostgreSQL 16        │     │  Redis 7.2               │  │
│  │ + pgvector extension │     │  Cache + Broker Celery   │  │
│  │ Port 5432            │     │  Port 6379               │  │
│  │ Vecteurs 384-dim     │     │                          │  │
│  └─────────────────────┘     └──────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────────┐
│                   MONITORING                                │
│                                                             │
│  Prometheus (Port 9090) ─→ Grafana (Port 3001)             │
│  Flower / Celery (Port 5555)                                │
│  n8n Workflows (Port 5678)                                  │
└────────────────────────────────────────────────────────────┘
```

### Justification des choix technologiques

| Technologie | Justification |
|-------------|---------------|
| **FastAPI** | Framework Python asynchrone natif (`async/await`), génération automatique OpenAPI/Swagger, validation Pydantic, performances proches de NodeJS |
| **PostgreSQL + pgvector** | Extension native pour stocker et interroger des vecteurs flottants 384-dim avec l'opérateur cosinus (`<=>`) ; évite un service vectoriel externe (Pinecone, Weaviate) |
| **sentence-transformers** | Modèle `paraphrase-multilingual-MiniLM-L12-v2` : multilingue (FR/EN/AR), léger (66M paramètres), vecteurs 384-dim de qualité, temps d'inférence ~20 ms/doc sur CPU |
| **Celery + Redis** | Découplage des tâches CPU-bound (embedding, parsing) de la boucle asyncio FastAPI ; Redis fonctionne comme broker ET comme backend de résultats |
| **Flutter** | Un seul code base pour Android, iOS et web ; Riverpod garantit un état immuable et testable ; GoRouter gère les redirections d'authentification de façon déclarative |
| **n8n** | Orchestrateur no-code pour les workflows d'entretien (génération de créneaux, envoi d'emails) ; aucune logique métier n'y réside — tout est délégué au backend |

---

## 2.2 Backend FastAPI

### Pattern architectural : Routes → Services → Repositories

```
backend/app/
├── api/routes/          ← Endpoints HTTP (validation, auth, appel service)
│   ├── visitor/         ← /api/visitor/*
│   ├── auth/            ← /api/auth/* (Google OAuth2)
│   ├── candidate/       ← /api/candidate/*
│   ├── agent/           ← /api/agent/*
│   ├── rh/              ← /api/rh/*
│   └── admin/           ← /api/admin/*
├── services/            ← Logique métier (mirroir de routes/)
├── repositories/        ← Accès base de données (SQLAlchemy async)
├── models/
│   ├── db_models.py     ← Modèles SQLAlchemy (source of truth schéma)
│   └── schemas/         ← Schémas Pydantic (entrée/sortie)
├── nlp/                 ← Pipeline NLP (OCR, parser, embedder, scorer)
├── tasks/               ← Tâches Celery
└── core/                ← Config, sécurité, mailer, base de données
```

Chaque couche a une responsabilité unique :
- **Routes** : décoder la requête HTTP, vérifier les droits, appeler le service, retourner la réponse.
- **Services** : orchestrer la logique métier, combiner plusieurs appels repository.
- **Repositories** : exécuter les requêtes SQL via `AsyncSession`, jamais de logique métier.

### Système d'authentification JWT + RBAC

L'authentification repose sur des tokens **JWT (JSON Web Token)** signés avec l'algorithme **HS256** et la clé secrète `SECRET_KEY`.

```
Client  →  POST /api/visitor/login  →  Backend
                ↓
        Vérification bcrypt (password vs hashed_pwd)
                ↓
        create_access_token({ sub: user.email, role: user.role })
        Expiration : ACCESS_TOKEN_EXPIRE_MINUTES (défaut 60 min)
                ↓
        Retour : { access_token, token_type: "bearer" }
```

Sur chaque requête protégée :
```
Authorization: Bearer <token>
        ↓
HTTPBearer() → get_current_user() → decode_token()
        ↓
Vérification rôle via require_role(*roles)
        ↓
Injection User dans le handler (Depends)
```

**Dépendances de rôle** (`api/dependencies.py`) :

| Dépendance | Rôle requis | Usage |
|------------|-------------|-------|
| `require_candidate` | CANDIDATE | Routes `/api/candidate/*` |
| `require_agent` | AGENT | Routes `/api/agent/*` |
| `require_rh` | RH | Routes `/api/rh/*` |
| `require_admin` | ADMIN | Routes `/api/admin/*` |
| `get_optional_user` | — | Endpoints semi-publics (ex. : offres visiteur) |

### Gestion asynchrone : AsyncSession et run_in_executor

FastAPI tourne sur une boucle asyncio. Les sessions SQLAlchemy sont **asynchrones** (`AsyncSession`) pour ne pas bloquer la boucle lors des requêtes SQL.

En revanche, le modèle NLP (`sentence-transformers`) est **synchrone et CPU-bound**. Appeler `encode()` directement depuis un handler async bloquerait toutes les requêtes concurrentes. La règle est donc obligatoire :

```python
# INCORRECT — bloque la boucle asyncio
embedding = encode(text)

# CORRECT — délègue au thread pool
loop = asyncio.get_event_loop()
embedding = await loop.run_in_executor(None, encode, text)
```

Le modèle est pré-chargé au démarrage dans `main.py::lifespan()` via `run_in_executor`, évitant le cold-start (~5–10 s sur CPU) lors de la première requête réelle.

---

## 2.3 Base de données

### Tables et rôle fonctionnel

| Table | Rôle |
|-------|------|
| `users` | Comptes utilisateurs, rôle RBAC, OAuth Google |
| `filiates` | Entités juridiques / succursales de l'entreprise |
| `candidates` | Profil candidat étendu (personnel, professionnel, mobilité) |
| `cvs` | Documents CV : texte brut, entités parsées, vecteur embedding 384-dim |
| `competences` | Compétences extraites d'un CV (N:1 → `cvs`) |
| `experiences` | Expériences professionnelles (N:1 → `cvs`) |
| `job_offers` | Offres d'emploi avec vecteur embedding et pondérations scoring |
| `resultats` | Résultats de matching CV ↔ offre avec 4 scores et décision RH |
| `cover_letters` | Lettres de motivation rédigées par le candidat |
| `candidate_documents` | Documents joints (diplômes, CIN, etc.) |
| `entretiens` | Entretiens planifiés (manuel ou via n8n) |
| `audit_logs` | Journal de toutes les actions utilisateur |

### Relations principales

```
filiates (1) ──────────────── (N) users
users (1) ──────────────────── (N) cvs [via id_agent]
candidates (1) ─────────────── (N) cvs
cvs (1) ────────────────────── (N) competences
cvs (1) ────────────────────── (N) experiences
cvs (1) ────────────────────── (N) resultats
job_offers (1) ──────────────── (N) resultats
job_offers (1) ──────────────── (N) entretiens
resultats (1) ───────────────── (1) entretiens [optionnel]
candidates (1) ──────────────── (N) cover_letters
candidates (1) ──────────────── (N) candidate_documents
users (1) ──────────────────── (N) audit_logs
```

### Extension pgvector

pgvector est une extension PostgreSQL native qui ajoute :
- Le type `vector(n)` pour stocker des tableaux de flottants de dimension fixe.
- Les opérateurs de distance : cosinus (`<=>`), L2 (`<->`), produit scalaire (`<#>`).
- Les index **ivfflat** (Inverted File Flat) pour la recherche approximative des plus proches voisins.

Dans ATS RANDA, deux colonnes `vector(384)` sont utilisées :
- `cvs.embedding` — vecteur du texte CV (titre, compétences, expériences, formations, langues)
- `job_offers.embedding` — vecteur du texte de l'offre (titre, description, compétences requises)

La requête de pré-filtre pgvector lors du matching :
```sql
SELECT id FROM cvs
ORDER BY embedding <=> :offer_embedding
LIMIT 200
```
Cette requête retourne les 200 CVs les plus proches de l'offre en distance cosinus, avant l'étape de scoring détaillé.

---

## 2.4 Frontend React

### Architecture par rôle

Le frontend est une **SPA (Single Page Application)** React 18 + TypeScript structurée en 4 portails distincts, chacun avec son propre layout et ses routes protégées :

```
/                   → Portail public (offres, connexion, inscription)
/candidate/*        → Portail candidat (ProtectedRoute rôle CANDIDATE)
/agent/*            → Portail agent (ProtectedRoute rôle AGENT)
/rh/*               → Portail RH (ProtectedRoute rôle RH)
/admin/*            → Portail admin (ProtectedRoute rôle ADMIN)
```

### Stack technique

| Bibliothèque | Rôle |
|--------------|------|
| **Ant Design 5** | Composants UI (tableaux, formulaires, modals, drawers) |
| **Tailwind CSS 4** | Utilitaires CSS pour la mise en page |
| **TanStack Query** | Gestion du state serveur : cache, invalidation, polling |
| **Zustand** | State global léger : token JWT + utilisateur courant (persisté en `localStorage`) |
| **React Router 6** | Routing déclaratif, `ProtectedRoute`, lazy loading |
| **Axios** | Client HTTP avec intercepteurs JWT et gestion 401 |
| **Recharts** | Graphiques (courbes, camemberts) pour les statistiques |
| **FullCalendar** | Calendrier interactif des entretiens |
| **react-to-print** | Export PDF du générateur de CV |

### Charte graphique

Toutes les couleurs sont définies dans `frontend/src/theme.ts` :

| Variable | Valeur hexadécimale | Usage |
|----------|---------------------|-------|
| `COLORS.primary` | `#8B1A1A` | Boutons, liens, accents |
| `COLORS.gold` | `#C9A84C` | Accents, en-têtes de tableaux |
| `COLORS.goldLight` | `#F0D080` | Fond léger doré |
| `COLORS.sidebarBg` | `#3D0C02` | Fond de toutes les barres latérales |
| `COLORS.darkBrown` | `#3D0C02` | Textes sombres |

### Pattern de chargement de données

```
Composant React
    ↓
Hook personnalisé (ex: useOffers())
    ↓
TanStack Query → useQuery({ queryKey: ['rh', 'offers'], queryFn })
    ↓
Service API (ex: rhService.getOffers())
    ↓
Axios instance (services/api.ts) + intercepteur JWT
    ↓
GET http://localhost:8000/api/rh/offers
```

Tous les composants de pages sont chargés en **lazy loading** via `React.lazy()` + `Suspense`, à l'exception de `LoginPage` et `RegisterPage` (critiques au démarrage). Les dépendances lourdes (FullCalendar, Recharts, `@ant-design/icons`) sont pré-optimisées via `optimizeDeps.include` dans `vite.config.ts`.

---

## 2.5 Application Mobile Flutter

### Architecture MVVM avec Riverpod

L'application mobile suit le pattern **Provider → Repository → ApiClient** :

```
Écran Flutter (ConsumerWidget)
    ↓
Provider Riverpod (ex: offersProvider)
    ↓
Repository (ex: OffersRepository)
    ↓
ApiClient (Dio + intercepteur JWT)
    ↓
GET http://localhost:8000/api/rh/offers
```

**Riverpod** est utilisé pour toute la gestion d'état :
- `AsyncNotifierProvider` pour l'authentification (`authStateProvider`) — supporte les transitions de cycle de vie (chargement, connecté, déconnecté).
- `FutureProvider.autoDispose` pour toutes les données serveur — les données sont libérées automatiquement quand l'écran est fermé, forçant un rechargement frais à la prochaine navigation.

### Portail RH mobile

L'application est limitée au rôle **RH** par choix délibéré :
- Les RH ont besoin d'accéder aux décisions de recrutement en déplacement (depuis un téléphone ou une tablette).
- Les candidats disposent déjà d'un portail web accessible depuis mobile via navigateur.
- Limiter le périmètre mobile réduit la surface de sécurité et la complexité de maintenance.

### Synchronisation des données

- `FutureProvider.autoDispose` : chaque provider se réinitialise automatiquement à la fermeture de l'écran.
- `ref.invalidate(provider)` : déclenche un rechargement immédiat après une mutation (décision, feedback).
- Aucun état local ne duplique l'état du backend : la source de vérité est toujours l'API.

### Navigation

GoRouter utilise un `ShellRoute` pour les 5 onglets de navigation inférieure (`/dashboard`, `/offers`, `/matching`, `/applications`, `/cvtheque`) et des routes détail distinctes hors shell (`/applications/:id`, `/offers/:id`, `/calendar`).

L'authentification est gérée par `_AuthChangeNotifier` qui observe `authStateProvider` via `ref.listen` et notifie GoRouter — les redirections de connexion/déconnexion sont donc entièrement déclaratives, sans appel manuel à `context.go`.

---

## 2.6 Infrastructure Docker

### Services et ports

| Service | Image | Port exposé | Rôle |
|---------|-------|-------------|------|
| `postgres` | `pgvector/pgvector:pg16` | 5432 | Base de données principale |
| `redis` | `redis:7.2-alpine` | 6379 | Broker Celery + cache |
| `backend` | Build local | 8000 | API FastAPI |
| `celery_worker` | Build local | — | Tâches asynchrones (4 workers) |
| `flower` | Build local | 5555 | Monitoring Celery |
| `nginx` | `nginx:1.25-alpine` | 80 | Reverse proxy |
| `prometheus` | `prom/prometheus:v2.52.0` | 9090 | Collecte métriques |
| `grafana` | `grafana/grafana:10.4.0` | 3001 | Tableaux de bord métriques |
| `redis-exporter` | `oliver006/redis_exporter:v1.61.0` | — | Export métriques Redis → Prometheus |
| `postgres-exporter` | `prometheuscommunity/postgres_exporter:v0.15.0` | — | Export métriques PG → Prometheus |
| `n8n` | `n8nio/n8n:latest` | 5678 | Orchestrateur de workflows |

### Flux réseau via Nginx

Nginx est le point d'entrée unique sur le port 80. Il route :
- `/` et toutes les routes SPA → `host.docker.internal:3000` (serveur de développement npm sur la machine hôte)
- `/api/*` → `backend:8000` (container FastAPI dans le réseau Docker interne)
- `/docs` → `backend:8000/docs` (Swagger UI)

Le réseau Docker `ats_network` (bridge) isole les containers ; seuls les ports ci-dessus sont exposés à l'hôte.

### Volumes persistants

| Volume | Contenu |
|--------|---------|
| `postgres_data` | Données PostgreSQL (CVs, candidats, offres) |
| `redis_data` | Persistance Redis (optionnelle) |
| `n8n_data` | Workflows n8n importés |
| `uploads_data` | Fichiers PDF et images uploadés |
| `prometheus_data` | Métriques historiques |
| `grafana_data` | Dashboards Grafana configurés |
