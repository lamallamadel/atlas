@echo off
echo ================================================================
echo Backend Setup Script
echo ================================================================
echo.
echo This script will:
echo   1. Set JAVA_HOME to Java 17
echo   2. Run Maven clean install
echo.

setlocal
set "JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo JAVA_HOME set to: %JAVA_HOME%
echo.

cd backend
echo Running: mvn clean install -DskipTests -s settings.xml
echo.
mvn clean install -DskipTests -s settings.xml

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================================
    echo SUCCESS: Backend dependencies installed
    echo ================================================================
) else (
    echo.
    echo ================================================================
    echo ERROR: Backend installation failed
    echo ================================================================
    exit /b %ERRORLEVEL%
)

cd ..
endlocal
