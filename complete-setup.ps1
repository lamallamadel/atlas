# Complete the initial repository setup
# Run this script to finish the backend Maven build with Java 17

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Completing Repository Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set Java 17 for this session
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "✓ JAVA_HOME set to: $env:JAVA_HOME" -ForegroundColor Green
Write-Host ""

# Verify Java version
Write-Host "Checking Java version..." -ForegroundColor Yellow
java -version
Write-Host ""

# Build backend
Write-Host "Building backend with Maven (this may take a few minutes)..." -ForegroundColor Yellow
Set-Location backend
mvn clean install -DskipTests

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Setup Complete! ✓" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Backend JAR created: backend/target/backend.jar" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Run backend:  mvn spring-boot:run" -ForegroundColor White
    Write-Host "  2. Run frontend: cd ../frontend && npm start" -ForegroundColor White
    Write-Host "  3. Run tests:    mvn test" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  Build Failed" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the error messages above." -ForegroundColor Red
    Write-Host "For help, see: INITIAL_SETUP_REPORT.md" -ForegroundColor Yellow
    Write-Host ""
}

Set-Location ..
