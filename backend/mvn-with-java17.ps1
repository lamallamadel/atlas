#!/usr/bin/env pwsh
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
& C:\Environement\maven-3.8.6\bin\mvn.cmd @args
