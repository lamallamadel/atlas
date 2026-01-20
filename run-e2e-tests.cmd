@echo off
setlocal
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

echo Running H2 E2E Tests...
cd backend
call mvn verify -Pbackend-e2e-h2
if errorlevel 1 (
    echo H2 tests failed!
    exit /b 1
)

echo.
echo Running PostgreSQL E2E Tests...
call mvn verify -Pbackend-e2e-postgres
if errorlevel 1 (
    echo PostgreSQL tests failed!
    exit /b 1
)

echo.
echo All tests passed successfully!
cd ..
endlocal
