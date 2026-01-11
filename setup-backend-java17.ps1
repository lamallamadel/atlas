# Backend setup with Java 17
$JAVA17_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'

# Save current JAVA_HOME
$OLD_JAVA_HOME = $env:JAVA_HOME
$OLD_PATH = $env:Path

# Set Java 17
$env:JAVA_HOME = $JAVA17_HOME
$env:Path = "$JAVA17_HOME\bin;$env:Path"

Write-Host "Using Java 17 from: $env:JAVA_HOME"

# Navigate to backend and run Maven
Push-Location backend
try {
    Write-Host "Running mvn clean install -DskipTests..."
    mvn clean install -DskipTests -gs settings.xml
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host "`nBackend setup completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "`nBackend setup failed with exit code: $exitCode" -ForegroundColor Red
    }
} finally {
    Pop-Location
    # Restore original environment
    $env:JAVA_HOME = $OLD_JAVA_HOME
    $env:Path = $OLD_PATH
}

exit $exitCode
