#!/usr/bin/env pwsh
# Initial repository setup script
# Sets JAVA_HOME and installs dependencies

$ErrorActionPreference = "Stop"

Write-Host "Starting initial repository setup..." -ForegroundColor Cyan

# Set JAVA_HOME
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
Write-Host "✓ JAVA_HOME set to: $env:JAVA_HOME" -ForegroundColor Green

# Copy toolchains.xml to Maven config directory
$m2Dir = Join-Path $env:USERPROFILE ".m2"
if (-not (Test-Path $m2Dir)) {
    New-Item -ItemType Directory -Path $m2Dir -Force | Out-Null
    Write-Host "✓ Created .m2 directory" -ForegroundColor Green
}

$toolchainsSource = Join-Path $PSScriptRoot "toolchains.xml"
$toolchainsDest = Join-Path $m2Dir "toolchains.xml"
Copy-Item -Path $toolchainsSource -Destination $toolchainsDest -Force
Write-Host "✓ Copied toolchains.xml to Maven config" -ForegroundColor Green

# Install backend dependencies
Write-Host "`nInstalling backend dependencies..." -ForegroundColor Cyan
Push-Location backend
try {
    & mvn clean install -DskipTests
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Backend dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Backend installation failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}

# Install frontend dependencies
Write-Host "`nInstalling frontend dependencies..." -ForegroundColor Cyan
Push-Location frontend
try {
    & npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Frontend dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Frontend installation failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✓ Initial setup complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nYou can now:" -ForegroundColor Cyan
Write-Host "  - Build backend: cd backend && mvn clean package" -ForegroundColor White
Write-Host "  - Test backend: cd backend && mvn test" -ForegroundColor White
Write-Host "  - Build frontend: cd frontend && npm run build" -ForegroundColor White
Write-Host "  - Test frontend: cd frontend && npm test" -ForegroundColor White
Write-Host "  - Run E2E tests: cd backend && mvn verify -Pbackend-e2e-h2" -ForegroundColor White
