@echo off
REM ============================================
REM Backend E2E Test Suite - H2 Profile
REM Target: Zero failures, <5 minutes execution
REM ============================================

setlocal

echo ============================================
echo Backend E2E Tests - H2 Profile
echo Target: Zero failures, ^<5 minutes
echo ============================================
echo.

REM Set Java 17 environment
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

REM Verify Java version
echo [INFO] Checking Java version...
java -version 2>&1 | findstr /C:"version" || (
    echo [ERROR] Java not found or not accessible
    exit /b 1
)
echo.

REM Navigate to backend directory
cd /d "%~dp0backend"
if errorlevel 1 (
    echo [ERROR] Failed to navigate to backend directory
    exit /b 1
)

REM Clean previous build artifacts
echo [INFO] Cleaning previous build...
call mvn clean -q
echo.

REM Run H2 tests with timing
echo [INFO] Running H2 E2E tests...
echo [INFO] Start time: %time%
echo.

set START_TIME=%time%

call mvn verify -s .\settings.xml -t .\toolchains.xml -Pbackend-e2e-h2

set TEST_EXIT_CODE=%errorlevel%
set END_TIME=%time%

echo.
echo ============================================
echo Test Execution Complete
echo ============================================
echo Start time: %START_TIME%
echo End time:   %END_TIME%
echo.

if %TEST_EXIT_CODE% equ 0 (
    echo [SUCCESS] All tests passed!
    echo.
    echo Coverage report available at:
    echo   backend\target\site\jacoco\index.html
    echo.
    echo Opening coverage report...
    start "" "target\site\jacoco\index.html"
) else (
    echo [FAILURE] Tests failed with exit code: %TEST_EXIT_CODE%
    echo.
    echo Check test reports at:
    echo   backend\target\surefire-reports\
    echo.
)

echo.
echo To view detailed test results:
echo   - Surefire reports: backend\target\surefire-reports\
echo   - Coverage report: backend\target\site\jacoco\index.html
echo.

cd /d "%~dp0"
exit /b %TEST_EXIT_CODE%
