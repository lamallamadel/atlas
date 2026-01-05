# Simple Maven setup script for backend
# Sets Java 17 and runs Maven clean install

$oldJavaHome = $env:JAVA_HOME
$oldPath = $env:PATH

try {
    # Set Java 17
    $env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
    $env:PATH = "$env:JAVA_HOME\bin;$oldPath"
    
    Write-Host "Using Java: $env:JAVA_HOME"
    
    # Run Maven
    Set-Location backend
    mvn clean install -DskipTests -s settings.xml
    
    $exitCode = $LASTEXITCODE
    Set-Location ..
    
    exit $exitCode
}
finally {
    # Restore environment
    $env:JAVA_HOME = $oldJavaHome
    $env:PATH = $oldPath
}
