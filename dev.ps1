#!/usr/bin/env pwsh

# Development Stack Management Script (PowerShell)
# Usage: .\dev.ps1 <command> [options]

param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    
    [Parameter(Position=1)]
    [string]$Service = "all"
)

$ErrorActionPreference = "Stop"

# Project directories
$BackendDir = "backend"
$FrontendDir = "frontend"
$InfraDir = "infra"

# PID files
$BackendPidFile = ".backend.pid"
$FrontendPidFile = ".frontend.pid"

# Color functions
function Write-Info {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Red
}

# Function to check if Java is installed
function Test-Java {
    if (-not $env:JAVA_HOME) {
        Write-Error "ERROR: JAVA_HOME is not set"
        Write-Warning "Set JAVA_HOME before running this script:"
        Write-Host "  `$env:JAVA_HOME = 'C:\Path\To\jdk-17'"
        exit 1
    }
    Write-Success "✓ JAVA_HOME is set to: $env:JAVA_HOME"
}

# Function to check if a service is running
function Test-Service {
    param(
        [string]$Url,
        [string]$Name
    )
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        Write-Success "  ✓ $Name is running"
        return $true
    }
    catch {
        Write-Error "  ✗ $Name is not running"
        return $false
    }
}

# Function to start infrastructure
function Start-Infrastructure {
    Write-Info "Starting infrastructure..."
    Push-Location $InfraDir
    docker-compose up -d
    Pop-Location
    Write-Success "✓ Infrastructure started"
}

# Function to start backend
function Start-Backend {
    Write-Info "Building and starting backend..."
    Push-Location $BackendDir
    
    # Build silently
    mvn clean install -DskipTests | Out-Null
    
    # Start in background
    $job = Start-Job -ScriptBlock {
        param($dir)
        Set-Location $dir
        mvn spring-boot:run
    } -ArgumentList (Get-Location).Path
    
    $job.Id | Out-File -FilePath "..\$BackendPidFile"
    Pop-Location
    Write-Success "✓ Backend started (Job ID: $($job.Id))"
}

# Function to start frontend
function Start-Frontend {
    Write-Info "Installing frontend dependencies and starting..."
    Push-Location $FrontendDir
    
    # Install dependencies silently
    npm install | Out-Null
    
    # Start in background
    $job = Start-Job -ScriptBlock {
        param($dir)
        Set-Location $dir
        npm start
    } -ArgumentList (Get-Location).Path
    
    $job.Id | Out-File -FilePath "..\$FrontendPidFile"
    Pop-Location
    Write-Success "✓ Frontend started (Job ID: $($job.Id))"
}

# Function to stop services
function Stop-Services {
    Write-Warning "Stopping development stack..."
    
    # Stop backend
    if (Test-Path $BackendPidFile) {
        $jobId = Get-Content $BackendPidFile
        Stop-Job -Id $jobId -ErrorAction SilentlyContinue
        Remove-Job -Id $jobId -ErrorAction SilentlyContinue
        Remove-Item $BackendPidFile -ErrorAction SilentlyContinue
    }
    
    # Kill any remaining Spring Boot processes
    Get-Process | Where-Object { $_.CommandLine -like "*spring-boot:run*" } | Stop-Process -Force -ErrorAction SilentlyContinue
    
    # Stop frontend
    if (Test-Path $FrontendPidFile) {
        $jobId = Get-Content $FrontendPidFile
        Stop-Job -Id $jobId -ErrorAction SilentlyContinue
        Remove-Job -Id $jobId -ErrorAction SilentlyContinue
        Remove-Item $FrontendPidFile -ErrorAction SilentlyContinue
    }
    
    # Kill any remaining ng serve processes
    Get-Process | Where-Object { $_.ProcessName -eq "node" -and $_.CommandLine -like "*ng serve*" } | Stop-Process -Force -ErrorAction SilentlyContinue
    
    # Stop infrastructure
    Push-Location $InfraDir
    docker-compose down
    Pop-Location
    
    Write-Success "✓ Stack stopped"
}

# Function to show status
function Show-Status {
    Write-Info "Service Status:"
    Write-Host ""
    
    Write-Info "Infrastructure:"
    Push-Location $InfraDir
    docker-compose ps
    Pop-Location
    Write-Host ""
    
    Write-Info "Backend (Spring Boot):"
    Test-Service -Url "http://localhost:8080/actuator/health" -Name "Backend" | Out-Null
    Write-Host ""
    
    Write-Info "Frontend (Angular):"
    Test-Service -Url "http://localhost:4200" -Name "Frontend" | Out-Null
}

# Function to show logs
function Show-Logs {
    param([string]$ServiceType)
    
    switch ($ServiceType) {
        "backend" {
            Write-Info "Backend logs:"
            $logFile = Join-Path $BackendDir "backend.log"
            if (Test-Path $logFile) {
                Get-Content $logFile -Wait
            }
            else {
                Write-Warning "Backend log file not found"
            }
        }
        "frontend" {
            Write-Info "Frontend logs:"
            $logFile = Join-Path $FrontendDir "frontend.log"
            if (Test-Path $logFile) {
                Get-Content $logFile -Wait
            }
            else {
                Write-Warning "Frontend log file not found"
            }
        }
        "db" {
            Write-Info "Database logs:"
            Push-Location $InfraDir
            docker-compose logs -f postgres
            Pop-Location
        }
        default {
            Write-Info "All infrastructure logs:"
            Push-Location $InfraDir
            docker-compose logs -f
            Pop-Location
        }
    }
}

# Function to reset database
function Reset-Database {
    Write-Warning "Resetting database..."
    Push-Location $InfraDir
    docker-compose down
    docker volume rm postgres_data 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Volume not found, continuing..."
    }
    docker-compose up -d
    Pop-Location
    Write-Success "✓ Database reset complete"
}

# Function to show help
function Show-Help {
    Write-Info "Development Stack Management"
    Write-Host ""
    Write-Success "Usage:"
    Write-Host "  .\dev.ps1 <command> [options]"
    Write-Host ""
    Write-Success "Commands:"
    Write-Host "  " -NoNewline; Write-Info "up" -NoNewline; Write-Host "              Start the full development stack"
    Write-Host "  " -NoNewline; Write-Info "down" -NoNewline; Write-Host "            Stop all services"
    Write-Host "  " -NoNewline; Write-Info "restart" -NoNewline; Write-Host "         Restart all services"
    Write-Host "  " -NoNewline; Write-Info "status" -NoNewline; Write-Host "          Check status of all services"
    Write-Host "  " -NoNewline; Write-Info "logs" -NoNewline; Write-Host " [service]  View logs (all, backend, frontend, db)"
    Write-Host "  " -NoNewline; Write-Info "reset" -NoNewline; Write-Host "           Reset database (delete all data)"
    Write-Host "  " -NoNewline; Write-Info "help" -NoNewline; Write-Host "            Show this help message"
    Write-Host ""
    Write-Success "Examples:"
    Write-Host "  .\dev.ps1 up              # Start everything"
    Write-Host "  .\dev.ps1 down            # Stop everything"
    Write-Host "  .\dev.ps1 logs            # View all infrastructure logs"
    Write-Host "  .\dev.ps1 logs backend    # View backend logs"
    Write-Host "  .\dev.ps1 logs frontend   # View frontend logs"
    Write-Host "  .\dev.ps1 logs db         # View database logs"
    Write-Host "  .\dev.ps1 reset           # Reset database"
    Write-Host ""
    Write-Warning "Prerequisites:"
    Write-Host "  - Java 17 (JAVA_HOME must be set)"
    Write-Host "  - Maven 3.6+"
    Write-Host "  - Node.js 18+ and npm"
    Write-Host "  - Docker & Docker Compose"
    Write-Host ""
    Write-Info "Access:"
    Write-Host "  Frontend:  http://localhost:4200"
    Write-Host "  Backend:   http://localhost:8080"
    Write-Host "  API Docs:  http://localhost:8080/swagger-ui.html"
    Write-Host "  Health:    http://localhost:8080/actuator/health"
    Write-Host ""
}

# Main command handler
switch ($Command.ToLower()) {
    "up" {
        Test-Java
        Write-Info "Starting development stack..."
        Write-Host ""
        Start-Infrastructure
        Start-Sleep -Seconds 3
        Start-Backend
        Start-Sleep -Seconds 2
        Start-Frontend
        Write-Host ""
        Write-Success "✓ Stack started!"
        Write-Host ""
        Write-Info "Access:"
        Write-Host "  Frontend:  http://localhost:4200"
        Write-Host "  Backend:   http://localhost:8080"
        Write-Host "  API Docs:  http://localhost:8080/swagger-ui.html"
        Write-Host "  Health:    http://localhost:8080/actuator/health"
        Write-Host ""
        Write-Warning "Note: Services may take a few moments to be fully ready"
    }
    "down" {
        Stop-Services
    }
    "restart" {
        Stop-Services
        Start-Sleep -Seconds 2
        Test-Java
        Write-Info "Starting development stack..."
        Start-Infrastructure
        Start-Sleep -Seconds 3
        Start-Backend
        Start-Sleep -Seconds 2
        Start-Frontend
        Write-Success "✓ Stack restarted!"
    }
    "status" {
        Show-Status
    }
    "logs" {
        Show-Logs -ServiceType $Service
    }
    "reset" {
        Reset-Database
    }
    "help" {
        Show-Help
    }
    default {
        Write-Error "Unknown command: $Command"
        Write-Host ""
        Show-Help
        exit 1
    }
}
