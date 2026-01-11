@echo off
set OLD_JAVA_HOME=%JAVA_HOME%
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
mvn clean install -gs settings.xml -t toolchains.xml
set JAVA_HOME=%OLD_JAVA_HOME%
