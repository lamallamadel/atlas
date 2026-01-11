@echo off
REM Complete the initial repository setup
REM Run this script to finish the backend Maven build with Java 17

echo ========================================
echo   Completing Repository Setup
echo ========================================
echo.

REM Set Java 17 for this session
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

echo [OK] JAVA_HOME set to: %JAVA_HOME%
echo.

REM Verify Java version
echo Checking Java version...
java -version
echo.

REM Build backend
echo Building backend with Maven (this may take a few minutes)...
cd backend
call mvn clean install -DskipTests

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   Setup Complete!
    echo ========================================
    echo.
    echo Backend JAR created: backend\target\backend.jar
    echo.
    echo Next steps:
    echo   1. Run backend:  mvn spring-boot:run
    echo   2. Run frontend: cd ..\frontend ^&^& npm start
    echo   3. Run tests:    mvn test
    echo.
) else (
    echo.
    echo ========================================
    echo   Build Failed
    echo ========================================
    echo.
    echo Please check the error messages above.
    echo For help, see: INITIAL_SETUP_REPORT.md
    echo.
)

cd ..
pause
