@echo off
REM Backend setup script with Java 17
echo Setting up Backend with Java 17...

REM Set JAVA_HOME to Java 17
set "JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"

REM Verify Java version
echo.
echo Java version:
java -version

REM Run Maven install
echo.
echo Running Maven clean install...
cd backend
mvn clean install -DskipTests
cd ..

echo.
echo Backend setup complete!
