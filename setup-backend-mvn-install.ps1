#!/usr/bin/env pwsh
# Setup script for backend Maven installation with Java 17

$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "JAVA_HOME set to: $env:JAVA_HOME"
Write-Host "Running Maven clean install..."

Set-Location backend
mvn clean install -DskipTests
