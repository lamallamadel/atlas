# Temporary Maven wrapper for initial setup
$oldJavaHome = $env:JAVA_HOME
$oldPath = $env:PATH

try {
    $env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
    $env:PATH = "C:\Environement\Java\jdk-17.0.5.8-hotspot\bin;$env:PATH"
    
    Set-Location backend
    & mvn clean install -DskipTests --settings settings.xml --toolchains toolchains.xml
    $exitCode = $LASTEXITCODE
    
    exit $exitCode
} finally {
    $env:JAVA_HOME = $oldJavaHome
    $env:PATH = $oldPath
}
