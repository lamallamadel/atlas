@echo off
REM Complete Repository Setup Script
REM This script finishes the initial repository setup by building the backend

echo.
echo ========================================
echo   Complete Repository Setup
echo ========================================
echo.

REM Set Java 17 environment
set "JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo [1/3] Java Environment
echo   JAVA_HOME: %JAVA_HOME%
echo.

REM Build backend
echo [2/3] Building Backend...
cd backend
mvn clean install -DskipTests -gs settings.xml
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Backend build failed
    cd ..
    pause
    exit /b 1
)
cd ..
echo   Backend build: SUCCESS
echo.

REM Install Playwright browsers (optional)
echo [3/3] Installing Playwright Browsers (optional)...
cd frontend
call npx playwright install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo WARNING: Playwright browser installation failed
    echo This is optional - you can install later with: cd frontend ^&^& npx playwright install
)
cd ..
echo.

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Repository is now ready for development.
echo.
echo Next steps:
echo   1. Start backend:  cd backend ^&^& mvn spring-boot:run
echo   2. Start frontend: cd frontend ^&^& npm start
echo.
echo Access points:
echo   - Frontend:  http://localhost:4200
echo   - Backend:   http://localhost:8080
echo   - API Docs:  http://localhost:8080/swagger-ui.html
echo.
pause
