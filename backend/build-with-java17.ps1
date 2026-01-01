$currentDir = Get-Location
Set-Location $PSScriptRoot

try {
    # Create a new process with modified environment
    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = "C:\Environement\maven-3.8.6\bin\mvn.cmd"
    $processInfo.Arguments = "clean install -DskipTests"
    $processInfo.UseShellExecute = $false
    $processInfo.RedirectStandardOutput = $true
    $processInfo.RedirectStandardError = $true
    $processInfo.WorkingDirectory = $PSScriptRoot
    
    # Set environment variables
    $processInfo.EnvironmentVariables["JAVA_HOME"] = "C:\Environement\Java\jdk-17.0.5.8-hotspot"
    $processInfo.EnvironmentVariables["PATH"] = "C:\Environement\Java\jdk-17.0.5.8-hotspot\bin;" + $processInfo.EnvironmentVariables["PATH"]
    
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $processInfo
    $process.Start() | Out-Null
    
    # Read output
    $stdout = $process.StandardOutput.ReadToEnd()
    $stderr = $process.StandardError.ReadToEnd()
    
    $process.WaitForExit()
    
    Write-Output $stdout
    if ($stderr) {
        Write-Error $stderr
    }
    
    exit $process.ExitCode
}
finally {
    Set-Location $currentDir
}
