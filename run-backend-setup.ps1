# Set Java 17 environment
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH

# Navigate to backend directory
Set-Location backend

# Run Maven install
& C:\Environement\maven-3.8.6\bin\mvn.cmd clean install --toolchains ..\toolchains.xml --settings settings.xml
