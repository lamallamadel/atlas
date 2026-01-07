$ErrorActionPreference = "Stop"
$originalJavaHome = $env:JAVA_HOME
try {
    $env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
    Write-Host "Using Java 17 from: $env:JAVA_HOME"
    & 'C:\Environement\Java\jdk-17.0.5.8-hotspot\bin\java.exe' -version
    Write-Host "`nRunning Maven clean install..."
    mvn clean install -gs settings.xml
} finally {
    $env:JAVA_HOME = $originalJavaHome
}
