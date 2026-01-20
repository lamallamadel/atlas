# Backend build script with Java 17
$ErrorActionPreference = "Stop"

Write-Host "Building backend with Maven and Java 17..."

# Store original values
$originalJavaHome = $env:JAVA_HOME
$originalPath = $env:PATH

try {
    # Set Java 17
    $env:JAVA_HOME = "C:\Environement\Java\jdk-17.0.5.8-hotspot"
    $env:PATH = "$env:JAVA_HOME\bin;$originalPath"
    
    # Navigate to backend
    Set-Location backend
    
    # Run Maven
    & mvn clean install -DskipTests -T 1C
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Maven build failed with exit code $LASTEXITCODE"
        exit $LASTEXITCODE
    }
    
    Write-Host "Backend build completed successfully!"
} finally {
    # Restore original values
    $env:JAVA_HOME = $originalJavaHome
    $env:PATH = $originalPath
    Set-Location ..
}
