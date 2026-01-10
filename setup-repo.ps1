# Repository Initial Setup Script
Write-Host "Setting up repository..." -ForegroundColor Green

# Set Java 17
$oldJavaHome = $env:JAVA_HOME
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "`nJava version:" -ForegroundColor Cyan
java -version

# Backend setup
Write-Host "`n=== Installing Backend Dependencies ===" -ForegroundColor Green
Set-Location backend
& C:\Environement\maven-3.8.6\bin\mvn.cmd clean install --toolchains ..\toolchains.xml --settings settings.xml
$backendExitCode = $LASTEXITCODE
Set-Location ..

if ($backendExitCode -eq 0) {
    Write-Host "`n✓ Backend setup completed successfully" -ForegroundColor Green
} else {
    Write-Host "`n✗ Backend setup failed with exit code: $backendExitCode" -ForegroundColor Red
}

# Frontend setup
Write-Host "`n=== Installing Frontend Dependencies ===" -ForegroundColor Green
Set-Location frontend
npm install
$frontendExitCode = $LASTEXITCODE
Set-Location ..

if ($frontendExitCode -eq 0) {
    Write-Host "`n✓ Frontend dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "`n✗ Frontend npm install failed with exit code: $frontendExitCode" -ForegroundColor Red
}

# Install Playwright browsers
Write-Host "`n=== Installing Playwright Browsers ===" -ForegroundColor Green
Set-Location frontend
npx playwright install
$playwrightExitCode = $LASTEXITCODE
Set-Location ..

if ($playwrightExitCode -eq 0) {
    Write-Host "`n✓ Playwright browsers installed successfully" -ForegroundColor Green
} else {
    Write-Host "`n✗ Playwright install failed with exit code: $playwrightExitCode" -ForegroundColor Red
}

# Restore Java Home
$env:JAVA_HOME = $oldJavaHome

Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
Write-Host "Backend: $(if ($backendExitCode -eq 0) { '✓' } else { '✗' })" -ForegroundColor $(if ($backendExitCode -eq 0) { 'Green' } else { 'Red' })
Write-Host "Frontend: $(if ($frontendExitCode -eq 0) { '✓' } else { '✗' })" -ForegroundColor $(if ($frontendExitCode -eq 0) { 'Green' } else { 'Red' })
Write-Host "Playwright: $(if ($playwrightExitCode -eq 0) { '✓' } else { '✗' })" -ForegroundColor $(if ($playwrightExitCode -eq 0) { 'Green' } else { 'Red' })
