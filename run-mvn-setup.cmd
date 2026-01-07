@echo off
set "JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"
cd backend
mvn clean install -DskipTests --settings settings.xml --toolchains toolchains.xml
