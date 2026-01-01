# Setup and build backend with Java 17
$originalJavaHome = $env:JAVA_HOME
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "Using Java from: $env:JAVA_HOME" -ForegroundColor Cyan

# Run Maven clean install
mvn clean install -s settings.xml

# Restore original JAVA_HOME
$env:JAVA_HOME = $originalJavaHome
