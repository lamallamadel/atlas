# Verify Repository Setup Status

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "Repository Setup Verification" -ForegroundColor Cyan
Write-Host "==================================`n" -ForegroundColor Cyan

# Check Frontend
Write-Host "Frontend (npm):" -ForegroundColor Yellow
if (Test-Path "frontend/node_modules/@angular") {
    Write-Host "  ✅ Angular packages installed" -ForegroundColor Green
} else {
    Write-Host "  ❌ Angular NOT installed" -ForegroundColor Red
}

if (Test-Path "frontend/node_modules/@playwright") {
    Write-Host "  ✅ Playwright package installed" -ForegroundColor Green
} else {
    Write-Host "  ❌ Playwright NOT installed" -ForegroundColor Red
}

# Check Backend
Write-Host "`nBackend (Maven):" -ForegroundColor Yellow
if (Test-Path "backend/target") {
    Write-Host "  ✅ Maven build completed" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Maven dependencies not installed" -ForegroundColor Yellow
    Write-Host "     Run: .\complete-backend-setup.bat" -ForegroundColor Yellow
}

# Check Setup Files
Write-Host "`nSetup Files:" -ForegroundColor Yellow
$setupFiles = @(
    "complete-backend-setup.bat",
    "START_HERE.md",
    "INITIAL_SETUP_COMPLETE.md",
    "SETUP_SUMMARY.md"
)

foreach ($file in $setupFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file missing" -ForegroundColor Red
    }
}

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
if (-not (Test-Path "backend/target")) {
    Write-Host "1. Run: .\complete-backend-setup.bat" -ForegroundColor Yellow
    Write-Host "2. Start backend: cd backend && mvn spring-boot:run" -ForegroundColor White
    Write-Host "3. Start frontend: cd frontend && npm start" -ForegroundColor White
} else {
    Write-Host "✅ Setup complete!" -ForegroundColor Green
    Write-Host "Start backend: cd backend && mvn spring-boot:run" -ForegroundColor White
    Write-Host "Start frontend: cd frontend && npm start" -ForegroundColor White
}
Write-Host ""
