@echo off
REM Backend setup script - Sets Java 17 and runs Maven install

echo ============================================================
echo Backend Setup - Maven Install
echo ============================================================
echo.

REM Set Java 17
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

echo Using Java: %JAVA_HOME%
echo.

REM Run Maven install
echo Running: mvn clean install -DskipTests
echo.
call mvn clean install -DskipTests

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo ✓ Backend setup complete!
    echo ============================================================
    echo.
    echo You can now run:
    echo   mvn test                - Run tests
    echo   mvn spring-boot:run     - Start the backend server
    echo   mvn clean package       - Build the application
    echo.
) else (
    echo.
    echo ============================================================
    echo ✗ Setup failed
    echo ============================================================
    echo.
    exit /b 1
)
