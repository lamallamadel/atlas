# Setup script that uses project settings.xml
# This avoids conflicts with user's .m2/settings.xml

$userM2Dir = "$env:USERPROFILE\.m2"
$userSettings = "$userM2Dir\settings.xml"
$userSettingsBackup = "$userSettings.backup"

try {
    # Backup user settings if it exists
    if (Test-Path $userSettings) {
        Write-Host "Backing up user settings.xml..."
        Move-Item $userSettings $userSettingsBackup -Force
    }
    
    # Copy project settings to user .m2 directory
    Write-Host "Using project settings.xml..."
    if (-not (Test-Path $userM2Dir)) {
        New-Item -ItemType Directory -Path $userM2Dir -Force | Out-Null
    }
    Copy-Item "settings.xml" $userSettings -Force
    
    # Run Maven install
    Write-Host "Running mvn clean install..."
    mvn clean install
    
} finally {
    # Restore user settings
    if (Test-Path $userSettingsBackup) {
        Write-Host "Restoring user settings.xml..."
        Move-Item $userSettingsBackup $userSettings -Force
    } elseif (Test-Path $userSettings) {
        # Remove project settings if user didn't have one before
        Remove-Item $userSettings -Force
    }
}
