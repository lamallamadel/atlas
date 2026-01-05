$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = "mvn"
$processInfo.Arguments = "clean install -f backend\pom.xml --toolchains backend\toolchains.xml"
$processInfo.UseShellExecute = $false
$processInfo.RedirectStandardOutput = $true
$processInfo.RedirectStandardError = $true
$processInfo.EnvironmentVariables["JAVA_HOME"] = "C:\Environement\Java\jdk-17.0.5.8-hotspot"
$processInfo.EnvironmentVariables["PATH"] = "C:\Environement\Java\jdk-17.0.5.8-hotspot\bin;" + $env:PATH

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $processInfo
$process.Start() | Out-Null

$stdout = $process.StandardOutput.ReadToEnd()
$stderr = $process.StandardError.ReadToEnd()

$process.WaitForExit()

Write-Output $stdout
Write-Error $stderr

exit $process.ExitCode
