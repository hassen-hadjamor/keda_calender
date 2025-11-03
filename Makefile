.PHONY: help build up down logs clean rebuild test dev prod

# Variables
COMPOSE_FILE = docker-compose.yml
COMPOSE_PROD_FILE = docker-compose.prod.yml

help: ## Show this help message
	@echo "KEDA Calendar Control Center - Docker Commands"
	@echo "=============================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build all Docker images
	docker-compose -f $(COMPOSE_FILE) build

build-prod: ## Build production Docker images
	docker-compose -f $(COMPOSE_PROD_FILE) build

up: ## Start all services in development mode
	docker-compose -f $(COMPOSE_FILE) up -d
	@echo "\n✅ Services started!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:8001"
	@echo "API Docs: http://localhost:8001/docs"

up-prod: ## Start all services in production mode
	docker-compose -f $(COMPOSE_PROD_FILE) up -d
	@echo "\n✅ Production services started!"

dev: ## Start services with logs attached (development)
	docker-compose -f $(COMPOSE_FILE) up

down: ## Stop all services
	docker-compose -f $(COMPOSE_FILE) down

down-prod: ## Stop production services
	docker-compose -f $(COMPOSE_PROD_FILE) down

down-clean: ## Stop and remove all containers, networks, and volumes
	docker-compose -f $(COMPOSE_FILE) down -v
	docker-compose -f $(COMPOSE_PROD_FILE) down -v

logs: ## View logs from all services
	docker-compose -f $(COMPOSE_FILE) logs -f

logs-backend: ## View backend logs
	docker-compose -f $(COMPOSE_FILE) logs -f backend

logs-frontend: ## View frontend logs
	docker-compose -f $(COMPOSE_FILE) logs -f frontend

logs-db: ## View database logs
	docker-compose -f $(COMPOSE_FILE) logs -f mongodb

ps: ## List running containers
	docker-compose -f $(COMPOSE_FILE) ps

restart: ## Restart all services
	docker-compose -f $(COMPOSE_FILE) restart

restart-backend: ## Restart backend only
	docker-compose -f $(COMPOSE_FILE) restart backend

restart-frontend: ## Restart frontend only
	docker-compose -f $(COMPOSE_FILE) restart frontend

rebuild: ## Rebuild and restart all services
	docker-compose -f $(COMPOSE_FILE) down
	docker-compose -f $(COMPOSE_FILE) build --no-cache
	docker-compose -f $(COMPOSE_FILE) up -d

clean: ## Remove all containers, images, and volumes
	docker-compose -f $(COMPOSE_FILE) down -v --rmi all
	docker-compose -f $(COMPOSE_PROD_FILE) down -v --rmi all

shell-backend: ## Open shell in backend container
	docker-compose -f $(COMPOSE_FILE) exec backend /bin/bash

shell-frontend: ## Open shell in frontend container
	docker-compose -f $(COMPOSE_FILE) exec frontend /bin/sh

shell-db: ## Open MongoDB shell
	docker-compose -f $(COMPOSE_FILE) exec mongodb mongosh

backup-db: ## Backup MongoDB database
	docker-compose -f $(COMPOSE_FILE) exec mongodb mongodump --out=/data/backup
	docker cp keda-mongodb:/data/backup ./backup
	@echo "Database backed up to ./backup"

restore-db: ## Restore MongoDB database from backup
	docker cp ./backup keda-mongodb:/data/backup
	docker-compose -f $(COMPOSE_FILE) exec mongodb mongorestore /data/backup

health: ## Check health of all services
	@echo "=== Service Health Status ==="
	@docker-compose -f $(COMPOSE_FILE) ps

test-backend: ## Run backend tests
	docker-compose -f $(COMPOSE_FILE) exec backend pytest

test-frontend: ## Run frontend tests
	docker-compose -f $(COMPOSE_FILE) exec frontend yarn test

# Image management
push: ## Push images to registry (set REGISTRY variable)
	docker tag keda-backend:latest $(REGISTRY)/keda-backend:latest
	docker tag keda-frontend:latest $(REGISTRY)/keda-frontend:latest
	docker push $(REGISTRY)/keda-backend:latest
	docker push $(REGISTRY)/keda-frontend:latest

pull: ## Pull images from registry (set REGISTRY variable)
	docker pull $(REGISTRY)/keda-backend:latest
	docker pull $(REGISTRY)/keda-frontend:latest

# Quick commands
start: up ## Alias for 'up'
stop: down ## Alias for 'down'

.DEFAULT_GOAL := help
