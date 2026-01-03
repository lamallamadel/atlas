$oldJavaHome = $env:JAVA_HOME
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'

# Override Maven settings via environment
$mvnArgs = @(
    'clean',
    'install',
    '--batch-mode'
)

& mvn @mvnArgs

$env:JAVA_HOME = $oldJavaHome
