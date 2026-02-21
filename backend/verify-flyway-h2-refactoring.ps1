#!/usr/bin/env pwsh
# Verification script for Flyway H2 refactoring
# Checks configuration files, migration files, and directory structure

Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║ Flyway H2 Refactoring Verification Script                                 ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()
$success = @()

# Check 1: Verify configuration files exist
Write-Host "[1/10] Checking configuration files..." -ForegroundColor Yellow

$configFiles = @(
    "src/main/resources/application-backend-e2e.yml",
    "src/main/resources/application-backend-e2e-h2.yml",
    "src/main/resources/application-backend-e2e-postgres.yml"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        $success += "✓ Configuration file exists: $file"
    } else {
        $errors += "✗ Missing configuration file: $file"
    }
}

# Check 2: Verify H2 config has correct json_type placeholder
Write-Host "[2/10] Checking H2 configuration..." -ForegroundColor Yellow

$h2Config = "src/main/resources/application-backend-e2e-h2.yml"
if (Test-Path $h2Config) {
    $content = Get-Content $h2Config -Raw
    if ($content -match "json_type:\s*JSON") {
        $success += "✓ H2 config uses json_type: JSON"
    } else {
        $errors += "✗ H2 config does not set json_type: JSON"
    }
    
    if ($content -match "classpath:db/migration") {
        $success += "✓ H2 config includes db/migration location"
    } else {
        $errors += "✗ H2 config missing db/migration location"
    }
    
    if ($content -match "migration-h2") {
        $errors += "✗ H2 config still references migration-h2 directory"
    } else {
        $success += "✓ H2 config does not reference migration-h2"
    }
}

# Check 3: Verify PostgreSQL config has correct json_type placeholder
Write-Host "[3/10] Checking PostgreSQL configuration..." -ForegroundColor Yellow

$pgConfig = "src/main/resources/application-backend-e2e-postgres.yml"
if (Test-Path $pgConfig) {
    $content = Get-Content $pgConfig -Raw
    if ($content -match "json_type:\s*JSONB") {
        $success += "✓ PostgreSQL config uses json_type: JSONB"
    } else {
        $errors += "✗ PostgreSQL config does not set json_type: JSONB"
    }
}

# Check 4: Verify main migration directory exists and contains files
Write-Host "[4/10] Checking migration directory structure..." -ForegroundColor Yellow

$migrationDir = "src/main/resources/db/migration"
if (Test-Path $migrationDir) {
    $migrationFiles = Get-ChildItem -Path $migrationDir -Filter "V*.sql" | Measure-Object
    if ($migrationFiles.Count -ge 37) {
        $success += "✓ Migration directory contains $($migrationFiles.Count) migration files"
    } else {
        $warnings += "⚠ Migration directory contains only $($migrationFiles.Count) files (expected 37+)"
    }
} else {
    $errors += "✗ Migration directory not found: $migrationDir"
}

# Check 5: Verify no hardcoded JSONB in migrations
Write-Host "[5/10] Checking for hardcoded JSONB references..." -ForegroundColor Yellow

if (Test-Path $migrationDir) {
    $jsonbFiles = Get-ChildItem -Path $migrationDir -Filter "V*.sql" | 
        Where-Object { (Get-Content $_.FullName -Raw) -match '\bJSONB\b(?!\s*\))' }
    
    if ($jsonbFiles.Count -eq 0) {
        $success += "✓ No hardcoded JSONB found in migrations"
    } else {
        foreach ($file in $jsonbFiles) {
            $errors += "✗ Hardcoded JSONB found in: $($file.Name)"
        }
    }
}

# Check 6: Verify migration-h2 directory status
Write-Host "[6/10] Checking migration-h2 directory..." -ForegroundColor Yellow

$migrationH2Dir = "src/main/resources/db/migration-h2"
if (Test-Path $migrationH2Dir) {
    $h2Files = Get-ChildItem -Path $migrationH2Dir -Filter "V*.sql" -Exclude ".deleted"
    if ($h2Files.Count -eq 0) {
        $success += "✓ migration-h2 directory contains no active migrations"
        $warnings += "⚠ migration-h2 directory can be safely deleted"
    } else {
        $warnings += "⚠ migration-h2 directory contains $($h2Files.Count) files that should be migrated"
    }
} else {
    $success += "✓ migration-h2 directory does not exist (already cleaned up)"
}

# Check 7: Verify test configuration exists
Write-Host "[7/10] Checking test configuration..." -ForegroundColor Yellow

$testConfig = "src/test/java/com/example/backend/config/H2TestConfiguration.java"
if (Test-Path $testConfig) {
    $success += "✓ H2TestConfiguration class exists"
} else {
    $errors += "✗ Missing H2TestConfiguration class"
}

# Check 8: Verify test class exists
Write-Host "[8/10] Checking test class..." -ForegroundColor Yellow

$testClass = "src/test/java/com/example/backend/FlywayMigrationBackendE2ETest.java"
if (Test-Path $testClass) {
    $success += "✓ FlywayMigrationBackendE2ETest class exists"
} else {
    $errors += "✗ Missing FlywayMigrationBackendE2ETest class"
}

# Check 9: Verify Maven profile configuration
Write-Host "[9/10] Checking Maven profile..." -ForegroundColor Yellow

$pomFile = "pom.xml"
if (Test-Path $pomFile) {
    $pomContent = Get-Content $pomFile -Raw
    if ($pomContent -match '<id>backend-e2e-h2</id>') {
        $success += "✓ Maven profile backend-e2e-h2 exists"
    } else {
        $errors += "✗ Maven profile backend-e2e-h2 not found in pom.xml"
    }
    
    if ($pomContent -match 'spring.profiles.active.*backend-e2e,backend-e2e-h2') {
        $success += "✓ Maven profile activates correct Spring profiles"
    } else {
        $warnings += "⚠ Maven profile may not activate correct Spring profiles"
    }
}

# Check 10: Verify documentation exists
Write-Host "[10/10] Checking documentation..." -ForegroundColor Yellow

$docs = @(
    "FLYWAY_H2_TESTING.md",
    "src/main/resources/db/migration/FLYWAY_H2_REFACTORING.md"
)

foreach ($doc in $docs) {
    if (Test-Path $doc) {
        $success += "✓ Documentation exists: $doc"
    } else {
        $warnings += "⚠ Documentation missing: $doc"
    }
}

# Print results
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║ Verification Results                                                       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

if ($success.Count -gt 0) {
    Write-Host "SUCCESS ($($success.Count)):" -ForegroundColor Green
    foreach ($msg in $success) {
        Write-Host "  $msg" -ForegroundColor Green
    }
    Write-Host ""
}

if ($warnings.Count -gt 0) {
    Write-Host "WARNINGS ($($warnings.Count)):" -ForegroundColor Yellow
    foreach ($msg in $warnings) {
        Write-Host "  $msg" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($errors.Count -gt 0) {
    Write-Host "ERRORS ($($errors.Count)):" -ForegroundColor Red
    foreach ($msg in $errors) {
        Write-Host "  $msg" -ForegroundColor Red
    }
    Write-Host ""
}

# Final verdict
Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
if ($errors.Count -eq 0) {
    Write-Host "║ ✓ VERIFICATION PASSED                                                      ║" -ForegroundColor Green
    Write-Host "║                                                                             ║" -ForegroundColor Cyan
    Write-Host "║ Ready to run: mvn clean verify -Pbackend-e2e-h2                            ║" -ForegroundColor Cyan
    $exitCode = 0
} else {
    Write-Host "║ ✗ VERIFICATION FAILED                                                      ║" -ForegroundColor Red
    Write-Host "║                                                                             ║" -ForegroundColor Cyan
    Write-Host "║ Please fix the errors above before running tests.                          ║" -ForegroundColor Cyan
    $exitCode = 1
}
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

exit $exitCode
