@echo off
REM Initial Backend Setup Script
REM This script sets Java 17 and runs Maven install

echo ========================================
echo   Backend Initial Setup
echo ========================================
echo.

echo Setting Java 17 environment...
set "JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Verifying Java version...
java -version
echo.

echo Creating .m2 directory if needed...
if not exist "%USERPROFILE%\.m2" mkdir "%USERPROFILE%\.m2"

echo Copying toolchains.xml...
copy /Y "%~dp0toolchains.xml" "%USERPROFILE%\.m2\toolchains.xml" >nul 2>&1
echo.

echo Running Maven install (this may take a few minutes)...
cd /d "%~dp0backend"
mvn clean install -DskipTests

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   Backend Setup Complete!
    echo ========================================
    echo.
    echo You can now run:
    echo   - Tests: mvn test
    echo   - Build: mvn clean package  
    echo   - Dev server: mvn spring-boot:run
) else (
    echo.
    echo ========================================
    echo   Backend Setup Failed!
    echo ========================================
    echo.
    echo Please check the error messages above.
    exit /b 1
)

pause
