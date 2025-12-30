.PHONY: help up down restart status logs logs-backend logs-frontend logs-db reset clean install build test

# Default target
.DEFAULT_GOAL := help

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Project directories
BACKEND_DIR := backend
FRONTEND_DIR := frontend
INFRA_DIR := infra

help: ## Show this help message
	@echo "$(CYAN)Development Stack Management$(NC)"
	@echo ""
	@echo "$(GREEN)Available commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Prerequisites:$(NC)"
	@echo "  - Java 17 (JAVA_HOME must be set)"
	@echo "  - Maven 3.6+"
	@echo "  - Node.js 18+ and npm"
	@echo "  - Docker & Docker Compose"
	@echo ""

up: check-java ## Start the full development stack
	@echo "$(GREEN)Starting development stack...$(NC)"
	@echo "$(CYAN)1. Starting infrastructure...$(NC)"
	@cd $(INFRA_DIR) && docker-compose up -d
	@echo "$(CYAN)2. Building and starting backend...$(NC)"
	@cd $(BACKEND_DIR) && mvn clean install -DskipTests && mvn spring-boot:run &
	@echo "$(CYAN)3. Installing frontend dependencies and starting...$(NC)"
	@cd $(FRONTEND_DIR) && npm install && npm start &
	@echo "$(GREEN)✓ Stack started!$(NC)"
	@echo ""
	@echo "$(CYAN)Access:$(NC)"
	@echo "  Frontend:  http://localhost:4200"
	@echo "  Backend:   http://localhost:8080"
	@echo "  API Docs:  http://localhost:8080/swagger-ui.html"
	@echo "  Health:    http://localhost:8080/actuator/health"

down: ## Stop all services
	@echo "$(YELLOW)Stopping development stack...$(NC)"
	@-pkill -f "spring-boot:run" 2>/dev/null || true
	@-pkill -f "ng serve" 2>/dev/null || true
	@cd $(INFRA_DIR) && docker-compose down
	@echo "$(GREEN)✓ Stack stopped$(NC)"

restart: down up ## Restart all services

status: ## Check status of all services
	@echo "$(CYAN)Service Status:$(NC)"
	@echo ""
	@echo "$(CYAN)Infrastructure:$(NC)"
	@cd $(INFRA_DIR) && docker-compose ps
	@echo ""
	@echo "$(CYAN)Backend (Spring Boot):$(NC)"
	@-curl -s http://localhost:8080/actuator/health > /dev/null && echo "  $(GREEN)✓ Running$(NC)" || echo "  $(RED)✗ Not running$(NC)"
	@echo ""
	@echo "$(CYAN)Frontend (Angular):$(NC)"
	@-curl -s http://localhost:4200 > /dev/null && echo "  $(GREEN)✓ Running$(NC)" || echo "  $(RED)✗ Not running$(NC)"

logs: ## View logs from all services
	@cd $(INFRA_DIR) && docker-compose logs -f

logs-backend: ## View backend logs
	@cd $(BACKEND_DIR) && tail -f target/spring-boot.log 2>/dev/null || echo "$(YELLOW)Backend not running or log file not found$(NC)"

logs-frontend: ## View frontend logs
	@echo "$(YELLOW)Frontend logs are displayed in the terminal where 'npm start' is running$(NC)"

logs-db: ## View database logs
	@cd $(INFRA_DIR) && docker-compose logs -f postgres

reset: ## Reset database (delete all data)
	@echo "$(YELLOW)Resetting database...$(NC)"
	@cd $(INFRA_DIR) && docker-compose down
	@docker volume rm postgres_data 2>/dev/null || echo "$(YELLOW)Volume not found, continuing...$(NC)"
	@cd $(INFRA_DIR) && docker-compose up -d
	@echo "$(GREEN)✓ Database reset complete$(NC)"

clean: down ## Stop services and clean build artifacts
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	@cd $(BACKEND_DIR) && mvn clean
	@cd $(FRONTEND_DIR) && rm -rf node_modules dist .angular
	@cd $(INFRA_DIR) && docker-compose down -v
	@echo "$(GREEN)✓ Clean complete$(NC)"

install: check-java ## Install dependencies for backend and frontend
	@echo "$(CYAN)Installing dependencies...$(NC)"
	@echo "$(CYAN)1. Backend...$(NC)"
	@cd $(BACKEND_DIR) && mvn clean install -DskipTests
	@echo "$(CYAN)2. Frontend...$(NC)"
	@cd $(FRONTEND_DIR) && npm install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

build: check-java ## Build backend and frontend
	@echo "$(CYAN)Building...$(NC)"
	@echo "$(CYAN)1. Backend...$(NC)"
	@cd $(BACKEND_DIR) && mvn clean package
	@echo "$(CYAN)2. Frontend...$(NC)"
	@cd $(FRONTEND_DIR) && npm run build
	@echo "$(GREEN)✓ Build complete$(NC)"

test: ## Run all tests
	@echo "$(CYAN)Running tests...$(NC)"
	@echo "$(CYAN)1. Backend tests...$(NC)"
	@cd $(BACKEND_DIR) && mvn test
	@echo "$(CYAN)2. Frontend tests...$(NC)"
	@cd $(FRONTEND_DIR) && npm test -- --watch=false
	@echo "$(GREEN)✓ Tests complete$(NC)"

check-java: ## Check Java environment
	@if [ -z "$$JAVA_HOME" ]; then \
		echo "$(RED)ERROR: JAVA_HOME is not set$(NC)"; \
		echo "$(YELLOW)Set JAVA_HOME before running make commands:$(NC)"; \
		echo "  export JAVA_HOME=/path/to/jdk-17"; \
		exit 1; \
	fi
	@echo "$(GREEN)✓ JAVA_HOME is set to: $$JAVA_HOME$(NC)"
