@echo off
REM Complete Repository Setup
REM Run this script to complete the backend setup

echo ============================================================
echo Repository Setup
echo ============================================================
echo.
echo Frontend: Already completed (npm install done)
echo Backend: Running Maven install with Java 17...
echo.

cd backend
call setup.cmd
cd ..

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo ✓ Setup Complete!
    echo ============================================================
    echo.
    echo You can now run build, lint, and test commands:
    echo   Backend build:  cd backend  then  mvn clean package
    echo   Backend test:   cd backend  then  mvn test
    echo   Frontend build: cd frontend  then  npm run build
    echo   Frontend test:  cd frontend  then  npm test
    echo.
) else (
    echo.
    echo ============================================================
    echo ✗ Setup incomplete
    echo ============================================================
    echo Please check the error messages above
    echo.
)
