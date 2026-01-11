$oldJavaHome = $env:JAVA_HOME
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
mvn clean install -gs settings.xml -t toolchains.xml
$env:JAVA_HOME = $oldJavaHome
