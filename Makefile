# SENDA — Makefile de operaciones
# Uso: make <target>
# Requiere: Docker Engine + Compose v2, red stamp-net

REPO_DIR := $(shell pwd)
SUPABASE_ENV := $(REPO_DIR)/supabase/.env
DEPLOY_ENV   := $(REPO_DIR)/deploy/.env
INFRA_ENV    := $(REPO_DIR)/infra/.env

.PHONY: help up-all down-all restart-all status logs \
        up-infra down-infra up-supabase down-supabase up-app down-app \
        logs-backend logs-frontend logs-db logs-kong logs-auth \
        db-backup db-restore build-app ps

help:
	@echo ""
	@echo "SENDA — Comandos disponibles:"
	@echo ""
	@echo "  Stacks completos:"
	@echo "    make up-all          Levantar toda la plataforma (infra + supabase + app)"
	@echo "    make down-all        Bajar toda la plataforma"
	@echo "    make restart-all     Reiniciar toda la plataforma"
	@echo "    make status          Estado de todos los contenedores SENDA"
	@echo ""
	@echo "  Stacks individuales:"
	@echo "    make up-infra        Levantar nginx + cloudflared"
	@echo "    make up-supabase     Levantar stack de Supabase"
	@echo "    make up-app          Construir y levantar backend + frontend"
	@echo "    make down-infra      Bajar infra"
	@echo "    make down-supabase   Bajar Supabase"
	@echo "    make down-app        Bajar app"
	@echo ""
	@echo "  Logs:"
	@echo "    make logs            Logs de todos los contenedores senda-*"
	@echo "    make logs-backend    Logs del backend"
	@echo "    make logs-frontend   Logs del frontend"
	@echo "    make logs-db         Logs de la base de datos"
	@echo "    make logs-kong       Logs del API gateway (Kong)"
	@echo "    make logs-auth       Logs del servicio de autenticación"
	@echo ""
	@echo "  Base de datos:"
	@echo "    make db-backup       Exportar dump de la base de datos"
	@echo "    make db-restore F=archivo.sql  Restaurar desde dump"
	@echo ""
	@echo "  App:"
	@echo "    make build-app       Reconstruir imágenes del backend y frontend"
	@echo ""

# ── Stacks ──────────────────────────────────────────────────

up-infra:
	docker compose -f infra/docker-compose.yml --project-directory . -p infra --env-file $(INFRA_ENV) up -d

down-infra:
	docker compose -f infra/docker-compose.yml --project-directory . -p infra down

up-supabase:
	docker compose -f supabase/docker-compose.yml --project-directory . -p supabase --env-file $(SUPABASE_ENV) up -d

down-supabase:
	docker compose -f supabase/docker-compose.yml --project-directory . -p supabase down

up-app:
	docker compose -f deploy/docker-compose.yml --project-directory . -p senda --env-file $(DEPLOY_ENV) up -d --build

down-app:
	docker compose -f deploy/docker-compose.yml --project-directory . -p senda down

build-app:
	docker compose -f deploy/docker-compose.yml --project-directory . -p senda --env-file $(DEPLOY_ENV) build

up-all: up-infra up-supabase up-app

down-all: down-app down-supabase down-infra

restart-all: down-all up-all

# ── Estado ──────────────────────────────────────────────────

status:
	@echo ""
	@echo "=== Contenedores SENDA ==="
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" | grep -E "NAME|senda|nginx-proxy|cloudflared" || true
	@echo ""

ps: status

# ── Logs ────────────────────────────────────────────────────

logs:
	docker compose -f supabase/docker-compose.yml --project-directory . -p supabase logs -f --tail=50 &
	docker compose -f deploy/docker-compose.yml --project-directory . -p senda logs -f --tail=50

logs-backend:
	docker logs -f senda-backend --tail=100

logs-frontend:
	docker logs -f senda-frontend --tail=100

logs-db:
	docker logs -f senda-db --tail=100

logs-kong:
	docker logs -f senda-kong --tail=100

logs-auth:
	docker logs -f senda-auth --tail=100

# ── Base de datos ────────────────────────────────────────────

BACKUP_DIR := ./backups
BACKUP_FILE := $(BACKUP_DIR)/senda-db-$(shell date +%Y%m%d-%H%M%S).sql

db-backup:
	@mkdir -p $(BACKUP_DIR)
	docker exec senda-db pg_dump -U postgres postgres > $(BACKUP_FILE)
	@echo "Backup guardado en: $(BACKUP_FILE)"

db-restore:
	@test -n "$(F)" || (echo "Error: especifica el archivo con F=ruta/archivo.sql" && exit 1)
	docker exec -i senda-db psql -U postgres postgres < $(F)
	@echo "Base de datos restaurada desde: $(F)"
