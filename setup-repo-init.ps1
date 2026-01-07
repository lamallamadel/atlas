#!/usr/bin/env pwsh
# Repository Setup Script
# This script sets up both backend and frontend dependencies

$ErrorActionPreference = "Stop"

Write-Host "=== Repository Setup ===" -ForegroundColor Cyan
Write-Host ""

# Setup backend
Write-Host "Setting up backend (Maven)..." -ForegroundColor Green
Push-Location backend

# Use the Maven wrapper that sets Java 17
if (Test-Path "mvn-java17.cmd") {
    Write-Host "Using mvn-java17.cmd wrapper..." -ForegroundColor Yellow
    & cmd /c "mvn-java17.cmd clean install -DskipTests"
} elseif (Test-Path "build-java17.ps1") {
    Write-Host "Using build-java17.ps1 script..." -ForegroundColor Yellow
    & .\build-java17.ps1
} else {
    Write-Host "Running mvn clean install..." -ForegroundColor Yellow
    mvn clean install -DskipTests -gs settings.xml
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend setup failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location
Write-Host "✓ Backend setup complete" -ForegroundColor Green
Write-Host ""

# Setup frontend
Write-Host "Setting up frontend (npm)..." -ForegroundColor Green
Push-Location frontend

Write-Host "Running npm install..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend setup failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location
Write-Host "✓ Frontend setup complete" -ForegroundColor Green
Write-Host ""

Write-Host "=== Setup Complete ===" -ForegroundColor Cyan
Write-Host "You can now:" -ForegroundColor White
Write-Host "  - Build backend: cd backend && mvn clean package" -ForegroundColor White
Write-Host "  - Test backend: cd backend && mvn test" -ForegroundColor White
Write-Host "  - Build frontend: cd frontend && npm run build" -ForegroundColor White
Write-Host "  - Test frontend: cd frontend && npm test" -ForegroundColor White
