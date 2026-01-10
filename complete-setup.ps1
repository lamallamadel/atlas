# Complete Repository Setup Script
# This script finishes the initial repository setup by building the backend

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Complete Repository Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set Java 17 environment
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "[1/3] Java Environment" -ForegroundColor Yellow
Write-Host "  JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Gray
Write-Host ""

# Build backend
Write-Host "[2/3] Building Backend..." -ForegroundColor Yellow
Push-Location backend
try {
    mvn clean install -DskipTests -gs settings.xml
    if ($LASTEXITCODE -ne 0) {
        throw "Backend build failed"
    }
    Write-Host "  Backend build: SUCCESS" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "ERROR: Backend build failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Pop-Location
    Read-Host "Press Enter to exit"
    exit 1
} finally {
    Pop-Location
}
Write-Host ""

# Install Playwright browsers (optional)
Write-Host "[3/3] Installing Playwright Browsers (optional)..." -ForegroundColor Yellow
Push-Location frontend
try {
    npx playwright install
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "WARNING: Playwright browser installation failed" -ForegroundColor Yellow
        Write-Host "This is optional - you can install later with: cd frontend && npx playwright install" -ForegroundColor Gray
    }
} catch {
    Write-Host ""
    Write-Host "WARNING: Playwright browser installation failed" -ForegroundColor Yellow
    Write-Host "This is optional - you can install later with: cd frontend && npx playwright install" -ForegroundColor Gray
} finally {
    Pop-Location
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Repository is now ready for development." -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start backend:  cd backend && mvn spring-boot:run" -ForegroundColor Gray
Write-Host "  2. Start frontend: cd frontend && npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "Access points:" -ForegroundColor Cyan
Write-Host "  - Frontend:  http://localhost:4200" -ForegroundColor Gray
Write-Host "  - Backend:   http://localhost:8080" -ForegroundColor Gray
Write-Host "  - API Docs:  http://localhost:8080/swagger-ui.html" -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter to exit"
