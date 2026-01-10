$oldJavaHome = $env:JAVA_HOME
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'

$settingsPath = Join-Path $PSScriptRoot "settings.xml"

# Run Maven with both -s (user settings) and -gs (global settings) pointing to our settings.xml
& 'C:\Environement\maven-3.8.6\bin\mvn.cmd' clean install --settings "$settingsPath" --global-settings "$settingsPath"

$env:JAVA_HOME = $oldJavaHome
