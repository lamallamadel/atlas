#!/usr/bin/env pwsh
# Migration JSONB Audit Verification Script
# This script verifies the audit findings and checks migration status

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration JSONB Audit Verification Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$migrationPath = "backend/src/main/resources/db/migration"

# Check if running from correct directory
if (-not (Test-Path $migrationPath)) {
    Write-Host "❌ Error: Must be run from repository root" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    Write-Host "Expected to find: $migrationPath" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Running from correct directory" -ForegroundColor Green
Write-Host ""

# Function to count migrations
function Get-MigrationCount {
    param(
        [string]$Pattern,
        [string]$Description
    )
    
    $files = Get-ChildItem -Path $migrationPath -Filter "V*.sql" | 
        Where-Object { $_.Name -match $Pattern }
    
    Write-Host "$Description`: $($files.Count)" -ForegroundColor White
    return $files.Count
}

# Function to search for pattern in migrations
function Search-InMigrations {
    param(
        [string]$Pattern,
        [string]$MigrationPattern,
        [string]$Description
    )
    
    Write-Host "`n$Description`:" -ForegroundColor Yellow
    
    $results = Get-ChildItem -Path $migrationPath -Filter "V*.sql" | 
        Where-Object { $_.Name -match $MigrationPattern } | 
        Select-String -Pattern $Pattern -CaseSensitive
    
    if ($results) {
        $results | ForEach-Object {
            Write-Host "  📄 $($_.Filename):$($_.LineNumber) - $($_.Line.Trim())" -ForegroundColor White
        }
        return $results.Count
    } else {
        Write-Host "  ✅ No matches found" -ForegroundColor Green
        return 0
    }
}

# Section 1: Migration Counts
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "SECTION 1: Migration Inventory" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$v1_37_count = Get-MigrationCount -Pattern '^V([1-9]|[1-2][0-9]|3[0-7])__' -Description "Migrations V1-V37 (audit scope)"
$v38_plus_count = Get-MigrationCount -Pattern '^V(3[8-9]|[4-9][0-9]|1[0-9]{2})__' -Description "Migrations V38+ (corrections)"
$total_count = Get-MigrationCount -Pattern '^V[0-9]+__' -Description "Total migrations"

# Section 2: Hardcoded JSONB in V1-V37
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "SECTION 2: Hardcoded JSONB Issues (V1-V37)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$jsonb_count = Search-InMigrations -Pattern "JSONB" -MigrationPattern '^V([1-9]|[1-2][0-9]|3[0-7])__' -Description "Hardcoded JSONB found in V1-V37"

# Section 3: Correct Usage of ${json_type}
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "SECTION 3: Correct Placeholder Usage" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$placeholder_count = Search-InMigrations -Pattern '\$\{json_type\}' -MigrationPattern '^V[0-9]+__' -Description "Correct \${json_type} usage found"

# Section 4: Expected Audit Results
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "SECTION 4: Audit Validation" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host "`nExpected Results (from audit):" -ForegroundColor Yellow
Write-Host "  - Migrations V1-V37: 37" -ForegroundColor White
Write-Host "  - Hardcoded JSONB occurrences: 8" -ForegroundColor White
Write-Host "  - Migrations with issues: 4 (V34, V35, V36, V37)" -ForegroundColor White

Write-Host "`nActual Results:" -ForegroundColor Yellow
Write-Host "  - Migrations V1-V37: $v1_37_count" -ForegroundColor White
Write-Host "  - Hardcoded JSONB occurrences: $jsonb_count" -ForegroundColor White

# Validation
$all_checks_passed = $true

if ($v1_37_count -eq 37) {
    Write-Host "  ✅ Migration count matches" -ForegroundColor Green
} else {
    Write-Host "  ❌ Migration count mismatch!" -ForegroundColor Red
    $all_checks_passed = $false
}

if ($jsonb_count -eq 8) {
    Write-Host "  ✅ JSONB occurrence count matches" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  JSONB occurrence count differs (expected: 8, found: $jsonb_count)" -ForegroundColor Yellow
    Write-Host "     This may indicate migrations have been fixed or new issues found" -ForegroundColor Yellow
}

# Section 5: Correction Migrations Status
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "SECTION 5: Correction Migrations (V38-V41)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$correction_migrations = @{
    "V38" = "Fix user_preferences table (3 columns)"
    "V39" = "Fix filter_preset table (1 column)"
    "V40" = "Fix comment table (1 column)"
    "V41" = "Fix suggestion_template and message_template tables (2 columns)"
}

Write-Host ""
foreach ($version in $correction_migrations.Keys | Sort-Object) {
    $file = Get-ChildItem -Path $migrationPath -Filter "${version}__*.sql" -ErrorAction SilentlyContinue
    if ($file) {
        Write-Host "  ✅ $version`: $($correction_migrations[$version]) - EXISTS" -ForegroundColor Green
        Write-Host "     File: $($file.Name)" -ForegroundColor Gray
    } else {
        Write-Host "  ⏳ $version`: $($correction_migrations[$version]) - NOT CREATED YET" -ForegroundColor Yellow
    }
}

# Section 6: Audit Documentation Check
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "SECTION 6: Audit Documentation" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$audit_docs = @(
    "MIGRATION_JSONB_AUDIT.md",
    "MIGRATION_JSONB_AUDIT.csv",
    "MIGRATION_JSONB_AUDIT.json",
    "README_JSONB_AUDIT.md",
    "INDEX_AUDIT_REPORTS.md"
)

Write-Host ""
foreach ($doc in $audit_docs) {
    $file = Get-ChildItem -Path $migrationPath -Filter $doc -ErrorAction SilentlyContinue
    if ($file) {
        $size = [math]::Round($file.Length / 1KB, 2)
        Write-Host "  ✅ $doc - $size KB" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $doc - MISSING" -ForegroundColor Red
        $all_checks_passed = $false
    }
}

# Check root summary
$root_summary = "MIGRATION_JSONB_AUDIT_SUMMARY.md"
if (Test-Path $root_summary) {
    $size = [math]::Round((Get-Item $root_summary).Length / 1KB, 2)
    Write-Host "  ✅ $root_summary (root) - $size KB" -ForegroundColor Green
} else {
    Write-Host "  ❌ $root_summary (root) - MISSING" -ForegroundColor Red
    $all_checks_passed = $false
}

# Final Summary
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "FINAL SUMMARY" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

if ($jsonb_count -eq 0) {
    Write-Host "🎉 SUCCESS: All migrations have been fixed!" -ForegroundColor Green
    Write-Host "   No hardcoded JSONB found in any migrations." -ForegroundColor Green
} elseif ($jsonb_count -eq 8) {
    Write-Host "⚠️  ATTENTION: Hardcoded JSONB issues found as documented in audit" -ForegroundColor Yellow
    Write-Host "   Expected issues in V34, V35, V36, V37" -ForegroundColor Yellow
    Write-Host "   Action: Create correction migrations V38-V41" -ForegroundColor Yellow
} else {
    Write-Host "ℹ️  INFO: Hardcoded JSONB count differs from audit baseline" -ForegroundColor Cyan
    Write-Host "   Found: $jsonb_count occurrences (expected: 8 or 0)" -ForegroundColor Cyan
    Write-Host "   This may indicate partial fixes or new migrations" -ForegroundColor Cyan
}

Write-Host ""
if ($all_checks_passed) {
    Write-Host "✅ All documentation checks passed" -ForegroundColor Green
} else {
    Write-Host "❌ Some documentation files are missing" -ForegroundColor Red
}

Write-Host ""
Write-Host "For detailed audit information, see:" -ForegroundColor Cyan
Write-Host "  - Quick Reference: backend/src/main/resources/db/migration/README_JSONB_AUDIT.md" -ForegroundColor White
Write-Host "  - Full Report: backend/src/main/resources/db/migration/MIGRATION_JSONB_AUDIT.md" -ForegroundColor White
Write-Host "  - Summary: MIGRATION_JSONB_AUDIT_SUMMARY.md" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Exit code
if ($all_checks_passed -and ($jsonb_count -eq 0 -or $jsonb_count -eq 8)) {
    exit 0
} else {
    exit 1
}
