@echo off
REM Maven wrapper that sets JAVA_HOME to Java 17
set "JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"
mvn --settings backend\settings.xml %*
