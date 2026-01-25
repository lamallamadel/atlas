@echo off
setlocal enabledelayedexpansion

where mvn >nul 2>nul
if errorlevel 1 (
  echo Error: mvn is not installed or not on PATH. 1>&2
  echo Please install Maven or configure your environment to provide mvn. 1>&2
  exit /b 1
)

set "ROOT_DIR=%~dp0"

mvn -f "%ROOT_DIR%pom.xml" %*
