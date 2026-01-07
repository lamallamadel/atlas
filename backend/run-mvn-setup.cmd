@echo off
REM Temporary setup script for Maven with Java 17
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%
mvn clean install
