@echo off
REM Complete setup script for the repository
REM This script sets up both backend (Maven) and frontend (npm)

echo ============================================================
echo Repository Initial Setup
echo ============================================================
echo.

REM Set JAVA_HOME to Java 17
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

echo Step 1: Setting up Backend (Maven)
echo ------------------------------------------------------------
cd backend
echo Running: mvn clean install -DskipTests
call mvn clean install -DskipTests
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Backend setup failed
    exit /b 1
)
echo ✓ Backend setup complete
echo.

cd ..

echo Step 2: Setting up Frontend (npm)
echo ------------------------------------------------------------
cd frontend
echo Running: npm install
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Frontend setup failed
    exit /b 1
)
echo ✓ Frontend setup complete
echo.

cd ..

echo ============================================================
echo ✓ Setup Complete!
echo ============================================================
echo.
echo You can now:
echo   - Run backend tests: cd backend ^&^& mvn test
echo   - Run frontend tests: cd frontend ^&^& npm test
echo   - Build backend: cd backend ^&^& mvn clean package
echo   - Build frontend: cd frontend ^&^& npm run build
echo.
