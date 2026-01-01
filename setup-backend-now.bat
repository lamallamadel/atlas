@echo off
setlocal
set "JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"
cd /d "%~dp0backend"
call mvn clean install -DskipTests
endlocal
