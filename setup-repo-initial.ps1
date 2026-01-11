# Initial repository setup script
# This script sets up the backend and frontend dependencies

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Initial Repository Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Copy toolchains.xml to Maven directory
Write-Host "`n[1/4] Configuring Maven toolchains..." -ForegroundColor Yellow
$m2Dir = Join-Path $env:USERPROFILE ".m2"
if (-not (Test-Path $m2Dir)) {
    New-Item -ItemType Directory -Path $m2Dir -Force | Out-Null
}
Copy-Item -Path "toolchains.xml" -Destination (Join-Path $m2Dir "toolchains.xml") -Force
Write-Host "✓ Toolchains configured" -ForegroundColor Green

# Step 2: Build backend with Java 17
Write-Host "`n[2/4] Building backend (this may take several minutes)..." -ForegroundColor Yellow
Push-Location backend
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
& mvn clean install -DskipTests -gs settings.xml -t toolchains.xml
$backendResult = $LASTEXITCODE
Pop-Location

if ($backendResult -eq 0) {
    Write-Host "✓ Backend build successful" -ForegroundColor Green
} else {
    Write-Host "✗ Backend build failed" -ForegroundColor Red
    exit 1
}

# Step 3: Install frontend dependencies
Write-Host "`n[3/4] Installing frontend dependencies..." -ForegroundColor Yellow
Push-Location frontend
& npm install
$frontendResult = $LASTEXITCODE
Pop-Location

if ($frontendResult -eq 0) {
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Frontend npm install failed" -ForegroundColor Red
    exit 1
}

# Step 4: Install Playwright browsers
Write-Host "`n[4/4] Installing Playwright browsers..." -ForegroundColor Yellow
Push-Location frontend
& npx playwright install
$playwrightResult = $LASTEXITCODE
Pop-Location

if ($playwrightResult -eq 0) {
    Write-Host "✓ Playwright browsers installed" -ForegroundColor Green
} else {
    Write-Host "⚠ Playwright browser installation had issues (you may need to run manually)" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Initial Repository Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nYou can now run:" -ForegroundColor White
Write-Host "  - Backend tests: cd backend && mvn test" -ForegroundColor Gray
Write-Host "  - Backend dev: cd backend && mvn spring-boot:run" -ForegroundColor Gray
Write-Host "  - Frontend dev: cd frontend && npm start" -ForegroundColor Gray
Write-Host "  - Frontend E2E: cd frontend && npm run e2e" -ForegroundColor Gray
