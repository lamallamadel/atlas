@echo off
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

echo Setting up backend...
cd backend
call mvn clean package -DskipTests -s settings.xml -t toolchains.xml
cd ..

echo.
echo Setting up frontend...
cd frontend
call npm install
cd ..

echo.
echo Setup complete!
