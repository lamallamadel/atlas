@echo off
setlocal

set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

echo Using Java 17 from: %JAVA_HOME%
java -version

cd backend
echo.
echo Running mvn clean install -DskipTests...
mvn clean install -DskipTests -gs settings.xml

endlocal
