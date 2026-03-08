# ══════════════════════════════════════════
#  ATS RANDA — Makefile
#  Usage : make <commande>
# ══════════════════════════════════════════

.PHONY: up down restart logs build test migrate shell clean help

# ── Docker ────────────────────────────────
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

# ── Utils ─────────────────────────────────
shell:
	docker exec -it ats_backend bash

clean:
	docker compose down -v
	docker system prune -f

status:
	docker compose ps

# ── Aide ──────────────────────────────────
help:
	@echo ""
	@echo "  ATS RANDA — Commandes disponibles"
	@echo "  ─────────────────────────────────"
	@echo "  make up              Démarrer tous les services"
	@echo "  make down            Arrêter tous les services"
	@echo "  make build           Rebuild et démarrer"
	@echo "  make logs            Logs en temps réel"
	@echo "  make test            Lancer tous les tests"
	@echo "  make lint            Vérifier le code"
	@echo "  make migrate         Appliquer les migrations"
	@echo "  make db-shell        Accès PostgreSQL"
	@echo "  make clean           Tout supprimer (containers + volumes)"
	@echo ""