$oldJavaHome = $env:JAVA_HOME
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
mvn verify -Pbackend-e2e-h2
$exitCode = $LASTEXITCODE
$env:JAVA_HOME = $oldJavaHome
exit $exitCode
