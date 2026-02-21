Write-Host "🔍 Running pre-commit accessibility checks..." -ForegroundColor Cyan

Push-Location frontend

$serverRunning = Get-NetTCPConnection -LocalPort 4200 -State Listen -ErrorAction SilentlyContinue

if (-not $serverRunning) {
    Write-Host "⚠️  Warning: Development server not running on port 4200" -ForegroundColor Yellow
    Write-Host "Skipping accessibility checks. To enable, run 'npm start' in another terminal." -ForegroundColor Yellow
    Pop-Location
    exit 0
}

npm run a11y:pre-commit

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Accessibility violations detected!" -ForegroundColor Red
    Write-Host "Please fix the violations or run without pre-commit checks using:" -ForegroundColor Yellow
    Write-Host "  git commit --no-verify" -ForegroundColor Yellow
    Pop-Location
    exit 1
}

Write-Host "✅ Pre-commit checks passed!" -ForegroundColor Green
Pop-Location
