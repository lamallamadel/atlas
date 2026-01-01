@echo off
REM Maven wrapper that ensures Java 17 is used
REM Usage: mvn-java17.cmd <maven-arguments>
REM Example: mvn-java17.cmd clean test

set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%
mvn %*
