# Complete Initial Setup Script for Newly Cloned Repository
# Run this script from the repository root directory
# Usage: .\SETUP.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Repository Initial Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set Java 17
Write-Host "[1/4] Setting JAVA_HOME to Java 17..." -ForegroundColor Yellow
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Verify Java version
Write-Host "[1/4] Verifying Java version..." -ForegroundColor Yellow
& java -version
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Java 17 not found at $env:JAVA_HOME" -ForegroundColor Red
    Write-Host "Please verify the Java 17 installation path." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Java 17 verified" -ForegroundColor Green
Write-Host ""

# Backend Maven install
Write-Host "[2/4] Installing backend dependencies (Maven)..." -ForegroundColor Yellow
Write-Host "This may take several minutes on first run..." -ForegroundColor Gray
Push-Location backend
mvn clean install -DskipTests
$backendStatus = $LASTEXITCODE
Pop-Location

if ($backendStatus -ne 0) {
    Write-Host "ERROR: Backend Maven install failed!" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
Write-Host ""

# Frontend npm install
Write-Host "[3/4] Installing frontend dependencies (npm)..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray
Push-Location frontend
npm install
$frontendStatus = $LASTEXITCODE
Pop-Location

if ($frontendStatus -ne 0) {
    Write-Host "ERROR: Frontend npm install failed!" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
Write-Host ""

# Playwright browsers
Write-Host "[4/4] Installing Playwright browsers..." -ForegroundColor Yellow
Push-Location frontend
npx playwright install
$playwrightStatus = $LASTEXITCODE
Pop-Location

if ($playwrightStatus -ne 0) {
    Write-Host "WARNING: Playwright browser installation failed!" -ForegroundColor Yellow
    Write-Host "You can install them later with: cd frontend && npx playwright install" -ForegroundColor Yellow
} else {
    Write-Host "✓ Playwright browsers installed" -ForegroundColor Green
}
Write-Host ""

# Success message
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "You can now:" -ForegroundColor Cyan
Write-Host "  • Build backend:     cd backend && mvn clean package" -ForegroundColor White
Write-Host "  • Test backend:      cd backend && mvn test" -ForegroundColor White
Write-Host "  • Run backend:       cd backend && mvn spring-boot:run" -ForegroundColor White
Write-Host "  • Test frontend E2E: cd frontend && npm run e2e" -ForegroundColor White
Write-Host ""
Write-Host "See AGENTS.md for more commands and options." -ForegroundColor Gray
