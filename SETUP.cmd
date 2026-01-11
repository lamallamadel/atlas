@echo off
REM Complete Initial Setup Script for Newly Cloned Repository
REM Run this script from the repository root directory
REM Usage: SETUP.cmd

echo ========================================
echo   Repository Initial Setup
echo ========================================
echo.

REM Set Java 17
echo [1/4] Setting JAVA_HOME to Java 17...
set "JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"

REM Verify Java version
echo [1/4] Verifying Java version...
java -version
if errorlevel 1 (
    echo ERROR: Java 17 not found at %JAVA_HOME%
    echo Please verify the Java 17 installation path.
    exit /b 1
)
echo OK Java 17 verified
echo.

REM Backend Maven install
echo [2/4] Installing backend dependencies (Maven)...
echo This may take several minutes on first run...
cd backend
call mvn clean install -DskipTests
if errorlevel 1 (
    echo ERROR: Backend Maven install failed!
    echo Please check the error messages above.
    cd ..
    exit /b 1
)
cd ..
echo OK Backend dependencies installed
echo.

REM Frontend npm install
echo [3/4] Installing frontend dependencies (npm)...
echo This may take several minutes...
cd frontend
call npm install
if errorlevel 1 (
    echo ERROR: Frontend npm install failed!
    echo Please check the error messages above.
    cd ..
    exit /b 1
)
cd ..
echo OK Frontend dependencies installed
echo.

REM Playwright browsers
echo [4/4] Installing Playwright browsers...
cd frontend
call npx playwright install
if errorlevel 1 (
    echo WARNING: Playwright browser installation failed!
    echo You can install them later with: cd frontend ^&^& npx playwright install
) else (
    echo OK Playwright browsers installed
)
cd ..
echo.

REM Success message
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo You can now:
echo   * Build backend:     cd backend ^&^& mvn clean package
echo   * Test backend:      cd backend ^&^& mvn test
echo   * Run backend:       cd backend ^&^& mvn spring-boot:run
echo   * Test frontend E2E: cd frontend ^&^& npm run e2e
echo.
echo See AGENTS.md for more commands and options.
