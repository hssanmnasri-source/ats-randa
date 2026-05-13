# Déploiement — ATS RANDA

## Stack de production

| Service | Image | Port exposé |
|---------|-------|-------------|
| nginx | nginx:1.25-alpine | 80 |
| backend | ats-randa-backend (Dockerfile.prod) | 8000 (interne) |
| celery_worker | ats-randa-celery_worker | — |
| flower | ats-randa-flower | 5555 |
| postgres | pgvector/pgvector:pg16 | 5432 (interne) |
| redis | redis:7.2-alpine | 6379 (interne) |
| n8n | n8nio/n8n | 5678 |
| grafana | grafana/grafana:10.4.0 | 3001 |
| prometheus | prom/prometheus:v2.52.0 | 9090 (interne) |

Nginx sert le frontend React en statique depuis `frontend/dist/` et proxy `/api/*` et `/uploads/*` vers le backend.

---

## Points critiques avant de déployer

### 1. Mémoire backend (⚠️ important)

Le backend charge le modèle NLP PyTorch (`paraphrase-multilingual-MiniLM-L12-v2`) au démarrage, ce qui nécessite **~1.2–1.5 GB de RAM**.

- `Dockerfile.prod` est configuré avec `--workers 1` — ne pas augmenter sans vérifier la RAM disponible (chaque worker charge sa propre copie du modèle)
- `docker-compose.prod.yml` n'impose **aucune limite mémoire** sur le service `backend` — ne pas en ajouter
- Le healthcheck prend **60–90 secondes** le temps que le modèle se charge — c'est normal

### 2. URLs relatives dans le frontend

Toutes les requêtes API du frontend utilisent des **URLs relatives** (ex. `/api/visitor/offers`) — elles passent par Nginx qui les proxy vers le backend. Ne jamais hardcoder `http://localhost:8000` dans le code frontend.

Fichiers concernés : `frontend/src/services/api.ts`, `LoginPage.tsx`, `MatchingPage.tsx`, `ResultsPage.tsx`.

### 3. Build context Docker

Un `.dockerignore` est présent dans `backend/` pour exclure les fichiers lourds (cache modèle ML ~2GB). Sans ce fichier, chaque rebuild transfère 2+ GB inutilement.

---

## Déploiement local (production)

### 1. Build du frontend

```bash
cd frontend
npm install
npm run build
# Génère frontend/dist/
```

### 2. Lancer le stack Docker prod

```bash
# Depuis la racine du projet
docker compose -f docker-compose.prod.yml up -d
```

Vérifier que tous les conteneurs sont `Up` :

```bash
docker compose -f docker-compose.prod.yml ps
```

L'application est accessible sur **http://localhost**. Le backend met **60–90 secondes** à passer `healthy` (chargement du modèle NLP).

### 3. Redémarrage propre (si conflits réseau)

```bash
docker compose -f docker-compose.prod.yml down
docker network prune -f
docker compose -f docker-compose.prod.yml up -d
```

---

## Exposition publique via localhost.run (solution active)

> ⚠️ L'URL change à chaque redémarrage du tunnel. Suivre la procédure complète ci-dessous à chaque fois.

### Étape 1 — Démarrer le tunnel et noter l'URL

```bash
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R 80:localhost:3000 nokey@localhost.run
```

La sortie affiche votre URL dans la ligne :
```
tunneled with tls termination, https://XXXXXXXXXXXXXXXX.lhr.life
```

**Copier cette URL** (ex: `https://4d5a8690870f39.lhr.life`) — c'est votre `NOUVELLE_URL`.

### Étape 2 — Mettre à jour `.env`

Ouvrir `.env` à la racine et remplacer les 3 valeurs suivantes :

```env
CORS_ORIGINS=["http://localhost:3000","http://localhost","https://NOUVELLE_URL.lhr.life"]
FRONTEND_URL=https://NOUVELLE_URL.lhr.life
GOOGLE_REDIRECT_URI=https://NOUVELLE_URL.lhr.life/api/auth/google/callback
```

### Étape 3 — Recréer le conteneur backend

`docker restart` ne recharge PAS le `.env` — il faut impérativement recréer :

```bash
docker compose stop backend && docker compose up -d backend
```

### Étape 4 — Mettre à jour Google Cloud Console

[console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → ATS RANDA Web :

| Champ | Valeur |
|-------|--------|
| Authorized JavaScript origins | `https://NOUVELLE_URL.lhr.life` |
| Authorized redirect URIs | `https://NOUVELLE_URL.lhr.life/api/auth/google/callback` |

Sauvegarder et attendre ~30 secondes.

### Ce qui ne change PAS (déjà configuré une fois pour toutes)

- `vite.config.ts` → `allowedHosts: ['.lhr.life']` ✅
- `backend/app/main.py` → CORS regex `*.lhr.life` ✅
- Google OAuth Client ID et Secret : voir `.env` (ne jamais commiter ces valeurs)

---

## Exposition publique via Cloudflare Tunnel (URL aléatoire)

Cloudflare Tunnel crée une URL HTTPS publique sans ouvrir de port ni payer un hébergeur.

### Prérequis

Installer `cloudflared` (une seule fois) :

```powershell
winget install --id Cloudflare.cloudflared
```

### Lancer le tunnel

```powershell
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
cloudflared tunnel --url http://localhost:80
```

La sortie affiche l'URL publique :

```
+------------------------------------------------------------------------+
|  https://xxxx-xxxx-xxxx.trycloudflare.com                              |
+------------------------------------------------------------------------+
```

> Chaque démarrage génère une **nouvelle URL aléatoire**. Le tunnel reste actif tant que le processus tourne.

---

## Variables d'environnement

Toutes les variables sont dans `.env` à la racine. Les principales pour la prod :

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Clé JWT — changer en production |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL |
| `REDIS_PASSWORD` | Mot de passe Redis |
| `MAIL_ENABLED` | `true` pour envoyer de vrais emails |
| `MAIL_USERNAME` | Compte Gmail expéditeur |
| `MAIL_PASSWORD` | App Password Gmail (16 caractères) |
| `GOOGLE_CLIENT_ID` | OAuth2 Google |
| `GOOGLE_CLIENT_SECRET` | OAuth2 Google |
| `GRAFANA_PASSWORD` | Dashboard monitoring |

---

## Email (Gmail SMTP)

Le compte `atsranda@gmail.com` est configuré avec un **App Password** (2FA activée sur le compte).

Configuration dans `.env` :
```env
MAIL_ENABLED=true
MAIL_USERNAME=atsranda@gmail.com
MAIL_PASSWORD=<app-password-16-chars>
MAIL_FROM=atsranda@gmail.com
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com
```

Pour créer un nouvel App Password : Google Account → Sécurité → Mots de passe des applications.

---

## Migrations de base de données

Les migrations Alembic s'exécutent dans le conteneur backend :

```bash
make migrate
# ou
docker exec ats_backend alembic upgrade head
```

Pour les colonnes nullable ajoutées directement via psql :

```bash
make db-shell
# puis SQL directement
```

---

## URLs utiles (local)

| Service | URL |
|---------|-----|
| Application | http://localhost |
| API Swagger | http://localhost:8000/docs |
| n8n | http://localhost:5678 |
| Grafana | http://localhost:3001 |
| Flower (Celery) | http://localhost:5555 |
| Prometheus | http://localhost:9090 |

---

## Rebuild après modification du code

**Frontend uniquement** (pas de rebuild Docker) :
```bash
cd frontend && npm run build
docker compose -f docker-compose.prod.yml restart nginx
```

**Backend** (rebuild image) :
```bash
# Supprimer le conteneur et l'image pour forcer un rebuild complet
docker stop ats_backend && docker rm ats_backend
docker rmi ats-randa-backend --force
docker compose -f docker-compose.prod.yml up -d backend
```

> Ne pas utiliser `--force-recreate` seul si le conteneur a une ancienne limite mémoire — il faut impérativement `docker rm` puis recréer.

---

## Pourquoi pas Render / cloud gratuit ?

Le modèle NLP PyTorch nécessite ~1.2 GB de RAM minimum :

| Hébergeur | RAM gratuite | Compatible ? |
|-----------|-------------|--------------|
| Render free | 512 MB | ❌ OOM immédiat |
| Render Starter ($7/mo) | 512 MB | ❌ OOM immédiat |
| Render Standard ($25/mo) | 2 GB | ✅ |
| Oracle Cloud Free | 24 GB (Ampere) | ✅ mais carte requise |
| Cloudflare Tunnel (local) | illimitée | ✅ **solution retenue** |
