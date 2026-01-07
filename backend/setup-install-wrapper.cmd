@echo off
setlocal
set "ORIGINAL_JAVA_HOME=%JAVA_HOME%"
set "JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot"
echo Using Java 17 from: %JAVA_HOME%
"%JAVA_HOME%\bin\java.exe" -version
echo.
echo Running Maven clean install...
mvn clean install -gs settings.xml
set "JAVA_HOME=%ORIGINAL_JAVA_HOME%"
endlocal
