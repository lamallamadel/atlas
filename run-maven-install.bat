@echo off
setlocal
set "JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"
cd backend
mvn clean install -DskipTests
endlocal
