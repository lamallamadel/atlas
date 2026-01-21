# Simple backend setup
# This script wraps Maven with the correct Java version

param(
    [Parameter(ValueFromRemainingArguments)]
    [string[]]$MavenArgs = @('clean', 'install', '-DskipTests')
)

# Maven and Java paths
$mavenPath = 'C:\Environement\maven-3.8.6\bin\mvn.cmd'
$java17Home = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'

# Build environment for Maven process
$processEnv = @{
    'JAVA_HOME' = $java17Home
    'PATH' = "$java17Home\bin;$env:PATH"
}

# Navigate to backend
Push-Location backend
try {
    # Start Maven with Java 17 environment
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $mavenPath
    $psi.Arguments = $MavenArgs -join ' '
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    
    foreach ($key in $processEnv.Keys) {
        $psi.EnvironmentVariables[$key] = $processEnv[$key]
    }
    
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $psi
    $process.Start() | Out-Null
    
    # Read output
    $stdout = $process.StandardOutput.ReadToEnd()
    $stderr = $process.StandardError.ReadToEnd()
    
    $process.WaitForExit()
    
    Write-Host $stdout
    if ($stderr) { Write-Host $stderr -ForegroundColor Yellow }
    
    exit $process.ExitCode
} finally {
    Pop-Location
}
