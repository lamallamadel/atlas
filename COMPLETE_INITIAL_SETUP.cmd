@echo off
REM ========================================================================
REM Complete Initial Repository Setup
REM ========================================================================
REM 
REM This script completes the repository setup after cloning.
REM 
REM What's already done:
REM   ✓ Frontend dependencies installed (npm packages)
REM   ✓ Toolchains configuration created
REM 
REM What this script will do:
REM   1. Set JAVA_HOME to Java 17
REM   2. Install backend dependencies (Maven)
REM   3. Install Playwright browsers for E2E tests
REM 
REM ========================================================================

echo.
echo ================================================================
echo Initial Repository Setup
echo ================================================================
echo.

REM Set Java 17
set "JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Step 1: Verifying Java 17...
echo JAVA_HOME: %JAVA_HOME%
java -version
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Java 17 not found at %JAVA_HOME%
    echo Please install Java 17 or update the JAVA_HOME path in this script
    pause
    exit /b 1
)
echo ✓ Java 17 verified
echo.

echo Step 2: Installing backend dependencies...
echo Running: mvn clean install -DskipTests
cd backend
mvn clean install -DskipTests
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Backend Maven install failed
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✓ Backend dependencies installed
echo.

echo Step 3: Installing Playwright browsers...
cd frontend
call npm run install-browsers
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Playwright browser installation failed
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✓ Playwright browsers installed
echo.

echo ================================================================
echo Setup Complete!
echo ================================================================
echo.
echo You can now:
echo   - Build backend:    cd backend ^&^& mvn clean package
echo   - Run backend:      cd backend ^&^& mvn spring-boot:run
echo   - Test backend:     cd backend ^&^& mvn test
echo   - Build frontend:   cd frontend ^&^& npm run build
echo   - Run frontend:     cd frontend ^&^& npm start
echo   - Run E2E tests:    cd frontend ^&^& npm run e2e
echo.
echo See AGENTS.md for more commands and information
echo.
pause
