# DevOps — ATS RANDA

Vue d'ensemble des technologies et outils DevOps utilisés dans le projet.

---

## Architecture globale

```
                        ┌──────────────────────────────────────────┐
                        │              Docker Network               │
                        │                ats_network                │
                        │                                          │
  Browser ──► :80 ──►  │  Nginx ──► backend:8000  (FastAPI)       │
                        │        └──► host.docker.internal:3000    │
                        │                                          │
                        │  FastAPI ──► postgres:5432               │
                        │          └──► redis:6379                 │
                        │                                          │
                        │  Celery Worker ──► redis:6379            │
                        │  Flower ──────────────────── :5555       │
                        │                                          │
                        │  Prometheus ──► FastAPI /metrics         │
                        │             └──► postgres-exporter       │
                        │             └──► redis-exporter          │
                        │  Grafana ──► Prometheus                  │
                        └──────────────────────────────────────────┘
```

---

## Conteneurisation

### Docker
| Élément | Détail |
|---------|--------|
| Version Compose | V2 (`docker compose`) |
| Image backend | `python:3.11-slim-bookworm` (custom Dockerfile) |
| Réseau | Bridge personnalisé `ats_network` |
| Volumes nommés | `postgres_data`, `redis_data`, `uploads_data`, `prometheus_data`, `grafana_data` |
| Stratégie de restart | `unless-stopped` sur tous les services |
| Health checks | PostgreSQL (`pg_isready`), Redis (`redis-cli ping`) |

### Dockerfile backend
```
Base image : python:3.11-slim-bookworm
Dépendances système : gcc, g++, libpq-dev, curl, poppler-utils
OCR : tesseract-ocr + langues (fra, ara)
Port exposé : 8000
CMD : uvicorn avec --reload (dev)
```

### Services Docker Compose
| Service | Image | Port |
|---------|-------|------|
| `postgres` | `pgvector/pgvector:pg16` | 5432 |
| `redis` | `redis:7.2-alpine` | 6379 |
| `backend` | Custom (python:3.11-slim) | 8000 |
| `celery_worker` | Custom (même image que backend) | — |
| `flower` | Custom (même image que backend) | 5555 |
| `nginx` | `nginx:1.25-alpine` | 80 |
| `prometheus` | `prom/prometheus:v2.52.0` | 9090 |
| `grafana` | `grafana/grafana:10.4.0` | 3001 |
| `redis-exporter` | `oliver006/redis_exporter:v1.61.0` | — |
| `postgres-exporter` | `prometheuscommunity/postgres-exporter:v0.15.0` | — |

---

## Reverse Proxy

### Nginx 1.25 (Alpine)
- Entrée unique sur le port **:80**
- Routage :
  - `/api/*` → `backend:8000` (timeout 300s, max body 20MB)
  - `/docs`, `/redoc`, `/openapi.json` → `backend:8000`
  - `/` → `host.docker.internal:3000` (frontend Vite dev server, hors Docker)
- Compression **gzip** activée (JSON, JS, CSS, text)
- Support WebSocket (`Upgrade: websocket`) pour le HMR de Vite

---

## Base de données

### PostgreSQL 16 + pgvector
- Image : `pgvector/pgvector:pg16`
- Extension **pgvector** : embeddings 384 dimensions (cosine similarity)
- Init SQL : `scripts/init.sql` monté via `docker-entrypoint-initdb.d`
- ORM : **SQLAlchemy 2.0** (async, sessions `AsyncSession`)
- Migrations : **Alembic 1.13** (`alembic upgrade head` via `make migrate`)

### Redis 7.2 (Alpine)
- Broker de messages pour Celery
- Backend de résultats Celery
- Authentification par mot de passe (`--requirepass`)

---

## File d'attente de tâches asynchrones

### Celery 5.3
- Worker : concurrence 4 (`--concurrency=4`)
- Tâches : `embed_cv()`, `embed_all_cvs()`, `embed_offer()`
- Broker & backend : Redis

### Flower
- Interface web de monitoring des workers Celery
- Port **:5555**
- Métriques exposées sur `/metrics` (scrappées par Prometheus)

---

## Observabilité

### Prometheus v2.52
- Scrape interval : **15s**
- Cibles monitorées :
  | Job | Cible | Métriques |
  |-----|-------|-----------|
  | `fastapi` | `backend:8000/metrics` | HTTP requests, latence, erreurs |
  | `postgres` | `postgres-exporter:9187` | Connexions, transactions, taille DB |
  | `redis` | `redis-exporter:9121` | Mémoire, commandes, clients |
  | `celery` | `flower:5555/metrics` | Tasks actives, échecs, temps d'exécution |
- Rétention des données : **15 jours**

### Grafana 10.4
- Port **:3001**
- Datasource : Prometheus (provisionné automatiquement)
- Dashboards provisionnés depuis `monitoring/grafana/provisioning/`
- Inscription publique désactivée (`GF_USERS_ALLOW_SIGN_UP=false`)

### Instrumentation backend
- Librairie : `prometheus-fastapi-instrumentator==6.1.0`
- Expose automatiquement les métriques FastAPI sur `/metrics`

---

## Automatisation — Makefile

| Commande | Action |
|----------|--------|
| `make up` | Démarrer tous les services |
| `make down` | Arrêter tous les services |
| `make build` | Rebuild + démarrer |
| `make logs` | Logs en temps réel |
| `make migrate` | `alembic upgrade head` dans le container |
| `make test` | pytest + coverage |
| `make test-unit` | Tests unitaires uniquement |
| `make test-integration` | Tests d'intégration uniquement |
| `make lint` | flake8 + black (check) |
| `make format` | Auto-format black |
| `make db-shell` | Accès psql interactif |
| `make shell` | Bash dans le container backend |
| `make clean` | `down -v` + `docker system prune` |
| `make status` | État des containers |

---

## Qualité du code

| Outil | Usage |
|-------|-------|
| **black** | Formatter Python (PEP 8 strict) |
| **flake8** | Linter Python |
| **pytest** | Framework de tests |
| **pytest-cov** | Couverture de code |

---

## Configuration & Secrets

- Toute la configuration passe par **`.env`** à la racine du projet
- Chargé via `env_file: .env` dans Docker Compose
- Lu côté Python par **Pydantic BaseSettings** (`app/core/config.py`)
- Variables clés : `POSTGRES_*`, `REDIS_*`, `SECRET_KEY`, `CORS_ORIGINS`, `UPLOAD_DIR`, `MAX_FILE_SIZE_MB`
- Template disponible dans `.env.example`

---

## Environnements

| Environnement | Fichier Compose | Frontend |
|---------------|-----------------|----------|
| Développement | `docker-compose.yml` | `npm run dev` (hors Docker, port 3000) |
| Production | `docker-compose.prod.yml` | Build statique servi par Nginx |

---

## Résumé des versions

| Technologie | Version |
|-------------|---------|
| Docker Compose | V2 |
| Python | 3.11 |
| PostgreSQL | 16 |
| pgvector | dernière compatible pg16 |
| Redis | 7.2 |
| Nginx | 1.25 |
| Celery | 5.3.6 |
| Alembic | 1.13.1 |
| SQLAlchemy | 2.0.30 |
| Prometheus | 2.52.0 |
| Grafana | 10.4.0 |
| Uvicorn | 0.30.1 |
| Tesseract OCR | (debian bookworm) |
