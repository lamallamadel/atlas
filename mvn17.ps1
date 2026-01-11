# Maven wrapper with Java 17
$originalJavaHome = $env:JAVA_HOME
$originalPath = $env:PATH
try {
    $env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
    $env:PATH = "$env:JAVA_HOME\bin;$originalPath"
    & mvn $args
} finally {
    $env:JAVA_HOME = $originalJavaHome
    $env:PATH = $originalPath
}
