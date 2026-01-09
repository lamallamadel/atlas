@echo off
echo Starting repository setup...
echo.

REM Setup Backend
echo ============================================
echo Setting up Backend (Maven)
echo ============================================
set "JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"

cd backend
call mvn --settings settings.xml clean install -DskipTests
if %ERRORLEVEL% neq 0 (
    echo Backend setup failed!
    cd ..
    exit /b 1
)
cd ..

REM Setup Frontend
echo.
echo ============================================
echo Setting up Frontend (npm)
echo ============================================
cd frontend
call npm install
if %ERRORLEVEL% neq 0 (
    echo Frontend npm install failed!
    cd ..
    exit /b 1
)

REM Install Playwright browsers
echo.
echo ============================================
echo Installing Playwright browsers
echo ============================================
call npx playwright install
if %ERRORLEVEL% neq 0 (
    echo Playwright installation failed!
    cd ..
    exit /b 1
)
cd ..

echo.
echo ============================================
echo Setup Complete!
echo ============================================
echo Backend: Maven dependencies installed
echo Frontend: npm dependencies installed
echo Playwright: Browsers installed
echo.
