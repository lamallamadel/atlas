#!/usr/bin/env pwsh
<#
.SYNOPSIS
Generates a detailed test validation report from test execution results

.DESCRIPTION
This script analyzes test results from Maven Surefire and JaCoCo reports
and generates a comprehensive markdown report with:
- Test execution summary
- Performance metrics
- Coverage analysis
- Failure analysis
- Recommendations

.PARAMETER ReportsDir
Directory containing test reports (default: backend/target)

.PARAMETER OutputFile
Output markdown file (default: test-reports/detailed-report-<timestamp>.md)
#>

param(
    [string]$ReportsDir = "backend\target",
    [string]$OutputFile = ""
)

$ErrorActionPreference = 'Stop'

# Set default output file with timestamp
if ([string]::IsNullOrEmpty($OutputFile)) {
    $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $OutputFile = "test-reports\detailed-report-$timestamp.md"
}

# Create test-reports directory if it doesn't exist
$reportDir = Split-Path -Parent $OutputFile
if (-not (Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir | Out-Null
}

Write-Host "Generating test report from: $ReportsDir" -ForegroundColor Cyan
Write-Host "Output file: $OutputFile" -ForegroundColor Cyan
Write-Host ""

# Initialize report data
$reportData = @{
    GeneratedAt = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    TestResults = @{
        Total = 0
        Passed = 0
        Failed = 0
        Skipped = 0
        Errors = 0
    }
    Performance = @{
        TotalDuration = 0
        AverageDuration = 0
        SlowestTests = @()
    }
    Coverage = @{
        LineRate = 0
        BranchRate = 0
        PackageCoverage = @()
    }
    Failures = @()
}

# ==========================================
# Parse Surefire Reports
# ==========================================

Write-Host "[1/4] Parsing Surefire test results..." -ForegroundColor Yellow

$surefireDir = Join-Path $ReportsDir "surefire-reports"
if (Test-Path $surefireDir) {
    $testResults = Get-ChildItem -Path $surefireDir -Filter "TEST-*.xml" -ErrorAction SilentlyContinue
    
    foreach ($resultFile in $testResults) {
        try {
            [xml]$xml = Get-Content $resultFile.FullName
            $testsuite = $xml.testsuite
            
            $reportData.TestResults.Total += [int]$testsuite.tests
            $reportData.TestResults.Failed += [int]$testsuite.failures
            $reportData.TestResults.Errors += [int]$testsuite.errors
            $reportData.TestResults.Skipped += [int]$testsuite.skipped
            $reportData.Performance.TotalDuration += [decimal]$testsuite.time
            
            # Collect slowest tests
            foreach ($testcase in $testsuite.testcase) {
                $testInfo = @{
                    Name = "$($testcase.classname).$($testcase.name)"
                    Duration = [decimal]$testcase.time
                }
                $reportData.Performance.SlowestTests += $testInfo
            }
            
            # Collect failures
            foreach ($testcase in $testsuite.testcase) {
                if ($testcase.failure -or $testcase.error) {
                    $failureInfo = @{
                        Test = "$($testcase.classname).$($testcase.name)"
                        Type = if ($testcase.failure) { "Failure" } else { "Error" }
                        Message = if ($testcase.failure) { $testcase.failure.message } else { $testcase.error.message }
                        Detail = if ($testcase.failure) { $testcase.failure.'#text' } else { $testcase.error.'#text' }
                    }
                    $reportData.Failures += $failureInfo
                }
            }
        } catch {
            Write-Host "  Warning: Failed to parse $($resultFile.Name): $_" -ForegroundColor Yellow
        }
    }
    
    $reportData.TestResults.Passed = $reportData.TestResults.Total - 
                                      $reportData.TestResults.Failed - 
                                      $reportData.TestResults.Errors - 
                                      $reportData.TestResults.Skipped
    
    if ($reportData.TestResults.Total -gt 0) {
        $reportData.Performance.AverageDuration = $reportData.Performance.TotalDuration / $reportData.TestResults.Total
    }
    
    Write-Host "  Found $($reportData.TestResults.Total) tests" -ForegroundColor Green
} else {
    Write-Host "  Surefire reports not found at: $surefireDir" -ForegroundColor Red
}

# ==========================================
# Parse JaCoCo Coverage Report
# ==========================================

Write-Host "[2/4] Parsing JaCoCo coverage report..." -ForegroundColor Yellow

$jacocoXml = Join-Path $ReportsDir "site\jacoco\jacoco.xml"
if (Test-Path $jacocoXml) {
    try {
        [xml]$coverageXml = Get-Content $jacocoXml
        
        # Calculate overall coverage
        $report = $coverageXml.report
        $lineCoverage = $report.counter | Where-Object { $_.type -eq 'LINE' }
        $branchCoverage = $report.counter | Where-Object { $_.type -eq 'BRANCH' }
        
        if ($lineCoverage) {
            $covered = [int]$lineCoverage.covered
            $missed = [int]$lineCoverage.missed
            $total = $covered + $missed
            if ($total -gt 0) {
                $reportData.Coverage.LineRate = [math]::Round(($covered / $total) * 100, 2)
            }
        }
        
        if ($branchCoverage) {
            $covered = [int]$branchCoverage.covered
            $missed = [int]$branchCoverage.missed
            $total = $covered + $missed
            if ($total -gt 0) {
                $reportData.Coverage.BranchRate = [math]::Round(($covered / $total) * 100, 2)
            }
        }
        
        # Package-level coverage
        foreach ($package in $report.package) {
            $packageName = $package.name
            $packageLine = $package.counter | Where-Object { $_.type -eq 'LINE' }
            
            if ($packageLine) {
                $covered = [int]$packageLine.covered
                $missed = [int]$packageLine.missed
                $total = $covered + $missed
                if ($total -gt 0) {
                    $coverage = [math]::Round(($covered / $total) * 100, 2)
                    $reportData.Coverage.PackageCoverage += @{
                        Package = $packageName
                        Coverage = $coverage
                        Covered = $covered
                        Missed = $missed
                    }
                }
            }
        }
        
        Write-Host "  Line Coverage: $($reportData.Coverage.LineRate)%" -ForegroundColor Green
        Write-Host "  Branch Coverage: $($reportData.Coverage.BranchRate)%" -ForegroundColor Green
    } catch {
        Write-Host "  Warning: Failed to parse JaCoCo XML: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "  JaCoCo XML report not found at: $jacocoXml" -ForegroundColor Yellow
}

# ==========================================
# Sort and Filter Data
# ==========================================

Write-Host "[3/4] Processing data..." -ForegroundColor Yellow

# Get top 10 slowest tests
$reportData.Performance.SlowestTests = $reportData.Performance.SlowestTests | 
    Sort-Object -Property Duration -Descending | 
    Select-Object -First 10

# Sort packages by coverage (lowest first)
$reportData.Coverage.PackageCoverage = $reportData.Coverage.PackageCoverage |
    Sort-Object -Property Coverage

# ==========================================
# Generate Markdown Report
# ==========================================

Write-Host "[4/4] Generating markdown report..." -ForegroundColor Yellow

$markdown = @"
# Test Validation Report

**Generated**: $($reportData.GeneratedAt)

---

## Executive Summary

| Metric | Value | Status |
|--------|-------|--------|
| Total Tests | $($reportData.TestResults.Total) | - |
| Passed | $($reportData.TestResults.Passed) | $(if ($reportData.TestResults.Failed -eq 0) { '✅' } else { '❌' }) |
| Failed | $($reportData.TestResults.Failed) | $(if ($reportData.TestResults.Failed -eq 0) { '✅' } else { '❌' }) |
| Errors | $($reportData.TestResults.Errors) | $(if ($reportData.TestResults.Errors -eq 0) { '✅' } else { '❌' }) |
| Skipped | $($reportData.TestResults.Skipped) | - |
| Pass Rate | $(if ($reportData.TestResults.Total -gt 0) { [math]::Round(($reportData.TestResults.Passed / $reportData.TestResults.Total) * 100, 2) } else { 0 })% | $(if ($reportData.TestResults.Failed -eq 0) { '✅' } else { '❌' }) |
| Line Coverage | $($reportData.Coverage.LineRate)% | $(if ($reportData.Coverage.LineRate -ge 80) { '✅' } else { '⚠️' }) |
| Branch Coverage | $($reportData.Coverage.BranchRate)% | $(if ($reportData.Coverage.BranchRate -ge 80) { '✅' } else { '⚠️' }) |
| Execution Time | $([math]::Round($reportData.Performance.TotalDuration, 2))s | - |

---

## Test Results

### Summary
- **Total Tests**: $($reportData.TestResults.Total)
- **Passed**: $($reportData.TestResults.Passed) ($(if ($reportData.TestResults.Total -gt 0) { [math]::Round(($reportData.TestResults.Passed / $reportData.TestResults.Total) * 100, 2) } else { 0 })%)
- **Failed**: $($reportData.TestResults.Failed)
- **Errors**: $($reportData.TestResults.Errors)
- **Skipped**: $($reportData.TestResults.Skipped)

### Status
$(if ($reportData.TestResults.Failed -eq 0 -and $reportData.TestResults.Errors -eq 0) {
    "✅ **ALL TESTS PASSED**"
} else {
    "❌ **TESTS FAILED** - See failure details below"
})

---

## Performance Metrics

### Overall Performance
- **Total Execution Time**: $([math]::Round($reportData.Performance.TotalDuration, 2)) seconds
- **Average Test Duration**: $([math]::Round($reportData.Performance.AverageDuration, 3)) seconds

### Slowest Tests (Top 10)

| Rank | Test | Duration |
|------|------|----------|
"@

$rank = 1
foreach ($test in $reportData.Performance.SlowestTests) {
    $markdown += "`n| $rank | $($test.Name) | $([math]::Round($test.Duration, 3))s |"
    $rank++
}

$markdown += @"


---

## Coverage Analysis

### Overall Coverage
- **Line Coverage**: $($reportData.Coverage.LineRate)% $(if ($reportData.Coverage.LineRate -ge 80) { '✅ Target Met (80%+)' } else { '⚠️ Below Target (80%+)' })
- **Branch Coverage**: $($reportData.Coverage.BranchRate)% $(if ($reportData.Coverage.BranchRate -ge 80) { '✅ Target Met (80%+)' } else { '⚠️ Below Target (80%+)' })
- **Average Coverage**: $([math]::Round(($reportData.Coverage.LineRate + $reportData.Coverage.BranchRate) / 2, 2))%

### Package Coverage

| Package | Coverage | Covered | Missed | Status |
|---------|----------|---------|--------|--------|
"@

foreach ($pkg in $reportData.Coverage.PackageCoverage) {
    $status = if ($pkg.Coverage -ge 80) { '✅' } elseif ($pkg.Coverage -ge 50) { '⚠️' } else { '❌' }
    $markdown += "`n| $($pkg.Package) | $($pkg.Coverage)% | $($pkg.Covered) | $($pkg.Missed) | $status |"
}

$markdown += @"


### Coverage Recommendations

"@

$lowCoveragePackages = $reportData.Coverage.PackageCoverage | Where-Object { $_.Coverage -lt 80 }
if ($lowCoveragePackages.Count -gt 0) {
    $markdown += "`n**⚠️ Packages Below 80% Coverage:**`n"
    foreach ($pkg in $lowCoveragePackages) {
        $markdown += "`n- **$($pkg.Package)**: $($pkg.Coverage)% - Add $($pkg.Missed) more line(s) of test coverage"
    }
} else {
    $markdown += "`n✅ All packages meet the 80%+ coverage target!"
}

$markdown += @"


---

"@

# ==========================================
# Failure Analysis
# ==========================================

if ($reportData.Failures.Count -gt 0) {
    $markdown += @"
## Failure Analysis

### Failed Tests ($($reportData.Failures.Count))

"@
    
    $failureNum = 1
    foreach ($failure in $reportData.Failures) {
        $markdown += @"

#### $failureNum. $($failure.Test)

**Type**: $($failure.Type)

**Message**:
``````
$($failure.Message)
``````

**Details**:
``````
$($failure.Detail)
``````

---

"@
        $failureNum++
    }
} else {
    $markdown += @"
## Failure Analysis

✅ **No test failures detected!**

---

"@
}

# ==========================================
# Recommendations
# ==========================================

$markdown += @"
## Recommendations

"@

$recommendations = @()

if ($reportData.TestResults.Failed -gt 0 -or $reportData.TestResults.Errors -gt 0) {
    $recommendations += "🔴 **CRITICAL**: Fix $($reportData.TestResults.Failed + $reportData.TestResults.Errors) failing test(s) before proceeding"
}

if ($reportData.Coverage.LineRate -lt 80) {
    $gap = 80 - $reportData.Coverage.LineRate
    $recommendations += "⚠️ **COVERAGE**: Line coverage is $($reportData.Coverage.LineRate)%. Increase by $([math]::Round($gap, 2))% to meet 80% target"
}

if ($reportData.Coverage.BranchRate -lt 80) {
    $gap = 80 - $reportData.Coverage.BranchRate
    $recommendations += "⚠️ **COVERAGE**: Branch coverage is $($reportData.Coverage.BranchRate)%. Increase by $([math]::Round($gap, 2))% to meet 80% target"
}

$slowTests = $reportData.Performance.SlowestTests | Where-Object { $_.Duration -gt 5 }
if ($slowTests.Count -gt 0) {
    $recommendations += "⚠️ **PERFORMANCE**: $($slowTests.Count) test(s) take longer than 5 seconds. Consider optimization"
}

if ($reportData.Performance.TotalDuration -gt 300) {
    $recommendations += "⚠️ **PERFORMANCE**: Total execution time is $([math]::Round($reportData.Performance.TotalDuration, 2))s (>5 min target). Optimize slow tests"
}

if ($recommendations.Count -eq 0) {
    $markdown += @"

✅ **All targets met!** No recommendations at this time.

### Current Status
- All tests passing
- Coverage above 80% target
- Performance within acceptable range

"@
} else {
    foreach ($rec in $recommendations) {
        $markdown += "`n$rec`n"
    }
}

$markdown += @"


---

## Next Steps

1. **Review Results**: Check all sections above for issues
2. **Address Failures**: Fix any failing tests (Priority: Critical)
3. **Improve Coverage**: Add tests for uncovered code paths
4. **Optimize Performance**: Refactor slow tests if needed
5. **Commit Changes**: Push validated code once all targets are met

---

## Additional Resources

- **Detailed Coverage Report**: `backend/target/site/jacoco/index.html`
- **Surefire Reports**: `backend/target/surefire-reports/`
- **Test Validation Guide**: `RUN_FULL_TEST_VALIDATION.md`
- **Known Issues**: `KNOWN_ISSUES.md`

---

*Report generated by: generate-test-report.ps1*
*Timestamp: $($reportData.GeneratedAt)*
"@

# ==========================================
# Save Report
# ==========================================

$markdown | Out-File -FilePath $OutputFile -Encoding UTF8

Write-Host ""
Write-Host "Report generated successfully!" -ForegroundColor Green
Write-Host "Location: $OutputFile" -ForegroundColor Cyan
Write-Host ""

# Display summary
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Tests: $($reportData.TestResults.Passed)/$($reportData.TestResults.Total) passed" -ForegroundColor $(if ($reportData.TestResults.Failed -eq 0) { 'Green' } else { 'Red' })
Write-Host "  Coverage: $($reportData.Coverage.LineRate)% line, $($reportData.Coverage.BranchRate)% branch" -ForegroundColor $(if ($reportData.Coverage.LineRate -ge 80 -and $reportData.Coverage.BranchRate -ge 80) { 'Green' } else { 'Yellow' })
Write-Host "  Duration: $([math]::Round($reportData.Performance.TotalDuration, 2))s" -ForegroundColor White
Write-Host ""

# Open report if all tests passed
if ($reportData.TestResults.Failed -eq 0 -and $reportData.TestResults.Errors -eq 0) {
    Write-Host "Opening report..." -ForegroundColor Green
    Start-Process $OutputFile
}

# Return exit code based on test results
if ($reportData.TestResults.Failed -eq 0 -and $reportData.TestResults.Errors -eq 0) {
    exit 0
} else {
    exit 1
}
