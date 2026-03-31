# ══════════════════════════════════════════
#  ATS RANDA — Makefile
#  Usage : make <commande>
# ══════════════════════════════════════════

.PHONY: up down restart logs build test migrate shell clean help \
        prod-up prod-down prod-build prod-logs \
        backup restore metrics monitoring info security-scan

# ── Docker (développement) ────────────────
up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose down && docker compose up -d

build:
	docker compose up -d --build

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-db:
	docker compose logs -f postgres

# ── Base de données ───────────────────────
migrate:
	docker exec ats_backend alembic upgrade head

migrate-create:
	docker exec ats_backend alembic revision --autogenerate -m "$(name)"

db-shell:
	docker exec -it ats_postgres psql -U ats_user -d ats_db

# ── Tests ─────────────────────────────────
test:
	docker exec ats_backend pytest tests/ -v --cov=app

test-unit:
	docker exec ats_backend pytest tests/unit/ -v

test-integration:
	docker exec ats_backend pytest tests/integration/ -v

# ── Qualité du code ───────────────────────
lint:
	docker exec ats_backend flake8 app/
	docker exec ats_backend black app/ --check

format:
	docker exec ats_backend black app/

security-scan:
	docker exec ats_backend pip install bandit safety --quiet
	docker exec ats_backend bandit -r app/ -ll 2>/dev/null || true
	docker exec ats_backend safety check -r requirements.txt 2>/dev/null || true

# ── Utils ─────────────────────────────────
shell:
	docker exec -it ats_backend bash

clean:
	docker compose down -v
	docker system prune -f

status:
	docker compose ps

# ── Production ────────────────────────────
prod-up:
	docker compose -f docker-compose.prod.yml up -d

prod-down:
	docker compose -f docker-compose.prod.yml down

prod-logs:
	docker compose -f docker-compose.prod.yml logs -f

prod-build:
	cd frontend && npm run build
	docker compose -f docker-compose.prod.yml build
	docker compose -f docker-compose.prod.yml up -d

# ── Backup & Restore ──────────────────────
backup:
	bash scripts/backup.sh

restore:
	@echo "Usage: make restore FILE=backups/ats_randa_YYYYMMDD_HHMMSS.sql.gz"
	@test -n "$(FILE)" || (echo "❌ FILE non défini"; exit 1)
	gunzip -c $(FILE) | docker exec -i ats_postgres psql -U ats_user -d ats_db
	@echo "✅ Restauration terminée"

# ── Monitoring ────────────────────────────
metrics:
	curl -s http://localhost:8000/metrics | head -50

monitoring:
	@echo "Grafana   : http://localhost:3001  (admin/admin123)"
	@echo "Prometheus: http://localhost:9090"
	@echo "Flower    : http://localhost:5555"

# ── Informations système ──────────────────
info:
	@echo "════════════════════════════════════════"
	@echo "  ATS RANDA — État du système"
	@echo "════════════════════════════════════════"
	@docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
	@echo ""
	@echo "Lignes par table :"
	@docker exec ats_postgres psql -U ats_user -d ats_db -c \
		"SELECT relname AS \"Table\", n_live_tup AS \"Lignes\" \
		 FROM pg_stat_user_tables ORDER BY n_live_tup DESC;" 2>/dev/null || true
	@echo ""
	@echo "Taille DB :"
	@docker exec ats_postgres psql -U ats_user -d ats_db -c \
		"SELECT pg_size_pretty(pg_database_size('ats_db')) AS \"Taille\";" 2>/dev/null || true

# ── Aide ──────────────────────────────────
help:
	@echo ""
	@echo "  ATS RANDA — Commandes disponibles"
	@echo "  ═══════════════════════════════════════════════"
	@echo "  Développement"
	@echo "    make up              Démarrer tous les services"
	@echo "    make down            Arrêter les services"
	@echo "    make build           Rebuild + démarrer"
	@echo "    make logs            Logs en temps réel"
	@echo "    make shell           Bash dans le backend"
	@echo "    make db-shell        psql interactif"
	@echo "    make status          État des containers"
	@echo "    make clean           Supprimer containers + volumes"
	@echo ""
	@echo "  Tests & Qualité"
	@echo "    make test            pytest + coverage"
	@echo "    make test-unit       Tests unitaires"
	@echo "    make lint            flake8 + black"
	@echo "    make format          Auto-format"
	@echo "    make security-scan   Bandit + Safety"
	@echo ""
	@echo "  Production"
	@echo "    make prod-up         Démarrer en prod"
	@echo "    make prod-build      Build frontend + prod"
	@echo "    make prod-logs       Logs prod"
	@echo ""
	@echo "  Backup"
	@echo "    make backup          Sauvegarder PostgreSQL"
	@echo "    make restore FILE=x  Restaurer un backup"
	@echo ""
	@echo "  Monitoring"
	@echo "    make monitoring      URLs des dashboards"
	@echo "    make metrics         Métriques Prometheus"
	@echo "    make info            Statistiques système"
	@echo ""
