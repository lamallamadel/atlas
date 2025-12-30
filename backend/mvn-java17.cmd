@echo off
REM Maven wrapper for Java 17
REM Usage: mvn-java17.cmd [maven-goals]
REM Example: mvn-java17.cmd clean install

REM Set JAVA_HOME to Java 17 installation
REM Modify this path to match your Java 17 installation
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

REM Run Maven with all passed arguments
mvn %*
