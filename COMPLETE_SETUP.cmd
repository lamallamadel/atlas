@echo off
REM Complete Repository Setup Script
REM This script completes the backend Maven build that couldn't be automated

echo ================================================================
echo Complete Repository Setup
echo ================================================================
echo.
echo Frontend setup is already COMPLETE (npm packages + Playwright)
echo.
echo This script will now complete the backend setup:
echo   - Set JAVA_HOME to Java 17
echo   - Run Maven clean install
echo.

set "JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo JAVA_HOME: %JAVA_HOME%
echo.
echo Checking Java version:
java -version
echo.

cd backend
echo Running: mvn clean install --toolchains ..\toolchains.xml --settings settings.xml
echo.
mvn clean install --toolchains ..\toolchains.xml --settings settings.xml

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================================
    echo SUCCESS: Repository setup is now COMPLETE
    echo ================================================================
    echo.
    echo You can now:
    echo   - Build backend: cd backend ^&^& mvn clean package
    echo   - Run tests: cd backend ^&^& mvn test
    echo   - Start backend: cd backend ^&^& mvn spring-boot:run
    echo   - Start frontend: cd frontend ^&^& npm start
    echo.
) else (
    echo.
    echo ================================================================
    echo ERROR: Backend setup failed
    echo ================================================================
    echo.
    echo Please check the error messages above.
    echo You may need to:
    echo   1. Verify Java 17 is installed at: C:\Environement\Java\jdk-17.0.5.8-hotspot
    echo   2. Check your network connection (Maven downloads dependencies)
    echo   3. Review backend\settings.xml for proxy configuration
    echo.
)

cd ..
pause
