@echo off
REM Maven installation wrapper with Java 17
set "JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo JAVA_HOME set to: %JAVA_HOME%
echo Running Maven clean install...

cd backend
mvn clean install -DskipTests
