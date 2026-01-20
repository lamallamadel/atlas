# ========================================================================
# Initial Repository Setup Script
# ========================================================================
#
# This script completes the repository setup after cloning.
#
# Prerequisites:
#   - Java 17 installed at: C:\Environement\Java\jdk-17.0.5.8-hotspot
#   - Maven 3.6+ in PATH
#   - Node.js and npm in PATH
#
# What this script does:
#   1. Sets JAVA_HOME to Java 17
#   2. Installs backend dependencies (Maven)
#   3. Installs Playwright browsers for E2E tests
#
# ========================================================================

Write-Host ""
Write-Host "================================================================"
Write-Host "Initial Repository Setup"
Write-Host "================================================================"
Write-Host ""

# Save original environment
$originalJavaHome = $env:JAVA_HOME
$originalPath = $env:PATH

try {
    # Set Java 17
    $env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
    $env:PATH = "$env:JAVA_HOME\bin;$originalPath"
    
    Write-Host "Step 1: Verifying Java 17..."
    Write-Host "JAVA_HOME: $env:JAVA_HOME"
    java -version
    if ($LASTEXITCODE -ne 0) {
        throw "Java 17 not found at $env:JAVA_HOME"
    }
    Write-Host "✓ Java 17 verified"
    Write-Host ""
    
    Write-Host "Step 2: Installing backend dependencies..."
    Write-Host "Running: mvn clean install -DskipTests"
    Push-Location backend
    mvn clean install -DskipTests
    if ($LASTEXITCODE -ne 0) {
        throw "Backend Maven install failed"
    }
    Pop-Location
    Write-Host "✓ Backend dependencies installed"
    Write-Host ""
    
    Write-Host "Step 3: Installing Playwright browsers..."
    Push-Location frontend
    npm run install-browsers
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠ Playwright browser installation failed - you can install them later with: cd frontend; npm run install-browsers"
    } else {
        Write-Host "✓ Playwright browsers installed"
    }
    Pop-Location
    Write-Host ""
    
    Write-Host "================================================================"
    Write-Host "Setup Complete!"
    Write-Host "================================================================"
    Write-Host ""
    Write-Host "You can now:"
    Write-Host "  - Build backend:    cd backend && .\mvn17.cmd clean package"
    Write-Host "  - Run backend:      cd backend && .\mvn17.cmd spring-boot:run"
    Write-Host "  - Test backend:     cd backend && .\mvn17.cmd test"
    Write-Host "  - Build frontend:   cd frontend && npm run build"
    Write-Host "  - Run frontend:     cd frontend && npm start"
    Write-Host "  - Run E2E tests:    cd frontend && npm run e2e"
    Write-Host ""
    Write-Host "See AGENTS.md for more commands and information"
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "================================================================"
    Write-Host "ERROR: Setup failed"
    Write-Host "================================================================"
    Write-Host ""
    Write-Host $_.Exception.Message
    Write-Host ""
    Write-Host "Please check:"
    Write-Host "  1. Java 17 is installed at: C:\Environement\Java\jdk-17.0.5.8-hotspot"
    Write-Host "  2. Maven is installed and in PATH"
    Write-Host "  3. You have internet connectivity for downloading dependencies"
    Write-Host ""
    exit 1
} finally {
    # Restore original environment
    $env:JAVA_HOME = $originalJavaHome
    $env:PATH = $originalPath
}
