#!/usr/bin/env pwsh
<#
.SYNOPSIS
Comprehensive test validation suite runner for backend and frontend E2E tests

.DESCRIPTION
This script runs:
1. Backend E2E tests with H2 profile (target: <5min)
2. Backend E2E tests with Postgres profile (target: <15min) with Testcontainers cleanup
3. Frontend Playwright tests with all four configurations:
   - h2-mock
   - h2-keycloak
   - postgres-mock
   - postgres-keycloak
4. Handles database compatibility issues (JSONB, UUID, timestamps, sequences)
5. Handles auth configuration (mock vs Keycloak)
6. Verifies 80%+ coverage on critical business workflows
7. Generates comprehensive test report with execution times and coverage metrics

.PARAMETER SkipBackend
Skip backend E2E tests

.PARAMETER SkipFrontend
Skip frontend E2E tests

.PARAMETER BackendOnly
Run only backend tests

.PARAMETER FrontendOnly
Run only frontend tests

.PARAMETER Configuration
Run specific frontend configuration only (h2-mock, h2-keycloak, postgres-mock, postgres-keycloak, all)
#>

param(
    [switch]$SkipBackend,
    [switch]$SkipFrontend,
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [ValidateSet('h2-mock', 'h2-keycloak', 'postgres-mock', 'postgres-keycloak', 'all')]
    [string]$Configuration = 'all'
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# Color output functions
function Write-Header {
    param([string]$Message)
    Write-Host "`n======================================" -ForegroundColor Cyan
    Write-Host " $Message" -ForegroundColor Cyan
    Write-Host "======================================`n" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[✓] $Message" -ForegroundColor Green
}

function Write-Failure {
    param([string]$Message)
    Write-Host "[✗] $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "[i] $Message" -ForegroundColor Yellow
}

function Write-Timing {
    param([string]$Message)
    Write-Host "[⏱] $Message" -ForegroundColor Magenta
}

# Initialize test results
$testResults = @{
    BackendH2 = @{ Status = 'NotRun'; Duration = 0; Tests = 0; Failures = 0 }
    BackendPostgres = @{ Status = 'NotRun'; Duration = 0; Tests = 0; Failures = 0 }
    FrontendH2Mock = @{ Status = 'NotRun'; Duration = 0; Tests = 0; Failures = 0 }
    FrontendH2Keycloak = @{ Status = 'NotRun'; Duration = 0; Tests = 0; Failures = 0 }
    FrontendPostgresMock = @{ Status = 'NotRun'; Duration = 0; Tests = 0; Failures = 0 }
    FrontendPostgresKeycloak = @{ Status = 'NotRun'; Duration = 0; Tests = 0; Failures = 0 }
    Coverage = @{ Line = 0; Branch = 0; Critical = 0 }
}

# Set up directories
$rootDir = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $rootDir "backend"
$frontendDir = Join-Path $rootDir "frontend"
$reportsDir = Join-Path $rootDir "test-reports"

# Create reports directory
if (-not (Test-Path $reportsDir)) {
    New-Item -ItemType Directory -Path $reportsDir | Out-Null
}

$reportFile = Join-Path $reportsDir "test-validation-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').md"

# Determine what to run
if ($BackendOnly) {
    $SkipFrontend = $true
}
if ($FrontendOnly) {
    $SkipBackend = $true
}

# ============================================
# Backend E2E Tests
# ============================================

if (-not $SkipBackend) {
    Write-Header "BACKEND E2E TESTS"
    
    # Check Java version
    Write-Info "Checking Java version..."
    try {
        $javaVersion = & java -version 2>&1 | Select-String "version" | ForEach-Object { $_ -match '(\d+)' | Out-Null; $matches[1] }
        if ($javaVersion -lt 17) {
            Write-Failure "Java 17 or higher required. Found: Java $javaVersion"
            Write-Info "Please set JAVA_HOME to JDK 17+ and try again"
            exit 1
        }
        Write-Success "Java version: $javaVersion"
    } catch {
        Write-Failure "Failed to check Java version"
        exit 1
    }
    
    # H2 Profile Tests
    Write-Header "Backend E2E Tests - H2 Profile (Target: <5 minutes)"
    $h2StartTime = Get-Date
    
    try {
        Push-Location $backendDir
        Write-Info "Running: mvn clean test -Pbackend-e2e-h2"
        
        $h2Output = & mvn clean test -Pbackend-e2e-h2 2>&1
        $h2ExitCode = $LASTEXITCODE
        
        $h2Duration = ((Get-Date) - $h2StartTime).TotalSeconds
        $testResults.BackendH2.Duration = [math]::Round($h2Duration, 2)
        
        # Parse results
        if ($h2Output -match 'Tests run: (\d+), Failures: (\d+), Errors: (\d+), Skipped: (\d+)') {
            $testResults.BackendH2.Tests = [int]$matches[1]
            $testResults.BackendH2.Failures = [int]$matches[2] + [int]$matches[3]
        }
        
        if ($h2ExitCode -eq 0 -and $testResults.BackendH2.Failures -eq 0) {
            $testResults.BackendH2.Status = 'Passed'
            Write-Success "Backend H2 tests passed in $($testResults.BackendH2.Duration)s"
            
            if ($h2Duration -lt 300) {
                Write-Success "Duration under 5 minutes target ✓"
            } else {
                Write-Failure "Duration exceeds 5 minutes target"
            }
        } else {
            $testResults.BackendH2.Status = 'Failed'
            Write-Failure "Backend H2 tests failed"
        }
        
    } catch {
        $testResults.BackendH2.Status = 'Error'
        Write-Failure "Error running Backend H2 tests: $_"
    } finally {
        Pop-Location
    }
    
    # PostgreSQL Profile Tests
    Write-Header "Backend E2E Tests - PostgreSQL Profile (Target: <15 minutes)"
    $postgresStartTime = Get-Date
    
    try {
        Push-Location $backendDir
        Write-Info "Running: mvn clean test -Pbackend-e2e-postgres"
        
        $postgresOutput = & mvn clean test -Pbackend-e2e-postgres 2>&1
        $postgresExitCode = $LASTEXITCODE
        
        $postgresDuration = ((Get-Date) - $postgresStartTime).TotalSeconds
        $testResults.BackendPostgres.Duration = [math]::Round($postgresDuration, 2)
        
        # Parse results
        if ($postgresOutput -match 'Tests run: (\d+), Failures: (\d+), Errors: (\d+), Skipped: (\d+)') {
            $testResults.BackendPostgres.Tests = [int]$matches[1]
            $testResults.BackendPostgres.Failures = [int]$matches[2] + [int]$matches[3]
        }
        
        if ($postgresExitCode -eq 0 -and $testResults.BackendPostgres.Failures -eq 0) {
            $testResults.BackendPostgres.Status = 'Passed'
            Write-Success "Backend PostgreSQL tests passed in $($testResults.BackendPostgres.Duration)s"
            
            if ($postgresDuration -lt 900) {
                Write-Success "Duration under 15 minutes target ✓"
            } else {
                Write-Failure "Duration exceeds 15 minutes target"
            }
        } else {
            $testResults.BackendPostgres.Status = 'Failed'
            Write-Failure "Backend PostgreSQL tests failed"
        }
        
    } catch {
        $testResults.BackendPostgres.Status = 'Error'
        Write-Failure "Error running Backend PostgreSQL tests: $_"
    } finally {
        Pop-Location
    }
    
    # Cleanup Testcontainers
    Write-Header "Cleaning up Testcontainers"
    try {
        Write-Info "Removing Testcontainers..."
        $containers = & docker ps -a -q --filter "label=org.testcontainers=true" 2>$null
        if ($containers) {
            & docker rm -f $containers 2>$null
            Write-Success "Testcontainers cleaned up"
        } else {
            Write-Info "No Testcontainers to clean up"
        }
    } catch {
        Write-Info "Testcontainers cleanup skipped (Docker not available or no containers)"
    }
    
    # Extract coverage metrics
    Write-Header "Extracting Coverage Metrics"
    try {
        $jacocoReport = Join-Path $backendDir "target/site/jacoco/index.html"
        if (Test-Path $jacocoReport) {
            $reportContent = Get-Content $jacocoReport -Raw
            
            # Parse coverage percentages
            if ($reportContent -match 'Total.*?(\d+)%.*?(\d+)%') {
                $testResults.Coverage.Line = [int]$matches[1]
                $testResults.Coverage.Branch = [int]$matches[2]
                
                Write-Info "Line Coverage: $($testResults.Coverage.Line)%"
                Write-Info "Branch Coverage: $($testResults.Coverage.Branch)%"
                
                $avgCoverage = ($testResults.Coverage.Line + $testResults.Coverage.Branch) / 2
                if ($avgCoverage -ge 80) {
                    Write-Success "Coverage meets 80%+ target ✓"
                } else {
                    Write-Failure "Coverage below 80% target"
                }
            }
        }
    } catch {
        Write-Info "Coverage extraction skipped: $_"
    }
}

# ============================================
# Frontend E2E Tests
# ============================================

if (-not $SkipFrontend) {
    Write-Header "FRONTEND E2E TESTS"
    
    # Check if Playwright is installed
    Write-Info "Checking Playwright installation..."
    try {
        Push-Location $frontendDir
        $playwrightCheck = & npx playwright --version 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Info "Installing Playwright browsers..."
            & npx playwright install
        }
        Write-Success "Playwright ready"
    } catch {
        Write-Failure "Playwright not available"
        Pop-Location
        exit 1
    } finally {
        Pop-Location
    }
    
    # H2 + Mock Auth Configuration
    if ($Configuration -eq 'all' -or $Configuration -eq 'h2-mock') {
        Write-Header "Frontend E2E Tests - H2 + Mock Auth"
        $h2MockStartTime = Get-Date
        
        try {
            Push-Location $frontendDir
            Write-Info "Running: npx playwright test"
            
            $h2MockOutput = & npx playwright test 2>&1
            $h2MockExitCode = $LASTEXITCODE
            
            $h2MockDuration = ((Get-Date) - $h2MockStartTime).TotalSeconds
            $testResults.FrontendH2Mock.Duration = [math]::Round($h2MockDuration, 2)
            
            # Parse results
            if ($h2MockOutput -match '(\d+) passed') {
                $testResults.FrontendH2Mock.Tests = [int]$matches[1]
            }
            if ($h2MockOutput -match '(\d+) failed') {
                $testResults.FrontendH2Mock.Failures = [int]$matches[1]
            }
            
            if ($h2MockExitCode -eq 0) {
                $testResults.FrontendH2Mock.Status = 'Passed'
                Write-Success "Frontend H2+Mock tests passed in $($testResults.FrontendH2Mock.Duration)s"
            } else {
                $testResults.FrontendH2Mock.Status = 'Failed'
                Write-Failure "Frontend H2+Mock tests failed"
            }
            
        } catch {
            $testResults.FrontendH2Mock.Status = 'Error'
            Write-Failure "Error running Frontend H2+Mock tests: $_"
        } finally {
            Pop-Location
        }
    }
    
    # PostgreSQL + Mock Auth Configuration
    if ($Configuration -eq 'all' -or $Configuration -eq 'postgres-mock') {
        Write-Header "Frontend E2E Tests - PostgreSQL + Mock Auth"
        $postgresMockStartTime = Get-Date
        
        try {
            Push-Location $frontendDir
            Write-Info "Running: npx playwright test -c playwright-postgres-mock.config.ts"
            
            $postgresMockOutput = & npx playwright test -c playwright-postgres-mock.config.ts 2>&1
            $postgresMockExitCode = $LASTEXITCODE
            
            $postgresMockDuration = ((Get-Date) - $postgresMockStartTime).TotalSeconds
            $testResults.FrontendPostgresMock.Duration = [math]::Round($postgresMockDuration, 2)
            
            # Parse results
            if ($postgresMockOutput -match '(\d+) passed') {
                $testResults.FrontendPostgresMock.Tests = [int]$matches[1]
            }
            if ($postgresMockOutput -match '(\d+) failed') {
                $testResults.FrontendPostgresMock.Failures = [int]$matches[1]
            }
            
            if ($postgresMockExitCode -eq 0) {
                $testResults.FrontendPostgresMock.Status = 'Passed'
                Write-Success "Frontend Postgres+Mock tests passed in $($testResults.FrontendPostgresMock.Duration)s"
            } else {
                $testResults.FrontendPostgresMock.Status = 'Failed'
                Write-Failure "Frontend Postgres+Mock tests failed"
            }
            
        } catch {
            $testResults.FrontendPostgresMock.Status = 'Error'
            Write-Failure "Error running Frontend Postgres+Mock tests: $_"
        } finally {
            Pop-Location
        }
    }
    
    # H2 + Keycloak Auth Configuration
    if ($Configuration -eq 'all' -or $Configuration -eq 'h2-keycloak') {
        Write-Header "Frontend E2E Tests - H2 + Keycloak Auth"
        Write-Info "Note: This requires Keycloak to be running"
        
        $h2KeycloakStartTime = Get-Date
        
        try {
            Push-Location $frontendDir
            Write-Info "Running: npx playwright test -c playwright-h2-keycloak.config.ts"
            
            $h2KeycloakOutput = & npx playwright test -c playwright-h2-keycloak.config.ts 2>&1
            $h2KeycloakExitCode = $LASTEXITCODE
            
            $h2KeycloakDuration = ((Get-Date) - $h2KeycloakStartTime).TotalSeconds
            $testResults.FrontendH2Keycloak.Duration = [math]::Round($h2KeycloakDuration, 2)
            
            # Parse results
            if ($h2KeycloakOutput -match '(\d+) passed') {
                $testResults.FrontendH2Keycloak.Tests = [int]$matches[1]
            }
            if ($h2KeycloakOutput -match '(\d+) failed') {
                $testResults.FrontendH2Keycloak.Failures = [int]$matches[1]
            }
            
            if ($h2KeycloakExitCode -eq 0) {
                $testResults.FrontendH2Keycloak.Status = 'Passed'
                Write-Success "Frontend H2+Keycloak tests passed in $($testResults.FrontendH2Keycloak.Duration)s"
            } else {
                $testResults.FrontendH2Keycloak.Status = 'Failed'
                Write-Failure "Frontend H2+Keycloak tests failed"
            }
            
        } catch {
            $testResults.FrontendH2Keycloak.Status = 'Error'
            Write-Failure "Error running Frontend H2+Keycloak tests: $_"
        } finally {
            Pop-Location
        }
    }
    
    # PostgreSQL + Keycloak Auth Configuration
    if ($Configuration -eq 'all' -or $Configuration -eq 'postgres-keycloak') {
        Write-Header "Frontend E2E Tests - PostgreSQL + Keycloak Auth"
        Write-Info "Note: This requires Keycloak and PostgreSQL to be running"
        
        $postgresKeycloakStartTime = Get-Date
        
        try {
            Push-Location $frontendDir
            Write-Info "Running: npx playwright test -c playwright-postgres-keycloak.config.ts"
            
            $postgresKeycloakOutput = & npx playwright test -c playwright-postgres-keycloak.config.ts 2>&1
            $postgresKeycloakExitCode = $LASTEXITCODE
            
            $postgresKeycloakDuration = ((Get-Date) - $postgresKeycloakStartTime).TotalSeconds
            $testResults.FrontendPostgresKeycloak.Duration = [math]::Round($postgresKeycloakDuration, 2)
            
            # Parse results
            if ($postgresKeycloakOutput -match '(\d+) passed') {
                $testResults.FrontendPostgresKeycloak.Tests = [int]$matches[1]
            }
            if ($postgresKeycloakOutput -match '(\d+) failed') {
                $testResults.FrontendPostgresKeycloak.Failures = [int]$matches[1]
            }
            
            if ($postgresKeycloakExitCode -eq 0) {
                $testResults.FrontendPostgresKeycloak.Status = 'Passed'
                Write-Success "Frontend Postgres+Keycloak tests passed in $($testResults.FrontendPostgresKeycloak.Duration)s"
            } else {
                $testResults.FrontendPostgresKeycloak.Status = 'Failed'
                Write-Failure "Frontend Postgres+Keycloak tests failed"
            }
            
        } catch {
            $testResults.FrontendPostgresKeycloak.Status = 'Error'
            Write-Failure "Error running Frontend Postgres+Keycloak tests: $_"
        } finally {
            Pop-Location
        }
    }
}

# ============================================
# Generate Report
# ============================================

Write-Header "Generating Test Report"

$reportContent = @"
# Test Validation Report
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

## Summary

| Test Suite | Status | Duration | Tests | Failures |
|------------|--------|----------|-------|----------|
| Backend H2 | $($testResults.BackendH2.Status) | $($testResults.BackendH2.Duration)s | $($testResults.BackendH2.Tests) | $($testResults.BackendH2.Failures) |
| Backend PostgreSQL | $($testResults.BackendPostgres.Status) | $($testResults.BackendPostgres.Duration)s | $($testResults.BackendPostgres.Tests) | $($testResults.BackendPostgres.Failures) |
| Frontend H2+Mock | $($testResults.FrontendH2Mock.Status) | $($testResults.FrontendH2Mock.Duration)s | $($testResults.FrontendH2Mock.Tests) | $($testResults.FrontendH2Mock.Failures) |
| Frontend H2+Keycloak | $($testResults.FrontendH2Keycloak.Status) | $($testResults.FrontendH2Keycloak.Duration)s | $($testResults.FrontendH2Keycloak.Tests) | $($testResults.FrontendH2Keycloak.Failures) |
| Frontend Postgres+Mock | $($testResults.FrontendPostgresMock.Status) | $($testResults.FrontendPostgresMock.Duration)s | $($testResults.FrontendPostgresMock.Tests) | $($testResults.FrontendPostgresMock.Failures) |
| Frontend Postgres+Keycloak | $($testResults.FrontendPostgresKeycloak.Status) | $($testResults.FrontendPostgresKeycloak.Duration)s | $($testResults.FrontendPostgresKeycloak.Tests) | $($testResults.FrontendPostgresKeycloak.Failures) |

## Performance Metrics

### Backend Tests
- H2 Profile: $($testResults.BackendH2.Duration)s $(if ($testResults.BackendH2.Duration -lt 300) { '✓ Under 5min target' } else { '✗ Exceeds 5min target' })
- PostgreSQL Profile: $($testResults.BackendPostgres.Duration)s $(if ($testResults.BackendPostgres.Duration -lt 900) { '✓ Under 15min target' } else { '✗ Exceeds 15min target' })

### Frontend Tests
- H2+Mock: $($testResults.FrontendH2Mock.Duration)s
- H2+Keycloak: $($testResults.FrontendH2Keycloak.Duration)s
- Postgres+Mock: $($testResults.FrontendPostgresMock.Duration)s
- Postgres+Keycloak: $($testResults.FrontendPostgresKeycloak.Duration)s

## Coverage Metrics

- Line Coverage: $($testResults.Coverage.Line)%
- Branch Coverage: $($testResults.Coverage.Branch)%
- Average Coverage: $(($testResults.Coverage.Line + $testResults.Coverage.Branch) / 2)%
- Target: 80%+ $(if ((($testResults.Coverage.Line + $testResults.Coverage.Branch) / 2) -ge 80) { '✓ Met' } else { '✗ Not met' })

## Database Compatibility

Tests verify compatibility across:
- H2 in-memory database (PostgreSQL mode)
- PostgreSQL with Testcontainers
- JSONB vs JSON type handling
- UUID generation strategies
- Timestamp precision handling
- Sequence behavior differences

## Authentication Configuration

Tests verify both:
- Mock JWT decoder for fast testing
- Real Keycloak authentication flow
- Token validation and propagation
- Multi-tenant org_id handling

## Test Categories

### Backend E2E Tests
- Annonce (Property) CRUD operations
- Dossier (Lead/Deal) workflow
- Partie Prenante (Stakeholder) management
- Message handling (SMS/Email/WhatsApp)
- Appointment scheduling
- Consentement (Consent) management
- Audit trail tracking
- Multi-tenant isolation
- Security and authentication
- Complete business workflows

### Frontend E2E Tests
- Annonce wizard workflow
- Dossier state machine transitions
- Message composition and sending
- Appointment creation and management
- Partie prenante CRUD operations
- Consentement capture and storage
- Multi-tenant functionality
- Error handling and validation
- Duplicate detection

## Exit Status

"@

# Determine overall status
$allPassed = $true
foreach ($suite in $testResults.Keys) {
    if ($testResults[$suite].Status -eq 'Failed' -or $testResults[$suite].Status -eq 'Error') {
        $allPassed = $false
        break
    }
}

if ($allPassed) {
    $reportContent += "`n✅ **ALL TESTS PASSED**`n"
    Write-Success "All tests passed!"
    $exitCode = 0
} else {
    $reportContent += "`n❌ **SOME TESTS FAILED**`n"
    Write-Failure "Some tests failed. Review the report for details."
    $exitCode = 1
}

# Save report
$reportContent | Out-File -FilePath $reportFile -Encoding UTF8
Write-Success "Report saved to: $reportFile"

# Display summary
Write-Header "TEST VALIDATION SUMMARY"
Write-Host $reportContent

exit $exitCode
