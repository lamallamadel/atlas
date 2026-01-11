# Maven setup script with Java 17
Push-Location backend
& 'C:\Environement\maven-3.8.6\bin\mvn.cmd' clean install -DskipTests "-Dmaven.compiler.source=17" "-Dmaven.compiler.target=17" "-DJAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot"
Pop-Location
