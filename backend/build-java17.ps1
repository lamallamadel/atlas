$oldJavaHome = $env:JAVA_HOME
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
mvn clean package -gs settings.xml
$env:JAVA_HOME = $oldJavaHome
