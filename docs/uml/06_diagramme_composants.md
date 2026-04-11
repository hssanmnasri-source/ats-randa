# Diagramme de Composants — Architecture Technique ATS RANDA

## Description

Ce diagramme représente l'architecture distribuée complète d'ATS RANDA telle que définie dans `docker-compose.yml`. Il montre les 11 services Docker, leur réseau interne (`ats_network`), les flux de données entre composants, ainsi que les clients externes (navigateur web React, application Flutter). Chaque composant est un container Docker autonome, sauf le serveur de développement frontend (npm, sur la machine hôte).

---

## Diagramme

```mermaid
flowchart TD
    subgraph CLIENTS["Clients Externes"]
        WEB["Navigateur Web\nReact 18 SPA\nhost:3000 (npm dev)"]
        MOB["App Flutter\nAndroid / iOS / Web\nport aléatoire"]
    end

    subgraph DOCKER["Réseau Docker : ats_network"]

        subgraph ENTREE["Point d'entrée"]
            NGINX["Nginx :80\nnginx:1.25-alpine\nReverse Proxy\n\n/api/* → backend:8000\n/ → host.docker.internal:3000\n/docs → backend:8000/docs"]
        end

        subgraph APP["Couche Application"]
            BACKEND["FastAPI Backend\nats_backend :8000\n\nRoutes: visitor/auth/candidate\nagent/rh/admin/n8n\nNLP: OCR+Parser+Embedder+Scorer\nCORS: allow_origin_regex localhost:*"]
            CELERY["Celery Worker\nats_celery\n--concurrency=4\n\nembed_cv\nembed_all_cvs\nprocess_cv_on_upload\nembed_offer"]
            FLOWER["Flower UI\nats_flower :5555\nMonitoring Celery"]
        end

        subgraph DATA["Couche Données"]
            PG["PostgreSQL 16 + pgvector\nats_postgres :5432\n\n12 tables\nVector(384) ivfflat index\nJSONB (cv_entities, details)\nVolume: postgres_data"]
            REDIS["Redis 7.2-alpine\nats_redis :6379\n\nBroker Celery (queues)\nBackend résultats tâches\nAuth: requirepass\nVolume: redis_data"]
        end

        subgraph AUTO["Automatisation"]
            N8N["n8n Workflows\nats_n8n :5678\n\nDB: PostgreSQL partagée\nWebhooks → /api/n8n/*\nVolume: n8n_data"]
        end

        subgraph MONITORING["Monitoring"]
            PROM["Prometheus\nats_prometheus :9090\n\nScrape: backend:8000/metrics\nScrape: redis-exporter\nScrape: postgres-exporter\nRetention: 15j\nVolume: prometheus_data"]
            GRAFANA["Grafana\nats_grafana :3001\n\nSource: Prometheus\nDashboards provisionning\nVolume: grafana_data"]
            REDIS_EXP["redis-exporter\nolas006/redis_exporter\nExport métriques Redis"]
            PG_EXP["postgres-exporter\nprometheus/postgres_exporter\nExport métriques PG"]
        end

        subgraph UPLOADS["Stockage fichiers"]
            VOL["Volume: uploads_data\n/app/uploads/\n\ncvs/ — PDFs et images\nphotos/ — avatars candidats"]
        end

    end

    %% Flux clients → Nginx
    WEB -->|HTTP :80| NGINX
    MOB -->|HTTP :80 ou :8000 direct| NGINX

    %% Nginx → Backend / Frontend
    NGINX -->|"/api/*\nproxy_pass"| BACKEND
    NGINX -->|"/ → host.docker.internal:3000\n(npm dev server)"|WEB

    %% Backend → Données
    BACKEND -->|"SQLAlchemy AsyncSession\nSELECT/INSERT/UPDATE"| PG
    BACKEND -->|"Celery apply_async()\nPubSub tâches"| REDIS
    BACKEND -->|"Lecture/écriture PDFs\n/app/uploads/"| VOL

    %% Celery Worker → Données
    CELERY -->|"Consomme tâches\nBROKER_URL=redis://"| REDIS
    CELERY -->|"UPDATE embeddings\nINSERT resultats"| PG
    CELERY -->|"Lecture PDFs\nOCR parsing"| VOL

    %% Flower ← Redis
    REDIS -->|"Events workers\nstatuts tâches"| FLOWER

    %% n8n → Backend
    N8N -->|"POST /api/n8n/*\nX-N8N-Secret header"| BACKEND
    N8N -->|"DB propre (tables n8n_*)\ndans PostgreSQL partagé"| PG

    %% Monitoring
    BACKEND -->|"GET /metrics\nPrometheus exporter"| PROM
    REDIS_EXP -->|"Export métriques\nredis://"| REDIS
    REDIS_EXP -->|"Scrape /metrics"| PROM
    PG_EXP -->|"Connexion PG\nDSN postgresql://"| PG
    PG_EXP -->|"Scrape /metrics"| PROM
    PROM -->|"Datasource PromQL"| GRAFANA
```

---

## Description des composants

| Composant | Image Docker | Port | Rôle | Dépend de |
|-----------|-------------|------|------|-----------|
| **Nginx** | `nginx:1.25-alpine` | 80 | Reverse proxy, point d'entrée unique | backend |
| **FastAPI Backend** | Build local (Dockerfile) | 8000 | API REST, logique métier, NLP | postgres (healthy), redis (healthy) |
| **Celery Worker** | Build local | — | Tâches asynchrones NLP (4 workers) | backend, redis |
| **Flower** | Build local | 5555 | Monitoring visuel des tâches Celery | redis, celery_worker |
| **PostgreSQL 16 + pgvector** | `pgvector/pgvector:pg16` | 5432 | Base de données principale + vecteurs | — |
| **Redis 7.2** | `redis:7.2-alpine` | 6379 | Broker Celery + backend résultats | — |
| **n8n** | `n8nio/n8n:latest` | 5678 | Orchestrateur de workflows RH | postgres (healthy), redis (healthy) |
| **Prometheus** | `prom/prometheus:v2.52.0` | 9090 | Collecte métriques (scraping) | — |
| **Grafana** | `grafana/grafana:10.4.0` | 3001 | Visualisation métriques | prometheus |
| **redis-exporter** | `oliver006/redis_exporter:v1.61.0` | — | Export métriques Redis → Prometheus | redis |
| **postgres-exporter** | `prometheuscommunity/postgres-exporter:v0.15.0` | — | Export métriques PG → Prometheus | postgres |

---

## Flux de données principaux

1. **Requête utilisateur** : Client → Nginx :80 → FastAPI :8000 (via proxy `/api/*`)
2. **Frontend React** : Nginx :80 proxifie `/` vers `host.docker.internal:3000` (serveur npm sur l'hôte)
3. **Lecture/écriture base** : FastAPI → PostgreSQL via SQLAlchemy AsyncSession
4. **Publication tâche Celery** : FastAPI → Redis (LPUSH sur queue `celery`) → Celery Worker (BRPOP)
5. **Résultat tâche** : Celery Worker → Redis (SETEX résultat) → FastAPI (si polling)
6. **Traitement NLP** : Celery Worker → lit PDF dans uploads_data → OCR/parse → encode → PostgreSQL
7. **Métriques** : Prometheus scrape FastAPI `/metrics` + redis-exporter + postgres-exporter → Grafana
8. **Webhooks n8n** : n8n → POST `/api/n8n/*` (header `X-N8N-Secret`) → FastAPI
9. **Emails** : FastAPI (mailer.py) → SMTP externe Gmail :587 (sortant, hors réseau Docker)
