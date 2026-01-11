@echo off
echo Setting up repository...

REM Set JAVA_HOME for Java 17
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
echo JAVA_HOME set to: %JAVA_HOME%

REM Verify Java version
echo.
echo Verifying Java version...
"%JAVA_HOME%\bin\java.exe" -version

REM Backend setup
echo.
echo ==== Setting up Backend ====
cd backend
echo Running: mvn clean install -DskipTests
call mvn clean install -DskipTests --toolchains toolchains.xml
if errorlevel 1 (
    echo Backend setup failed!
    cd ..
    exit /b 1
)
cd ..
echo Backend setup completed successfully!

REM Frontend setup
echo.
echo ==== Setting up Frontend ====
cd frontend
echo Running: npm install
call npm install
if errorlevel 1 (
    echo Frontend npm install failed!
    cd ..
    exit /b 1
)

echo.
echo Installing Playwright browsers...
call npx playwright install
if errorlevel 1 (
    echo Playwright browser installation failed!
    cd ..
    exit /b 1
)
cd ..
echo Frontend setup completed successfully!

echo.
echo ==== Setup Complete ====
echo You can now run:
echo   Backend build: cd backend ^&^& mvn clean package
echo   Backend test:  cd backend ^&^& mvn test
echo   Frontend E2E:  cd frontend ^&^& npm run e2e
