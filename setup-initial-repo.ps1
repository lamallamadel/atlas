# Initial Repository Setup Script
# This script sets up both backend and frontend dependencies

Write-Host "Starting initial repository setup..." -ForegroundColor Cyan

# Set Java 17 for Maven
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "`nJava version:" -ForegroundColor Yellow
java -version

# Setup backend
Write-Host "`n=== Setting up Backend (Maven) ===" -ForegroundColor Cyan
Set-Location backend
mvn --settings settings.xml clean install -DskipTests
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend setup failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

# Setup frontend
Write-Host "`n=== Setting up Frontend (npm) ===" -ForegroundColor Cyan
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend npm install failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Install Playwright browsers
Write-Host "`n=== Installing Playwright browsers ===" -ForegroundColor Cyan
npx playwright install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Playwright browser installation failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
Write-Host "Backend dependencies installed via Maven" -ForegroundColor Green
Write-Host "Frontend dependencies installed via npm" -ForegroundColor Green
Write-Host "Playwright browsers installed" -ForegroundColor Green
