# PowerShell script to run Backend E2E tests with PostgreSQL Testcontainers
# This script captures detailed logs showing the initialization order

Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║ Backend E2E Tests with PostgreSQL Testcontainers                           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
$dockerRunning = $false
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
        Write-Host "✓ Docker is running" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Docker is not running" -ForegroundColor Red
}

if (-not $dockerRunning) {
    Write-Host ""
    Write-Host "ERROR: Docker is required but not running." -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}

# Check Java version
Write-Host ""
Write-Host "Checking Java version..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1 | Select-String "version" | Select-Object -First 1
    Write-Host "✓ Java found: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Java not found" -ForegroundColor Red
    Write-Host "Please ensure Java 17 is installed and in PATH" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║ Running Maven Verify with backend-e2e-postgres Profile                     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Create logs directory if it doesn't exist
$logsDir = "target/e2e-test-logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = "$logsDir/e2e-postgres-$timestamp.log"

Write-Host "Test execution logs will be saved to: $logFile" -ForegroundColor Cyan
Write-Host ""

# Run Maven verify with the backend-e2e-postgres profile
# Tee output to both console and log file
mvn verify -Pbackend-e2e-postgres 2>&1 | Tee-Object -FilePath $logFile

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║ Test Execution Complete                                                     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

if ($exitCode -eq 0) {
    Write-Host "✓ All tests passed successfully!" -ForegroundColor Green
} else {
    Write-Host "✗ Some tests failed. Exit code: $exitCode" -ForegroundColor Red
    Write-Host ""
    Write-Host "Review the logs for details:" -ForegroundColor Yellow
    Write-Host "  $logFile" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Test reports available at:" -ForegroundColor Yellow
    Write-Host "  target/surefire-reports/" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Log file saved: $logFile" -ForegroundColor Cyan

# Extract and display initialization order summary from logs
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║ Initialization Order Summary                                               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$content = Get-Content $logFile -Raw
if ($content -match "STEP 1: Initializing PostgreSQL Testcontainer") {
    Write-Host "✓ Step 1: PostgreSQL Testcontainer initialized" -ForegroundColor Green
}
if ($content -match "STEP 2: Registering PostgreSQL Container") {
    Write-Host "✓ Step 2: DataSource configured" -ForegroundColor Green
}
if ($content -match "STEP 3: Configuring Flyway") {
    Write-Host "✓ Step 3: Flyway configured" -ForegroundColor Green
}
if ($content -match "STEP 4: Starting Flyway Database Migrations") {
    Write-Host "✓ Step 4: Flyway migrations executed" -ForegroundColor Green
}
if ($content -match "STEP 5: Initializing Spring Application Context") {
    Write-Host "✓ Step 5: Spring Application Context initialized" -ForegroundColor Green
}
if ($content -match "STEP 6: Spring Application Context Ready") {
    Write-Host "✓ Step 6: Tests ready to execute" -ForegroundColor Green
}

Write-Host ""

exit $exitCode
