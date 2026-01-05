# Maven wrapper script that sets JAVA_HOME to Java 17
$originalJavaHome = $env:JAVA_HOME
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'

try {
    Set-Location backend
    mvn clean install -DskipTests --settings settings.xml
} finally {
    $env:JAVA_HOME = $originalJavaHome
    Set-Location ..
}
