<#
.SYNOPSIS
    Atlas Immobilier 2026 - Unified Developer Onboarding Script (dev-setup.ps1)
.DESCRIPTION
    This script automates the entire local setup for new developers.
    It provisions the infrastructure (Postgres, Keycloak, AI Services), compiles the backend, and starts the frontend.
#>

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 ATLAS 2026 - ONBOARDING MAGIQUE EN 5 MINUTES 🚀" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Ce script va lancer l'infra, compiler le backend et démarrer le frontend."

# 1. Verification des pre-requis
Write-Host "`n[1/5] Vérification des pré-requis système..." -ForegroundColor Yellow
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ ERREUR: Docker n'est pas installé ou n'est pas dans le PATH." -ForegroundColor Red
    exit 1
}
if (!(Get-Command java -ErrorAction SilentlyContinue)) {
    Write-Host "❌ ERREUR: Java n'est pas installé ou n'est pas dans le PATH." -ForegroundColor Red
    exit 1
}
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ ERREUR: NPM (Node.js) n'est pas installé." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker, Java, et Npm sont présents." -ForegroundColor Green


# 2. Infra Docker (Postgres, Keycloak, Brain Microservices)
Write-Host "`n[2/5] Lancement de l'infrastructure Docker sous-jacente..." -ForegroundColor Yellow
cd infra
docker compose up -d postgres keycloak brain_match brain_proposal brain_nego brain_agent document_service
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERREUR lors du lancement Docker." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Infrastructure Docker démarrée. Attente de Keycloak (10s)..." -ForegroundColor Green
Start-Sleep -Seconds 10
cd ..


# 3. Backend Spring Boot (Compilation et migration Flyway)
Write-Host "`n[3/5] Compilation et lancement du Backend (Spring Boot)..." -ForegroundColor Yellow
cd backend
Write-Host "  -> Compilation Maven (Ceci peut prendre une minute)..."
.\mvnw clean package -DskipTests
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERREUR lors de la compilation Maven." -ForegroundColor Red
    exit 1
}

Write-Host "  -> Démarrage du serveur Spring Boot en arrière-plan..."
# On utilise Start-Process pour détacher le backend dans une nouvelle fenêtre console
Start-Process -FilePath "java" -ArgumentList "-jar target/backend-0.0.1-SNAPSHOT.jar" -WindowStyle Normal -PassThru
Write-Host "✅ Backend lancé sur le port 8080." -ForegroundColor Green
cd ..


# 4. Frontend Angular (Installation et Démarrage)
Write-Host "`n[4/5] Préparation du Frontend Angular..." -ForegroundColor Yellow
cd frontend
if (!(Test-Path "node_modules")) {
    Write-Host "  -> Installation des dépendances NPM..."
    npm install
}

Write-Host "`n[5/5] 🚀 Lancement du serveur de développement Angular..." -ForegroundColor Magenta
Write-Host "L'interface va démarrer sur http://localhost:4200"
Write-Host "Utilisateur de test: demo / Mot de passe: demo"
Write-Host "==========================================================" -ForegroundColor Cyan

# Reste attaché sur le frontend pour voir les logs UI
npm start
