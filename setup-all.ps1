#!/usr/bin/env pwsh
# Complete setup script for the repository
# Sets up both backend (Maven/Java) and frontend (npm/Angular)

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Repository Initial Setup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$JAVA_HOME_PATH = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$originalJavaHome = $env:JAVA_HOME
$originalPath = $env:PATH

try {
    # Step 1: Setup Backend (Maven)
    Write-Host "Step 1: Setting up Backend (Maven)" -ForegroundColor Yellow
    Write-Host "------------------------------------------------------------" -ForegroundColor Yellow
    
    # Check if Java 17 exists
    if (-not (Test-Path $JAVA_HOME_PATH)) {
        Write-Host "ERROR: Java 17 not found at $JAVA_HOME_PATH" -ForegroundColor Red
        Write-Host "Please install Java 17 or update the JAVA_HOME_PATH variable in this script" -ForegroundColor Red
        exit 1
    }
    
    # Set Java 17 for this session
    $env:JAVA_HOME = $JAVA_HOME_PATH
    $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
    
    Write-Host "Using Java from: $env:JAVA_HOME" -ForegroundColor Gray
    
    # Verify Java version
    $javaVersion = & "$env:JAVA_HOME\bin\java.exe" -version 2>&1 | Select-Object -First 1
    Write-Host "Java version: $javaVersion" -ForegroundColor Gray
    Write-Host ""
    
    # Navigate to backend and run Maven
    Push-Location backend
    try {
        Write-Host "Running: mvn clean install -DskipTests" -ForegroundColor Gray
        & mvn clean install -DskipTests
        if ($LASTEXITCODE -ne 0) {
            throw "Maven build failed with exit code $LASTEXITCODE"
        }
        Write-Host "✓ Backend setup complete" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
    Write-Host ""
    
    # Step 2: Setup Frontend (npm)
    Write-Host "Step 2: Setting up Frontend (npm)" -ForegroundColor Yellow
    Write-Host "------------------------------------------------------------" -ForegroundColor Yellow
    
    Push-Location frontend
    try {
        Write-Host "Running: npm install" -ForegroundColor Gray
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed with exit code $LASTEXITCODE"
        }
        Write-Host "✓ Frontend setup complete" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
    Write-Host ""
    
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "✓ Setup Complete!" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now:" -ForegroundColor Cyan
    Write-Host "  - Run backend tests:  cd backend; mvn test" -ForegroundColor White
    Write-Host "  - Run frontend tests: cd frontend; npm test" -ForegroundColor White
    Write-Host "  - Build backend:      cd backend; mvn clean package" -ForegroundColor White
    Write-Host "  - Build frontend:     cd frontend; npm run build" -ForegroundColor White
    Write-Host ""
    Write-Host "Note: For backend commands, use the mvn-java17.cmd wrapper or" -ForegroundColor Yellow
    Write-Host "set JAVA_HOME to Java 17 before running mvn commands." -ForegroundColor Yellow
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host "✗ Setup Failed" -ForegroundColor Red
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    exit 1
}
finally {
    # Restore original environment
    if ($originalJavaHome) {
        $env:JAVA_HOME = $originalJavaHome
    }
    if ($originalPath) {
        $env:PATH = $originalPath
    }
}
