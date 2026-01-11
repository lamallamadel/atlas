# Maven wrapper for setup with Java 17
$oldJavaHome = $env:JAVA_HOME
$oldPath = $env:PATH

try {
    $env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
    $env:PATH = "$env:JAVA_HOME\bin;$oldPath"
    
    # Copy settings to user .m2 directory
    $m2Dir = Join-Path $env:USERPROFILE ".m2"
    if (-not (Test-Path $m2Dir)) {
        New-Item -ItemType Directory -Path $m2Dir | Out-Null
    }
    Copy-Item -Path "settings.xml" -Destination (Join-Path $m2Dir "settings.xml") -Force
    
    # Run Maven
    & 'C:\Environement\maven-3.8.6\bin\mvn.cmd' $args
    exit $LASTEXITCODE
} finally {
    $env:JAVA_HOME = $oldJavaHome
    $env:PATH = $oldPath
}
