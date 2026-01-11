@echo off
C:\Environement\Java\jdk-17.0.5.8-hotspot\bin\java.exe -version
echo.
echo Building backend with Maven...
cd /d "%~dp0backend"
C:\Environement\maven-3.8.6\bin\mvn.cmd clean install -DskipTests -Djava.home=C:\Environement\Java\jdk-17.0.5.8-hotspot
