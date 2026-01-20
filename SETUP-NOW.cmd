@echo off
REM ============================================================================
REM  Initial Repository Setup Script
REM  This script sets up the backend and frontend after cloning the repository
REM ============================================================================

echo.
echo ============================================================================
echo   Initial Repository Setup
echo ============================================================================
echo.
echo This script will:
echo   1. Build the backend with Maven (using Java 17)
echo   2. Install frontend dependencies with npm
echo.
echo This may take several minutes on first run...
echo.
pause

REM Configure Java 17 for this session
set "JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo [Step 1/2] Building backend...
echo.
cd backend
call mvn clean install -DskipTests
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ============================================================================
    echo   Backend Build Failed!
    echo ============================================================================
    echo.
    echo Please check the error messages above.
    echo.
    cd ..
    pause
    exit /b 1
)
cd ..
echo.
echo [OK] Backend build completed successfully
echo.

echo [Step 2/2] Installing frontend dependencies...
echo.
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ============================================================================
    echo   Frontend Install Failed!
    echo ============================================================================
    echo.
    echo Please check the error messages above.
    echo.
    cd ..
    pause
    exit /b 1
)
cd ..
echo.
echo [OK] Frontend dependencies installed successfully
echo.

echo ============================================================================
echo   Setup Complete!
echo ============================================================================
echo.
echo The repository is now ready for development.
echo.
echo Quick Start Commands:
echo   - Run backend:    cd backend ^&^& mvn spring-boot:run
echo   - Run frontend:   cd frontend ^&^& npm start
echo   - Run tests:      cd backend ^&^& mvn test
echo   - E2E tests:      cd frontend ^&^& npm run e2e
echo.
echo For more information, see:
echo   - AGENTS.md (development guide)
echo   - SETUP.md (detailed setup instructions)
echo.
pause
