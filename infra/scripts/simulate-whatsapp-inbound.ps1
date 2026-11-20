<#
.SYNOPSIS
  Simule un message WhatsApp entrant, comme Meta l'enverrait au webhook d'Atlas (test local).

.DESCRIPTION
  Tant que l'app Meta n'est pas publiee (verification d'entreprise), Meta ne transmet pas les
  vrais messages au webhook. Ce script envoie a Atlas le meme webhook que Meta, signe avec la
  cle secrete de l'app (X-Hub-Signature-256) : Atlas le traite exactement comme un vrai message
  (dossier, fenetre de 24 h, analyse de la reponse a une proposition...).

  Pour que les reponses d'Atlas arrivent vraiment sur le telephone, ecrivez aussi le meme
  message au numero de test depuis WhatsApp : cela ouvre la fenetre de 24 h cote Meta.

.EXAMPLE
  .\simulate-whatsapp-inbound.ps1 -From 212600000000 -Message "Bonjour" `
      -PhoneNumberId 1421198634413603 -AppSecret "cle-secrete-de-l-app"
#>
param(
    [Parameter(Mandatory = $true)] [string] $From,           # numero du client, chiffres seuls (212...)
    [Parameter(Mandatory = $true)] [string] $Message,
    [Parameter(Mandatory = $true)] [string] $PhoneNumberId,  # ID du numero de test (Meta > Try it out)
    [Parameter(Mandatory = $true)] [string] $AppSecret,      # Parametres de l'app > General > Cle secrete
    [string] $Name = "Client test",
    [string] $Url = "http://localhost:8080/api/v1/webhooks/whatsapp/inbound"
)

$ErrorActionPreference = "Stop"
$from = ($From -replace '[^0-9]', '')
$now = [int][double]::Parse((Get-Date -UFormat %s))
$messageId = "wamid.SIMULATED." + [guid]::NewGuid().ToString("N")

$payload = @{
    object = "whatsapp_business_account"
    entry  = @(@{
        id      = "simulation"
        changes = @(@{
            field = "messages"
            value = @{
                messaging_product = "whatsapp"
                metadata          = @{ display_phone_number = "test"; phone_number_id = $PhoneNumberId }
                contacts          = @(@{ profile = @{ name = $Name }; wa_id = $from })
                messages          = @(@{
                    from      = $from
                    id        = $messageId
                    timestamp = "$now"
                    type      = "text"
                    text      = @{ body = $Message }
                })
            }
        })
    })
}
$json = $payload | ConvertTo-Json -Depth 12 -Compress
$bytes = [System.Text.Encoding]::UTF8.GetBytes($json)

$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($AppSecret)
$signature = "sha256=" + (($hmac.ComputeHash($bytes) | ForEach-Object { $_.ToString("x2") }) -join "")

try {
    $response = Invoke-WebRequest -Uri $Url -Method Post -Body $bytes -UseBasicParsing `
        -ContentType "application/json; charset=utf-8" -Headers @{ "X-Hub-Signature-256" = $signature }
    Write-Host ("Atlas a accepte le message (HTTP {0}) : {1}" -f $response.StatusCode, $Message) -ForegroundColor Green
} catch {
    $status = $null
    if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
    Write-Host ("Refuse par Atlas (HTTP {0}) : {1}" -f $status, $_.Exception.Message) -ForegroundColor Red
    Write-Host "401 : cle secrete differente de whatsapp_provider_config.webhook_secret_encrypted"
    Write-Host "400 : PhoneNumberId different de whatsapp_provider_config.phone_number_id"
    exit 1
}
