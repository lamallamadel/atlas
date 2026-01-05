# Set Java 17 for Maven
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'

# Run Maven install from backend directory
Set-Location backend
mvn clean install
