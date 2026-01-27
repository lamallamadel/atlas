# Jasypt Secret Encryption Utility for Windows
# Usage: .\encrypt-secret.ps1 "your-secret-value"

param(
    [Parameter(Mandatory=$true)]
    [string]$SecretValue
)

$ErrorActionPreference = "Stop"

if (-not $env:JASYPT_ENCRYPTOR_PASSWORD) {
    Write-Host "Error: JASYPT_ENCRYPTOR_PASSWORD environment variable not set" -ForegroundColor Red
    Write-Host ""
    Write-Host "Set it with: `$env:JASYPT_ENCRYPTOR_PASSWORD = 'your-encryption-password'"
    Write-Host "Generate a secure password with: openssl rand -base64 32"
    exit 1
}

$jasyptVersion = "1.9.3"
$jasyptJar = "jasypt-$jasyptVersion.jar"

if (-not (Test-Path $jasyptJar)) {
    Write-Host "Downloading Jasypt $jasyptVersion..." -ForegroundColor Yellow
    $url = "https://repo1.maven.org/maven2/org/jasypt/jasypt/$jasyptVersion/$jasyptJar"
    Invoke-WebRequest -Uri $url -OutFile $jasyptJar
}

Write-Host ""
Write-Host "Encrypting secret..." -ForegroundColor Green
Write-Host ""

java -cp $jasyptJar org.jasypt.intf.cli.JasyptPBEStringEncryptionCLI `
    input="$SecretValue" `
    password="$env:JASYPT_ENCRYPTOR_PASSWORD" `
    algorithm=PBEWITHHMACSHA512ANDAES_256 `
    ivGeneratorClassName=org.jasypt.iv.RandomIvGenerator

Write-Host ""
Write-Host "Use in application.yml as: ENC(encrypted_value_above)" -ForegroundColor Cyan
Write-Host ""
