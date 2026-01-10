# Initial Repository Setup Script
# This script sets up both backend (Maven/Java) and frontend (npm) dependencies

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Initial Repository Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Setup Maven toolchains
Write-Host "Step 1: Setting up Maven toolchains..." -ForegroundColor Yellow
$m2Dir = Join-Path $env:USERPROFILE ".m2"
if (-not (Test-Path $m2Dir)) {
    New-Item -ItemType Directory -Path $m2Dir | Out-Null
    Write-Host "  Created .m2 directory" -ForegroundColor Green
}

$toolchainsSource = Join-Path $PSScriptRoot "toolchains.xml"
$toolchainsDest = Join-Path $m2Dir "toolchains.xml"
Copy-Item -Path $toolchainsSource -Destination $toolchainsDest -Force
Write-Host "  Copied toolchains.xml to ~/.m2/" -ForegroundColor Green
Write-Host ""

# Step 2: Install backend dependencies
Write-Host "Step 2: Installing backend dependencies (Maven)..." -ForegroundColor Yellow
$oldJavaHome = $env:JAVA_HOME
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Push-Location backend
try {
    Write-Host "  Running: mvn clean install -DskipTests" -ForegroundColor Gray
    & mvn clean install -DskipTests
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Backend dependencies installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "  Backend installation failed with exit code $LASTEXITCODE" -ForegroundColor Red
        Pop-Location
        $env:JAVA_HOME = $oldJavaHome
        exit 1
    }
} finally {
    Pop-Location
    $env:JAVA_HOME = $oldJavaHome
}
Write-Host ""

# Step 3: Install frontend dependencies
Write-Host "Step 3: Installing frontend dependencies (npm)..." -ForegroundColor Yellow
Push-Location frontend
try {
    Write-Host "  Running: npm install" -ForegroundColor Gray
    & npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Frontend dependencies installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "  Frontend installation failed with exit code $LASTEXITCODE" -ForegroundColor Red
        Pop-Location
        exit 1
    }
} finally {
    Pop-Location
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  - Backend:" -ForegroundColor Cyan
Write-Host "    cd backend && mvn spring-boot:run"
Write-Host ""
Write-Host "  - Frontend:" -ForegroundColor Cyan
Write-Host "    cd frontend && npm start"
Write-Host ""
Write-Host "  - Run tests:" -ForegroundColor Cyan
Write-Host "    Backend: cd backend && mvn test"
Write-Host "    Frontend: cd frontend && npm test"
Write-Host ""
