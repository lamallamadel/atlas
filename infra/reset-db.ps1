# Database Reset Script (PowerShell)
# This script stops the PostgreSQL container, removes the volume, and recreates it

$ErrorActionPreference = "Stop"

Write-Host "Stopping PostgreSQL container..." -ForegroundColor Yellow
docker-compose down

Write-Host "Removing PostgreSQL volume..." -ForegroundColor Yellow
try {
    docker volume rm postgres_data 2>$null
} catch {
    Write-Host "Volume not found, continuing..." -ForegroundColor Gray
}

Write-Host "Starting PostgreSQL container with fresh volume..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "Waiting for PostgreSQL to be healthy..." -ForegroundColor Yellow
$maxAttempts = 60
$attempt = 0
do {
    $status = docker-compose ps
    if ($status -match "healthy") {
        break
    }
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 1
    $attempt++
} while ($attempt -lt $maxAttempts)

Write-Host ""
if ($attempt -ge $maxAttempts) {
    Write-Host "Timeout waiting for PostgreSQL to be healthy." -ForegroundColor Red
    exit 1
}

Write-Host "Database reset complete! PostgreSQL is ready." -ForegroundColor Green
