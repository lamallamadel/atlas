# Simple setup runner that uses Start-Process with environment
$ErrorActionPreference = "Stop"

Write-Host "Starting repository setup..." -ForegroundColor Cyan

# Setup backend
Write-Host "`nSetting up backend..." -ForegroundColor Yellow
Set-Location backend
$process = Start-Process -FilePath "mvn" -ArgumentList "clean","install","-DskipTests" `
    -Environment @{JAVA_HOME='C:\Environement\Java\jdk-17.0.5.8-hotspot'} `
    -NoNewWindow -Wait -PassThru
Set-Location ..

if ($process.ExitCode -ne 0) {
    Write-Host "Backend setup failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Backend setup complete" -ForegroundColor Green

# Setup frontend
Write-Host "`nSetting up frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
Set-Location ..

Write-Host "`nSetup complete!" -ForegroundColor Green
