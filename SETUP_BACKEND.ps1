#!/usr/bin/env pwsh
# Backend Setup Script for PowerShell

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Backend Setup Script" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "  1. Set JAVA_HOME to Java 17"
Write-Host "  2. Run Maven clean install"
Write-Host ""

# Save current JAVA_HOME
$oldJavaHome = $env:JAVA_HOME
$oldPath = $env:PATH

try {
    # Set JAVA_HOME to Java 17
    $env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
    $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
    
    Write-Host "JAVA_HOME set to: $env:JAVA_HOME" -ForegroundColor Green
    Write-Host ""
    
    # Change to backend directory
    Set-Location backend
    
    Write-Host "Running: mvn clean install -DskipTests -s settings.xml" -ForegroundColor Cyan
    Write-Host ""
    
    # Run Maven
    & mvn clean install -DskipTests -s settings.xml
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "================================================================" -ForegroundColor Green
        Write-Host "SUCCESS: Backend dependencies installed" -ForegroundColor Green
        Write-Host "================================================================" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "================================================================" -ForegroundColor Red
        Write-Host "ERROR: Backend installation failed with exit code $LASTEXITCODE" -ForegroundColor Red
        Write-Host "================================================================" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} finally {
    # Restore original environment
    $env:JAVA_HOME = $oldJavaHome
    $env:PATH = $oldPath
    Set-Location ..
}
