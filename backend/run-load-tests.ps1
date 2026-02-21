# Performance Load Testing Script (PowerShell)
# Usage: .\run-load-tests.ps1 [test-type]

param(
    [string]$TestType = "all",
    [string]$BaseUrl = $env:BASE_URL ?? "http://localhost:8080"
)

$ErrorActionPreference = "Stop"

Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║   Performance Load Testing Suite                  ║" -ForegroundColor Blue
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# Function to check if backend is running
function Test-Backend {
    Write-Host "Checking if backend is running at $BaseUrl..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/actuator/health" -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Backend is running" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "✗ Backend is not running at $BaseUrl" -ForegroundColor Red
        Write-Host "Please start the backend first:" -ForegroundColor Yellow
        Write-Host "  cd backend" -ForegroundColor Yellow
        Write-Host "  `$env:SPRING_PROFILES_ACTIVE='performance'" -ForegroundColor Yellow
        Write-Host "  mvn spring-boot:run" -ForegroundColor Yellow
        exit 1
    }
}

# Function to run Gatling tests
function Invoke-GatlingTest {
    param(
        [string]$TestClass,
        [string]$TestName
    )
    
    Write-Host "Running Gatling test: $TestName" -ForegroundColor Blue
    mvn gatling:test -Dgatling.simulationClass="$TestClass"
    
    $latestReport = Get-ChildItem -Path "target\gatling" -Recurse -Filter "index.html" | 
                    Sort-Object LastWriteTime -Descending | 
                    Select-Object -First 1
    
    if ($latestReport) {
        Write-Host "✓ Test completed. Report available at: $($latestReport.FullName)" -ForegroundColor Green
    }
}

# Function to run K6 tests
function Invoke-K6Test {
    param(
        [string]$TestFile,
        [string]$TestName
    )
    
    Write-Host "Running K6 test: $TestName" -ForegroundColor Blue
    if (Get-Command k6 -ErrorAction SilentlyContinue) {
        Push-Location k6-tests
        k6 run $TestFile -e BASE_URL="$BaseUrl"
        Pop-Location
        Write-Host "✓ Test completed" -ForegroundColor Green
    }
    else {
        Write-Host "⚠ K6 not installed. Skipping K6 test." -ForegroundColor Yellow
        Write-Host "  Install K6: https://k6.io/docs/getting-started/installation/" -ForegroundColor Yellow
    }
}

Test-Backend

switch ($TestType) {
    "dossier" {
        Write-Host "Running standard dossier creation load test..." -ForegroundColor Green
        Invoke-GatlingTest "com.example.backend.loadtest.DossierCreationLoadTest" "Dossier Creation Load Test"
    }
    "standard" {
        Write-Host "Running standard dossier creation load test..." -ForegroundColor Green
        Invoke-GatlingTest "com.example.backend.loadtest.DossierCreationLoadTest" "Dossier Creation Load Test"
    }
    "spike" {
        Write-Host "Running spike load test..." -ForegroundColor Green
        Invoke-GatlingTest "com.example.backend.loadtest.SpikeLoadTest" "Spike Load Test"
    }
    "stress" {
        Write-Host "Running stress load test..." -ForegroundColor Green
        Invoke-GatlingTest "com.example.backend.loadtest.StressLoadTest" "Stress Load Test"
    }
    "endurance" {
        Write-Host "Running endurance load test..." -ForegroundColor Green
        Invoke-GatlingTest "com.example.backend.loadtest.EnduranceLoadTest" "Endurance Load Test"
    }
    "k6" {
        Write-Host "Running K6 load tests..." -ForegroundColor Green
        Invoke-K6Test "dossier-creation-load.js" "K6 Dossier Creation Load Test"
    }
    "all" {
        Write-Host "Running all load tests..." -ForegroundColor Green
        Invoke-GatlingTest "com.example.backend.loadtest.DossierCreationLoadTest" "Dossier Creation Load Test"
        Invoke-GatlingTest "com.example.backend.loadtest.SpikeLoadTest" "Spike Load Test"
        Invoke-GatlingTest "com.example.backend.loadtest.StressLoadTest" "Stress Load Test"
    }
    default {
        Write-Host "Unknown test type: $TestType" -ForegroundColor Red
        Write-Host ""
        Write-Host "Usage: .\run-load-tests.ps1 [test-type]" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Available test types:"
        Write-Host "  dossier|standard  - Standard dossier creation workflow (100 users, 60 min)"
        Write-Host "  spike             - Sudden traffic spikes test"
        Write-Host "  stress            - Gradual load increase to breaking point"
        Write-Host "  endurance         - Sustained load over extended period"
        Write-Host "  k6                - K6 load tests (if K6 is installed)"
        Write-Host "  all               - Run all Gatling tests"
        Write-Host ""
        Write-Host "Examples:"
        Write-Host "  .\run-load-tests.ps1 dossier"
        Write-Host "  .\run-load-tests.ps1 spike"
        Write-Host "  `$env:BASE_URL='http://staging.example.com'; .\run-load-tests.ps1 stress"
        exit 1
    }
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   Load Testing Complete                            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Green
