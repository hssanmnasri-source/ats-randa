# Guide d'Installation et Déploiement

## 7.1 Prérequis

### Logiciels requis

| Logiciel | Version minimale | Usage |
|----------|-----------------|-------|
| Docker Desktop | 24.x | Tous les services backend |
| Node.js | 18.x LTS | Serveur de développement frontend |
| npm | 9.x | Gestionnaire de paquets frontend |
| Flutter SDK | 3.x | Application mobile |
| Dart | 3.x (inclus avec Flutter) | Langage Flutter |
| Git | 2.x | Clonage et gestion du code source |

### Ressources matérielles recommandées

| Ressource | Minimum | Recommandé |
|-----------|---------|------------|
| RAM | 8 Go | 16 Go |
| Espace disque | 20 Go | 40 Go |
| CPU | 4 cœurs | 8 cœurs |

> Le modèle NLP (`paraphrase-multilingual-MiniLM-L12-v2`) est chargé en mémoire dans le container backend (~500 Mo RAM). Sur un système avec moins de 8 Go, le container peut se faire tuer par l'OOM killer.

### Variables d'environnement

Copier `.env.example` vers `.env` à la racine du projet et renseigner les valeurs suivantes (marquées `CHANGE_ME`) :

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `SECRET_KEY` | Clé secrète JWT (min 32 caractères) | `CHANGE_ME` |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL | `CHANGE_ME` |
| `REDIS_PASSWORD` | Mot de passe Redis | `CHANGE_ME` |
| `GRAFANA_PASSWORD` | Mot de passe Grafana | `CHANGE_ME` |
| `FLOWER_PASSWORD` | Mot de passe Flower | `CHANGE_ME` |
| `MAIL_USERNAME` | Adresse Gmail pour les emails | Optionnel |
| `MAIL_PASSWORD` | Mot de passe d'application Gmail | Optionnel |
| `N8N_ENCRYPTION_KEY` | Clé de chiffrement n8n | `CHANGE_ME` |
| `N8N_SECRET` | Secret pour les webhooks n8n | `CHANGE_ME` |

---

## 7.2 Installation complète pas à pas

### Étape 1 — Cloner le projet

```bash
git clone <url-du-dépôt> ats-randa
cd ats-randa
```

### Étape 2 — Configurer les variables d'environnement

```bash
cp .env.example .env
# Éditer .env et remplacer tous les CHANGE_ME par des valeurs sécurisées
```

Générer une clé secrète JWT robuste :
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### Étape 3 — Démarrer les services Docker

```bash
make up
# Equivalent : docker compose up -d
```

Cette commande démarre les 10 services (postgres, redis, backend, celery_worker, flower, nginx, prometheus, grafana, redis-exporter, n8n).

Vérifier que tous les services sont opérationnels :
```bash
make status
# Equivalent : docker compose ps
```

Attendre que le backend soit prêt (le modèle NLP se charge au démarrage, ~10–30 s selon le matériel) :
```bash
make logs-backend
# Attendre la ligne : "Application startup complete."
```

### Étape 4 — Lancer le serveur de développement frontend

```bash
cd frontend
npm install
npm run dev
```

Le frontend est accessible sur http://localhost:3000. Nginx sur le port 80 le proxifie automatiquement.

### Étape 5 — Lancer l'application mobile Flutter (optionnel)

```bash
cd mobile
flutter pub get

# Générer les fichiers Freezed/JSON
dart run build_runner build --delete-conflicting-outputs

# Lancer sur navigateur (développement)
flutter run -d chrome

# Lancer sur émulateur Android
flutter run -d emulator-5554 --dart-define=API_URL=http://10.0.2.2:8000
```

---

## 7.3 Commandes du Makefile

| Commande | Description |
|----------|-------------|
| `make up` | Démarrer tous les services Docker en arrière-plan |
| `make down` | Arrêter tous les services |
| `make restart` | Arrêter puis redémarrer |
| `make build` | Reconstruire les images et démarrer |
| `make logs` | Afficher les logs de tous les services (streaming) |
| `make logs-backend` | Logs du container backend uniquement |
| `make logs-db` | Logs PostgreSQL uniquement |
| `make shell` | Ouvrir un shell bash dans `ats_backend` |
| `make migrate` | Exécuter les migrations Alembic dans le container |
| `make migrate-create name="nom"` | Générer une nouvelle révision Alembic |
| `make db-shell` | Ouvrir le CLI PostgreSQL (`psql`) |
| `make clean` | **Destructif** — Supprimer containers + volumes (reset complet) |
| `make status` | Afficher l'état de tous les containers |
| `make test` | Exécuter pytest avec rapport de couverture |
| `make test-unit` | Tests unitaires uniquement |
| `make test-integration` | Tests d'intégration uniquement |
| `make lint` | Vérifications flake8 + black |
| `make format` | Reformatage automatique avec black |
| `make security-scan` | Analyse de sécurité : bandit + safety |
| `make info` | Afficher le nombre de lignes par table + état des containers |
| `make monitoring` | Afficher les URLs Grafana / Prometheus / Flower |
| `make backup` | Sauvegarder PostgreSQL dans `backups/` |
| `make restore FILE=backups/...` | Restaurer une sauvegarde |

---

## 7.4 URLs des services

| Service | URL | Identifiants |
|---------|-----|--------------|
| Application web | http://localhost | — |
| API FastAPI | http://localhost:8000 | — |
| Swagger UI | http://localhost:8000/docs | — |
| ReDoc | http://localhost:8000/redoc | — |
| Grafana | http://localhost:3001 | admin / `GRAFANA_PASSWORD` |
| Prometheus | http://localhost:9090 | — |
| Flower (Celery) | http://localhost:5555 | admin / `FLOWER_PASSWORD` |
| n8n | http://localhost:5678 | admin / (configuré au premier lancement) |

---

## 7.5 Premiers pas après installation

### Créer le premier compte administrateur

Se connecter à l'API via Swagger UI (http://localhost:8000/docs) ou via un client HTTP :

```bash
# 1. S'enregistrer (crée un compte CANDIDATE par défaut)
curl -X POST http://localhost:8000/api/visitor/register \
  -H "Content-Type: application/json" \
  -d '{"nom":"Admin","prenom":"RANDA","email":"admin@randa.tn","password":"MotDePasse123!"}'

# 2. Promouvoir en ADMIN via psql
make db-shell
UPDATE users SET role='ADMIN' WHERE email='admin@randa.tn';
\q
```

### Créer des comptes RH et Agent

Depuis le portail Admin (`/admin/users`), créer des utilisateurs avec les rôles `RH` et `AGENT`.

### Importer des CVs de test

```bash
# Import en masse de CVs Keejob depuis un dossier
docker exec ats_backend python -m app.nlp.keejob_importer /app/uploads/keejob --all-files

# Backfill d'embeddings pour tous les CVs sans vecteur
docker exec ats_backend python -m app.nlp.embed_existing_cvs --batch-size 128
```

### Créer une offre et lancer le matching

1. Se connecter avec un compte RH sur http://localhost
2. Naviguer vers `/rh/offers` → "Nouvelle offre"
3. Remplir le formulaire : titre, description, compétences requises, expérience
4. Publier l'offre (transition `BROUILLON → ACTIVE`)
5. Naviguer vers `/rh/offers/{id}/matching` → "Lancer le matching"
6. Les résultats apparaissent classés par `score_final`

### Importer les workflows n8n

1. Ouvrir n8n sur http://localhost:5678
2. Naviguer vers Settings → Import workflow
3. Importer les fichiers JSON depuis `n8n/workflows/`
4. Configurer les variables d'environnement n8n (URL backend, secret)
5. Activer les workflows

---

## 7.6 Résolution des problèmes courants

### Le frontend ne se charge pas

Vérifier que `npm run dev` est en cours d'exécution sur la machine hôte (port 3000). Nginx proxifie `/` vers `host.docker.internal:3000` — sans ce serveur actif, le frontend retourne une erreur 502.

### Le modèle NLP est lent au premier démarrage

Normal : le chargement de `paraphrase-multilingual-MiniLM-L12-v2` prend 5–30 secondes selon le matériel. Suivre les logs : `make logs-backend`. Le message `Application startup complete.` indique que le modèle est prêt.

### Les tâches Celery ne s'exécutent pas

Vérifier le container `celery_worker` : `docker compose ps celery_worker`. Consulter les logs : `docker compose logs celery_worker`. Accéder à Flower (http://localhost:5555) pour voir l'état des workers et des tâches.

### Erreur de connexion PostgreSQL

Vérifier que `POSTGRES_PASSWORD` dans `.env` correspond au mot de passe utilisé lors de l'initialisation du volume. Si le volume a été créé avec un ancien mot de passe : `make clean` (destructif) puis `make up`.
