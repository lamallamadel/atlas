#!/usr/bin/env pwsh
# Initial Repository Setup Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Repository Initial Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Set Java 17 for this session
Write-Host "Step 1: Configuring Java 17..." -ForegroundColor Yellow
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Verify Java version
Write-Host "Verifying Java version..." -ForegroundColor Gray
& java -version
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Java 17 not found or not configured correctly!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Backend setup
Write-Host "Step 2: Setting up backend (Maven)..." -ForegroundColor Yellow
Push-Location backend
try {
    & mvn clean install -DskipTests
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Backend Maven install failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Backend setup complete!" -ForegroundColor Green
} finally {
    Pop-Location
}
Write-Host ""

# Step 3: Frontend setup
Write-Host "Step 3: Setting up frontend (npm)..." -ForegroundColor Yellow
Push-Location frontend
try {
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Frontend npm install failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Frontend setup complete!" -ForegroundColor Green
} finally {
    Pop-Location
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "Initial setup complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  - Build backend:  cd backend && mvn clean package" -ForegroundColor White
Write-Host "  - Run backend:    cd backend && mvn spring-boot:run" -ForegroundColor White
Write-Host "  - Run frontend:   cd frontend && npm start" -ForegroundColor White
Write-Host "  - Run tests:      cd backend && mvn test" -ForegroundColor White
Write-Host ""
