@echo off
REM Temporary compile script
C:\Environement\maven-3.8.6\bin\mvn.cmd clean compile -Djava.home=C:\Environement\Java\jdk-17.0.5.8-hotspot --global-toolchains toolchains.xml
