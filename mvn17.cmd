@echo off
REM Wrapper script to run Maven with Java 17
setlocal
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
mvn %*
endlocal
