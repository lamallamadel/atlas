@echo off
setlocal

echo ================================================
echo Backend Setup - Maven Install
echo ================================================

REM Set Java 17
set "JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Java Home: %JAVA_HOME%
echo.

REM Copy project settings to user Maven directory to override proxy settings
echo Copying Maven settings...
if not exist "%USERPROFILE%\.m2" mkdir "%USERPROFILE%\.m2"
copy /Y backend\settings.xml "%USERPROFILE%\.m2\settings.xml" >nul
copy /Y backend\toolchains.xml "%USERPROFILE%\.m2\toolchains.xml" >nul

echo.
echo Running Maven clean install...
cd backend
call mvn clean install -DskipTests

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo ✓ Backend setup complete!
    echo ================================================
    cd ..
    exit /b 0
) else (
    echo.
    echo ================================================
    echo ✗ Backend setup failed
    echo ================================================
    cd ..
    exit /b 1
)
