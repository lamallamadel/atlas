$oldJavaHome = $env:JAVA_HOME
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'

# Disable HTTP proxy via Java system properties
$env:MAVEN_OPTS = "-Dhttp.proxyHost= -Dhttp.proxyPort= -Dhttps.proxyHost= -Dhttps.proxyPort="

& 'C:\Environement\maven-3.8.6\bin\mvn.cmd' clean install

$env:JAVA_HOME = $oldJavaHome
$env:MAVEN_OPTS = ""
