# Maven wrapper script with Java 17
# This script runs Maven commands with the correct Java version

$JAVA17_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'

# Save original environment
$originalJavaHome = $env:JAVA_HOME
$originalPath = $env:PATH

try {
    # Set Java 17 environment for this process
    $env:JAVA_HOME = $JAVA17_HOME
    $env:PATH = "$JAVA17_HOME\bin;$env:PATH"
    
    Write-Host "Using Java: $JAVA17_HOME" -ForegroundColor Cyan
    
    # Run Maven with all provided arguments
    $arguments = $args -join ' '
    if (-not $arguments) {
        $arguments = 'clean install -DskipTests'
    }
    
    Write-Host "Running: mvn $arguments" -ForegroundColor Gray
    Write-Host ""
    
    # Execute Maven
    $expression = "mvn $arguments"
    Invoke-Expression $expression
    
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "✓ Maven command completed successfully" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "✗ Maven command failed with exit code $exitCode" -ForegroundColor Red
    }
    
    exit $exitCode
}
finally {
    # Restore original environment
    if ($originalJavaHome) {
        $env:JAVA_HOME = $originalJavaHome
    }
    if ($originalPath) {
        $env:PATH = $originalPath
    }
}
