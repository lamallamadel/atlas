@echo off
setlocal

echo ============================================================
echo Repository Initial Setup
echo ============================================================
echo.

REM Set Java 17 for Maven
set "JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Using Java from: %JAVA_HOME%
java -version
echo.

REM Step 1: Setup Backend
echo ------------------------------------------------------------
echo Step 1: Setting up Backend (Maven)
echo ------------------------------------------------------------
cd backend
call mvn clean install -DskipTests
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Backend setup failed
    exit /b %ERRORLEVEL%
)
cd ..
echo Backend setup complete
echo.

REM Step 2: Setup Frontend
echo ------------------------------------------------------------
echo Step 2: Setting up Frontend (npm)
echo ------------------------------------------------------------
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Frontend setup failed
    exit /b %ERRORLEVEL%
)
cd ..
echo Frontend setup complete
echo.

echo ============================================================
echo Setup Complete!
echo ============================================================
echo.
echo You can now:
echo   - Run backend tests:  cd backend ^& mvn test
echo   - Run frontend tests: cd frontend ^& npm test
echo   - Build backend:      cd backend ^& mvn clean package
echo   - Build frontend:     cd frontend ^& npm run build
echo.
echo Note: For backend commands, set JAVA_HOME to Java 17 first
echo.

endlocal
