@echo off
REM ============================================================
REM Complete Backend Setup Script
REM ============================================================
REM This script completes the repository setup by installing
REM backend dependencies using Maven with Java 17.
REM
REM Frontend setup is already complete (npm install was successful).
REM ============================================================

echo.
echo ============================================================
echo Backend Setup (Maven with Java 17)
echo ============================================================
echo.

REM Set Java 17
set "JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Using Java from: %JAVA_HOME%
echo.

REM Verify Java version
java -version
echo.

REM Navigate to backend and run Maven
echo Running: mvn clean install -DskipTests
echo.
cd backend
mvn clean install -DskipTests
cd ..

echo.
echo ============================================================
echo Setup Complete!
echo ============================================================
echo.
echo You can now run:
echo   - Backend tests:  cd backend ^&^& mvn test
echo   - Backend build:  cd backend ^&^& mvn package  
echo   - Backend run:    cd backend ^&^& mvn spring-boot:run
echo   - Frontend tests: cd frontend ^&^& npm test
echo   - Frontend build: cd frontend ^&^& npm run build
echo   - Frontend run:   cd frontend ^&^& npm start
echo.
