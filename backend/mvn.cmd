@echo off
set "JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"

REM Ensure .m2 directory exists and copy settings
if not exist "%USERPROFILE%\.m2" mkdir "%USERPROFILE%\.m2"
copy /Y "%~dp0settings.xml" "%USERPROFILE%\.m2\settings.xml" >nul 2>&1

C:\Environement\maven-3.8.6\bin\mvn.cmd %*
