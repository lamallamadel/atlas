@echo off
REM ============================================
REM Backend E2E Test Suite - PostgreSQL Profile
REM Target: Zero failures, <15 minutes execution
REM Requires: Docker for Testcontainers
REM ============================================

setlocal

echo ============================================
echo Backend E2E Tests - PostgreSQL Profile
echo Target: Zero failures, ^<15 minutes
echo Requires: Docker running
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

REM Verify Docker is running
echo [INFO] Checking Docker status...
docker ps >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running or not accessible
    echo [ERROR] Please start Docker Desktop and try again
    exit /b 1
)
echo [SUCCESS] Docker is running
echo.

REM Check if port 5432 is available
echo [INFO] Checking port 5432 availability...
netstat -ano | findstr ":5432" >nul
if not errorlevel 1 (
    echo [WARNING] Port 5432 is in use
    echo [WARNING] Testcontainers will use a random port
    echo.
)

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

REM Run PostgreSQL tests with timing
echo [INFO] Running PostgreSQL E2E tests...
echo [INFO] Start time: %time%
echo [INFO] This may take up to 15 minutes...
echo.

set START_TIME=%time%

call mvn verify -s .\settings.xml -t .\toolchains.xml -Pbackend-e2e-postgres

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
) else (
    echo [FAILURE] Tests failed with exit code: %TEST_EXIT_CODE%
    echo.
    echo Check test reports at:
    echo   backend\target\surefire-reports\
    echo.
)

REM Cleanup Testcontainers
echo [INFO] Cleaning up Testcontainers...
for /f "tokens=*" %%i in ('docker ps -a -q --filter "label=org.testcontainers=true" 2^>nul') do (
    echo [INFO] Removing container %%i
    docker rm -f %%i >nul 2>&1
)
echo [SUCCESS] Testcontainers cleaned up
echo.

echo To view detailed test results:
echo   - Surefire reports: backend\target\surefire-reports\
echo   - Coverage report: backend\target\site\jacoco\index.html
echo.

if %TEST_EXIT_CODE% equ 0 (
    echo Opening coverage report...
    start "" "target\site\jacoco\index.html"
)

cd /d "%~dp0"
exit /b %TEST_EXIT_CODE%
