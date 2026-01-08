#!/usr/bin/env pwsh
# Repository Initial Setup Script

Write-Host "=== Repository Initial Setup ===" -ForegroundColor Cyan
Write-Host ""

# Set Java 17 for this session
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "Java Home: $env:JAVA_HOME" -ForegroundColor Green
Write-Host ""

# Setup .m2 toolchains if needed
$m2Dir = "$env:USERPROFILE\.m2"
if (-not (Test-Path $m2Dir)) {
    Write-Host "Creating .m2 directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $m2Dir | Out-Null
}

$toolchainsPath = "$m2Dir\toolchains.xml"
if (-not (Test-Path $toolchainsPath)) {
    Write-Host "Copying toolchains.xml to .m2 directory..." -ForegroundColor Yellow
    Copy-Item -Path "backend\toolchains.xml" -Destination $toolchainsPath -Force
}

Write-Host "=== Step 1: Installing Backend Dependencies ===" -ForegroundColor Cyan
Write-Host ""

Set-Location backend
& mvn clean install -DskipTests -s settings.xml
$backendResult = $LASTEXITCODE
Set-Location ..

if ($backendResult -ne 0) {
    Write-Host "Backend installation failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Step 2: Installing Frontend Dependencies ===" -ForegroundColor Cyan
Write-Host ""

Set-Location frontend
& npm install
$frontendResult = $LASTEXITCODE
Set-Location ..

if ($frontendResult -ne 0) {
    Write-Host "Frontend installation failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  - Backend build: cd backend; mvn clean package" -ForegroundColor White
Write-Host "  - Backend test: cd backend; mvn test" -ForegroundColor White
Write-Host "  - Frontend build: cd frontend; npm run build" -ForegroundColor White
Write-Host "  - Frontend test: cd frontend; npm test" -ForegroundColor White
Write-Host ""
