$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
Write-Host "JAVA_HOME set to: $env:JAVA_HOME"

# Verify Java version
& "$env:JAVA_HOME\bin\java.exe" -version

# Run backend setup
Write-Host "`nInstalling backend dependencies..."
Set-Location backend
mvn clean install -DskipTests -q

# Return to root
Set-Location ..

Write-Host "`nInstalling frontend dependencies..."
Set-Location frontend
npm install

# Return to root
Set-Location ..

Write-Host "`nSetup complete!"
