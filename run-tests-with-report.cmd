@echo off
REM ============================================
REM Complete Test Validation with Report
REM Runs tests and generates comprehensive report
REM ============================================

setlocal enabledelayedexpansion

echo ============================================
echo Complete Test Validation Suite
echo With Automated Report Generation
echo ============================================
echo.

REM Set Java 17 environment
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

echo Select test profile:
echo   1. H2 only (fast, ~5 minutes)
echo   2. PostgreSQL only (~15 minutes, requires Docker)
echo   3. Both H2 and PostgreSQL (complete validation, ~20 minutes)
echo.
set /p CHOICE="Enter choice (1-3): "

if "%CHOICE%"=="1" (
    set PROFILE=h2
    set TARGET_TIME=5
) else if "%CHOICE%"=="2" (
    set PROFILE=postgres
    set TARGET_TIME=15
) else if "%CHOICE%"=="3" (
    set PROFILE=both
    set TARGET_TIME=20
) else (
    echo Invalid choice. Exiting.
    exit /b 1
)

echo.
echo ============================================
echo Running Test Profile: %PROFILE%
echo Target Time: ^<%TARGET_TIME% minutes
echo ============================================
echo.

pause

REM Navigate to backend
cd /d "%~dp0backend"

REM Run tests based on choice
if "%PROFILE%"=="h2" (
    echo [INFO] Running H2 tests...
    call mvn clean verify -s .\settings.xml -t .\toolchains.xml -Pbackend-e2e-h2
    set EXIT_CODE=!errorlevel!
) else if "%PROFILE%"=="postgres" (
    echo [INFO] Running PostgreSQL tests...
    call mvn clean verify -s .\settings.xml -t .\toolchains.xml -Pbackend-e2e-postgres
    set EXIT_CODE=!errorlevel!
) else (
    echo [INFO] Running H2 tests...
    call mvn clean verify -s .\settings.xml -t .\toolchains.xml -Pbackend-e2e-h2
    set H2_EXIT=!errorlevel!
    
    echo.
    echo [INFO] Running PostgreSQL tests...
    call mvn verify -s .\settings.xml -t .\toolchains.xml -Pbackend-e2e-postgres
    set PG_EXIT=!errorlevel!
    
    if !H2_EXIT! neq 0 set EXIT_CODE=1
    if !PG_EXIT! neq 0 set EXIT_CODE=1
    if !H2_EXIT! equ 0 if !PG_EXIT! equ 0 set EXIT_CODE=0
)

cd /d "%~dp0"

echo.
echo ============================================
echo Generating Test Report
echo ============================================
echo.

REM Generate detailed report
powershell -ExecutionPolicy Bypass -File ".\scripts\generate-test-report.ps1"

echo.
echo ============================================
echo Test Validation Complete
echo ============================================
echo.

if %EXIT_CODE% equ 0 (
    echo [SUCCESS] All tests passed! ✓
    echo.
    echo Reports available:
    echo   - Detailed Report: test-reports\detailed-report-*.md
    echo   - Coverage Report: backend\target\site\jacoco\index.html
    echo   - Test Reports: backend\target\surefire-reports\
    echo.
) else (
    echo [FAILURE] Some tests failed! ✗
    echo.
    echo Please review:
    echo   - Detailed Report: test-reports\detailed-report-*.md
    echo   - Test Reports: backend\target\surefire-reports\
    echo   - Known Issues: KNOWN_ISSUES.md
    echo.
)

pause
exit /b %EXIT_CODE%
