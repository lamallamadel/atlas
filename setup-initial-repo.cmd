@echo off
setlocal

echo Setting up repository for first use...
echo.

REM Set JAVA_HOME for this session
set "JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Step 1: Verifying Java 17...
java -version
echo.

echo Step 2: Installing backend dependencies...
cd backend
call mvn clean install -DskipTests
if errorlevel 1 (
    echo Backend setup failed!
    exit /b 1
)
cd ..
echo Backend setup complete!
echo.

echo Step 3: Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo Frontend setup failed!
    exit /b 1
)
cd ..
echo Frontend setup complete!
echo.

echo ========================================
echo Initial setup complete!
echo ========================================
echo.
echo You can now:
echo   - Build backend: cd backend ^&^& mvn clean package
echo   - Run backend: cd backend ^&^& mvn spring-boot:run
echo   - Run frontend: cd frontend ^&^& npm start
echo   - Run tests: cd backend ^&^& mvn test
echo.

endlocal
