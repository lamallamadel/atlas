@echo off
REM Initial repository setup script for backend
REM This script sets up Java 17 and runs Maven install

echo Setting up Java 17...
set "JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Checking Java version...
java -version

echo.
echo Running Maven clean install (skipping tests for initial setup)...
C:\Environement\maven-3.8.6\bin\mvn.cmd clean install -DskipTests

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =====================================
    echo Backend setup completed successfully!
    echo =====================================
) else (
    echo.
    echo =====================================
    echo Backend setup failed!
    echo =====================================
    exit /b 1
)
