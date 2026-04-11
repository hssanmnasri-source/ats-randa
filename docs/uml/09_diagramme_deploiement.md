# Diagramme de Déploiement — Infrastructure ATS RANDA

## Description de l'environnement

ATS RANDA fonctionne dans un environnement de développement local où les services backend sont containerisés via Docker Compose, tandis que le frontend React tourne nativement sur la machine hôte (serveur npm). Cette architecture hybride est reflétée dans la configuration Nginx (`host.docker.internal:3000`). L'application mobile Flutter peut être lancée sur la même machine hôte (web/Chrome), sur un émulateur Android, ou sur un appareil physique.

---

## Diagramme de déploiement

```mermaid
flowchart TD
    subgraph HOST["Machine Hôte (Windows 11 / Linux)"]
        subgraph NPM["Serveur de dev frontend (hors Docker)"]
            REACT["React 18 SPA\nnpm run dev\nVite :3000\nTypeScript + Ant Design 5\n+ TanStack Query + Zustand"]
        end

        subgraph FLUTTER_HOST["App Flutter (hors Docker)"]
            FLUTTER["Flutter Web\nflutter run -d chrome\nPort aléatoire\nRiverpod + GoRouter + Dio"]
        end

        subgraph DOCKER_ENGINE["Docker Engine"]
            subgraph NET["Réseau bridge: ats_network"]

                subgraph ENTRY["Couche Entrée"]
                    NGINX_C["Container: ats_nginx\nImage: nginx:1.25-alpine\nPort exposé: 80:80\nConfig: ./nginx/nginx.conf"]
                end

                subgraph BACKEND_C["Couche Application"]
                    BACK_C["Container: ats_backend\nBuild: ./backend/Dockerfile\nPort exposé: 8000:8000\nEnv: .env\nVol: ./backend:/app\nVol: uploads_data:/app/uploads\nDepends: postgres(healthy) redis(healthy)"]

                    CEL_C["Container: ats_celery\nBuild: ./backend/Dockerfile\nCmd: celery worker --concurrency=4\nEnv: .env\nVol: uploads_data:/app/uploads\nDepends: backend, redis"]

                    FLOWER_C["Container: ats_flower\nBuild: ./backend/Dockerfile\nCmd: celery flower --port=5555\nPort exposé: 5555:5555\nDepends: redis, celery_worker"]
                end

                subgraph DATA_C["Couche Données"]
                    PG_C["Container: ats_postgres\nImage: pgvector/pgvector:pg16\nPort exposé: 5432:5432\nEnv: POSTGRES_USER/PASSWORD/DB\nVol: postgres_data:/var/lib/postgresql/data\nInit: ./scripts/init.sql\nHealthcheck: pg_isready"]

                    RDS_C["Container: ats_redis\nImage: redis:7.2-alpine\nPort exposé: 6379:6379\nCmd: redis-server --requirepass\nVol: redis_data:/data\nHealthcheck: redis-cli ping"]
                end

                subgraph AUTO_C["Automatisation"]
                    N8N_C["Container: ats_n8n\nImage: n8nio/n8n:latest\nPort exposé: 5678:5678\nDB: PostgreSQL partagée\nVol: n8n_data:/home/node/.n8n\nDepends: postgres(healthy) redis(healthy)"]
                end

                subgraph MON_C["Monitoring"]
                    PROM_C["Container: ats_prometheus\nImage: prom/prometheus:v2.52.0\nPort exposé: 9090:9090\nConfig: ./monitoring/prometheus.yml\nRetention: 15j\nVol: prometheus_data:/prometheus"]

                    GRAF_C["Container: ats_grafana\nImage: grafana/grafana:10.4.0\nPort exposé: 3001:3000\nEnv: GF_SECURITY_*\nProvisionning: ./monitoring/grafana/provisioning\nVol: grafana_data:/var/lib/grafana\nDepends: prometheus"]

                    REDIS_EXP_C["Container: ats_redis_exporter\nImage: oliver006/redis_exporter:v1.61.0\nEnv: REDIS_ADDR, REDIS_PASSWORD\nDepends: redis"]

                    PG_EXP_C["Container: ats_postgres_exporter\nImage: prometheuscommunity/postgres-exporter:v0.15.0\nEnv: DATA_SOURCE_NAME=postgresql://...\nDepends: postgres"]
                end
            end
        end
    end

    subgraph EXTERNAL["Externes"]
        SMTP["Gmail SMTP\nsmtp.gmail.com:587\n(TLS STARTTLS)"]
        GOOGLE_AUTH["Google OAuth2\naccounts.google.com"]
        HF["HuggingFace Hub\nModèle NLP téléchargé\nau premier démarrage\n(paraphrase-multilingual-MiniLM-L12-v2)"]
    end

    %% Connexions
    REACT -->|"HTTP :80"| NGINX_C
    FLUTTER -->|"HTTP :80 ou :8000"| NGINX_C
    NGINX_C -->|"proxy /api/*\nproxy_pass :8000"| BACK_C
    NGINX_C -->|"proxy /\nhost.docker.internal:3000"| REACT

    BACK_C -->|"SQLAlchemy async\n:5432"| PG_C
    BACK_C -->|"Redis broker\n:6379"| RDS_C
    BACK_C -->|"Fichiers PDF\nmount"| BACK_C

    CEL_C -->|"Consomme tâches\n:6379"| RDS_C
    CEL_C -->|"UPDATE/INSERT\n:5432"| PG_C

    N8N_C -->|"Webhooks\nPOST /api/n8n/*"| BACK_C
    N8N_C -->|"Tables n8n_*\n:5432"| PG_C

    PROM_C -->|"Scrape :8000/metrics"| BACK_C
    REDIS_EXP_C -->|"Métriques Redis\n:6379"| RDS_C
    REDIS_EXP_C -->|"Export /metrics"| PROM_C
    PG_EXP_C -->|"Métriques PG\n:5432"| PG_C
    PG_EXP_C -->|"Export /metrics"| PROM_C
    PROM_C -->|"Datasource PromQL"| GRAF_C

    BACK_C -->|"send_entretien_invitation()\nSMTP :587"| SMTP
    BACK_C -->|"OAuth2 callback\ntoken exchange"| GOOGLE_AUTH
    CEL_C -->|"Download modèle\n(1er démarrage)"| HF
```

---

## Configuration réseau

| Service | Image Docker | Port interne | Port exposé hôte | Variables d'env clés |
|---------|-------------|:------------:|:----------------:|----------------------|
| `postgres` | `pgvector/pgvector:pg16` | 5432 | 5432 | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` |
| `redis` | `redis:7.2-alpine` | 6379 | 6379 | `REDIS_PASSWORD` |
| `backend` | Build local | 8000 | 8000 | Toutes variables `.env` |
| `celery_worker` | Build local | — | — | Toutes variables `.env` |
| `flower` | Build local | 5555 | 5555 | `FLOWER_USER`, `FLOWER_PASSWORD` |
| `nginx` | `nginx:1.25-alpine` | 80 | 80 | — |
| `prometheus` | `prom/prometheus:v2.52.0` | 9090 | 9090 | — |
| `grafana` | `grafana/grafana:10.4.0` | 3000 | 3001 | `GF_SECURITY_ADMIN_USER`, `GF_SECURITY_ADMIN_PASSWORD` |
| `redis-exporter` | `oliver006/redis_exporter:v1.61.0` | 9121 | — | `REDIS_ADDR`, `REDIS_PASSWORD` |
| `postgres-exporter` | `prometheuscommunity/postgres-exporter:v0.15.0` | 9187 | — | `DATA_SOURCE_NAME` |
| `n8n` | `n8nio/n8n:latest` | 5678 | 5678 | `DB_POSTGRESDB_*`, `N8N_ENCRYPTION_KEY` |

---

## Volumes et persistance

| Volume | Monté dans | Contenu | Persistant |
|--------|-----------|---------|:----------:|
| `postgres_data` | `ats_postgres:/var/lib/postgresql/data` | Toute la base de données (tables, index pgvector) | ✅ |
| `redis_data` | `ats_redis:/data` | Cache Redis (optionnel, AOF désactivé par défaut) | ✅ |
| `n8n_data` | `ats_n8n:/home/node/.n8n` | Workflows n8n, credentials, executions | ✅ |
| `uploads_data` | `ats_backend:/app/uploads` + `ats_celery:/app/uploads` | PDFs CVs, photos profil | ✅ |
| `prometheus_data` | `ats_prometheus:/prometheus` | Métriques historiques (15 jours) | ✅ |
| `grafana_data` | `ats_grafana:/var/lib/grafana` | Dashboards, datasources provisionnées | ✅ |

---

## Commandes de déploiement

```bash
# 1. Préparer l'environnement
cp .env.example .env
# Éditer .env : SECRET_KEY, POSTGRES_PASSWORD, REDIS_PASSWORD, GRAFANA_PASSWORD, FLOWER_PASSWORD

# 2. Démarrer tous les services Docker
make up
# Équivalent : docker compose up -d

# 3. Vérifier l'état des containers
make status
# Attendre que tous soient healthy (postgres + redis)

# 4. Lancer le frontend (sur la machine hôte)
cd frontend && npm install && npm run dev
# → http://localhost:3000 (proxifié par Nginx sur :80)

# 5. Lancer l'app Flutter (optionnel)
cd mobile
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter run -d chrome  # Web (utilise http://localhost:8000)

# 6. Importer workflows n8n
# → http://localhost:5678 → Settings → Import workflow
# → Sélectionner fichiers dans n8n/workflows/

# Commandes de maintenance
make logs-backend     # Suivre les logs FastAPI
make logs             # Tous les logs
make migrate          # Migrations Alembic dans le container
make backup           # Sauvegarde PostgreSQL → backups/
make clean            # DESTRUCTIF — supprime containers + volumes
```
