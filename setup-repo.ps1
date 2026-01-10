# Repository Initial Setup Script
# This script sets up the backend and frontend for development

Write-Host "======================================" -ForegroundColor Cyan
Write-Host " Repository Initial Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Set JAVA_HOME for backend build
Write-Host "[1/4] Setting JAVA_HOME to Java 17..." -ForegroundColor Yellow
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "JAVA_HOME set to: $env:JAVA_HOME" -ForegroundColor Green
java -version
Write-Host ""

# Step 2: Build backend
Write-Host "[2/4] Building backend (Maven clean install)..." -ForegroundColor Yellow
Set-Location backend
mvn clean install -DskipTests

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "Backend build successful!" -ForegroundColor Green
Set-Location ..
Write-Host ""

# Step 3: Install frontend dependencies
Write-Host "[3/4] Installing frontend dependencies (npm install)..." -ForegroundColor Yellow
Set-Location frontend
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend npm install failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "Frontend dependencies installed!" -ForegroundColor Green
Write-Host ""

# Step 4: Install Playwright browsers
Write-Host "[4/4] Installing Playwright browsers..." -ForegroundColor Yellow
npx playwright install

if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Playwright browser installation failed. You may need to run this manually:" -ForegroundColor Yellow
    Write-Host "  cd frontend" -ForegroundColor Yellow
    Write-Host "  npx playwright install" -ForegroundColor Yellow
}
else {
    Write-Host "Playwright browsers installed!" -ForegroundColor Green
}

Set-Location ..
Write-Host ""

# Summary
Write-Host "======================================" -ForegroundColor Cyan
Write-Host " Setup Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now:" -ForegroundColor White
Write-Host "  - Run backend tests:  cd backend && mvn test" -ForegroundColor White
Write-Host "  - Build backend:      cd backend && mvn clean package" -ForegroundColor White
Write-Host "  - Run backend server: cd backend && mvn spring-boot:run" -ForegroundColor White
Write-Host "  - Run frontend tests: cd frontend && npm test" -ForegroundColor White
Write-Host "  - Run frontend E2E:   cd frontend && npm run e2e" -ForegroundColor White
Write-Host "  - Start frontend:     cd frontend && npm start" -ForegroundColor White
Write-Host ""
Write-Host "Note: Remember to set JAVA_HOME before running Maven commands:" -ForegroundColor Yellow
Write-Host "  `$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'" -ForegroundColor Yellow
Write-Host ""
