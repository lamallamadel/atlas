# Simple Maven build script using toolchains
$ErrorActionPreference = 'Continue'

Write-Host "Running Maven clean install..." -ForegroundColor Cyan

# Run Maven using toolchains configuration from parent directory
Push-Location $PSScriptRoot
try {
    mvn clean install --global-toolchains ..\toolchains.xml
} finally {
    Pop-Location
}
