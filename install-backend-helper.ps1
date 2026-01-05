# Helper script to install backend dependencies
# This script uses Process API to set environment for Maven

$mavenArgs = @(
    'clean',
    'install',
    '-DskipTests',
    '-f',
    'backend/pom.xml',
    '--settings',
    'backend/settings.xml'
)

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = 'mvn'
$psi.Arguments = $mavenArgs -join ' '
$psi.WorkingDirectory = $PWD.Path
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true

# Set JAVA_HOME for this process
$psi.EnvironmentVariables['JAVA_HOME'] = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$oldPath = $psi.EnvironmentVariables['PATH']
$psi.EnvironmentVariables['PATH'] = 'C:\Environement\Java\jdk-17.0.5.8-hotspot\bin;' + $oldPath

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $psi

Write-Host "Starting Maven build..."
$process.Start() | Out-Null

# Read output asynchronously
$outputBuilder = New-Object System.Text.StringBuilder
$errorBuilder = New-Object System.Text.StringBuilder

$outputAction = {
    if (-not [string]::IsNullOrEmpty($EventArgs.Data)) {
        [void]$Event.MessageData.AppendLine($EventArgs.Data)
        Write-Host $EventArgs.Data
    }
}

$outputEvent = Register-ObjectEvent -InputObject $process -EventName 'OutputDataReceived' -Action $outputAction -MessageData $outputBuilder
$errorEvent = Register-ObjectEvent -InputObject $process -EventName 'ErrorDataReceived' -Action $outputAction -MessageData $errorBuilder

$process.BeginOutputReadLine()
$process.BeginErrorReadLine()

$process.WaitForExit()

Unregister-Event -SourceIdentifier $outputEvent.Name
Unregister-Event -SourceIdentifier $errorEvent.Name

if ($process.ExitCode -eq 0) {
    Write-Host "`n✓ Backend dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "`n✗ Backend installation failed with exit code $($process.ExitCode)" -ForegroundColor Red
    Write-Host $errorBuilder.ToString() -ForegroundColor Red
}

exit $process.ExitCode
