# Backend Setup Script
# This script sets up the backend Maven dependencies with Java 17

Write-Host "Setting up backend with Java 17..." -ForegroundColor Cyan
Write-Host ""

$oldJavaHome = $env:JAVA_HOME
$oldPath = $env:PATH

try {
    $env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
    $env:PATH = "$env:JAVA_HOME\bin;$oldPath"
    
    Write-Host "JAVA_HOME: $env:JAVA_HOME"
    Write-Host "Running: mvn clean install -DskipTests"
    Write-Host ""
    
    Push-Location backend
    mvn clean install -DskipTests
    $exitCode = $LASTEXITCODE
    Pop-Location
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "✓ Backend setup complete!" -ForegroundColor Green
        Write-Host ""
        return 0
    } else {
        Write-Host ""
        Write-Host "✗ Backend setup failed with exit code: $exitCode" -ForegroundColor Red
        Write-Host ""
        return $exitCode
    }
} finally {
    $env:JAVA_HOME = $oldJavaHome
    $env:PATH = $oldPath
}
