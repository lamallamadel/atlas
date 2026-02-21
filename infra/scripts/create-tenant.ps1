# ==========================================
# Script de création rapide d'une Agence (Tenant B2B)
# ==========================================
# Pré-requis : jq installé, ou utilisation native de JSON en PS.
# Ce script utilise l'API Admin REST de Keycloak pour :
# 1. S'authentifier auprès de Keycloak (admin-cli)
# 2. Créer un Groupe représentant l'Agence (ex: "Agence ATLAS") avec l'attribut tenant_id
# 3. Créer un Utilisateur Admin pour cette agence
# 4. Assigner l'utilisateur au groupe créé

param (
    [Parameter(Mandatory = $true)]
    [string]$KeycloakUrl,

    [Parameter(Mandatory = $true)]
    [string]$AdminUser,

    [Parameter(Mandatory = $true)]
    [string]$AdminPassword,

    [Parameter(Mandatory = $true)]
    [string]$Realm,

    [Parameter(Mandatory = $true)]
    [string]$AgencyName,

    [Parameter(Mandatory = $true)]
    [string]$AgencyTenantId,

    [Parameter(Mandatory = $true)]
    [string]$AgencyAdminEmail,

    [Parameter(Mandatory = $true)]
    [string]$AgencyAdminPassword
)

Write-Host ">>> Authentication to Keycloak ($KeycloakUrl)..."
$body = @{
    client_id  = "admin-cli"
    username   = $AdminUser
    password   = $AdminPassword
    grant_type = "password"
}

$tokenResponse = Invoke-RestMethod -Uri "$KeycloakUrl/realms/master/protocol/openid-connect/token" -Method Post -Body $body
$accessToken = $tokenResponse.access_token

$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type"  = "application/json"
}

Write-Host ">>> Creating Group: $AgencyName (TenantID: $AgencyTenantId)..."
$groupBody = @{
    name       = $AgencyName
    attributes = @{
        tenant_id = @($AgencyTenantId)
    }
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$KeycloakUrl/admin/realms/$Realm/groups" -Method Post -Headers $headers -Body $groupBody
    Write-Host "Group created."
}
catch {
    Write-Host "Group might already exist or error: $($_.Exception.Message)"
}

# Get Group ID
$groups = Invoke-RestMethod -Uri "$KeycloakUrl/admin/realms/$Realm/groups?search=$AgencyName" -Method Get -Headers $headers
$groupId = $groups[0].id

Write-Host ">>> Creating Admin User: $AgencyAdminEmail ..."
$userBody = @{
    username      = $AgencyAdminEmail
    email         = $AgencyAdminEmail
    enabled       = $true
    emailVerified = $true
    credentials   = @(
        @{
            type      = "password"
            value     = $AgencyAdminPassword
            temporary = $false
        }
    )
    attributes    = @{
        tenant_id = @($AgencyTenantId)
    }
} | ConvertTo-Json -Depth 5

try {
    Invoke-RestMethod -Uri "$KeycloakUrl/admin/realms/$Realm/users" -Method Post -Headers $headers -Body $userBody
    Write-Host "User created."
}
catch {
    Write-Host "User might already exist or error: $($_.Exception.Message)"
}

# Get User ID
$users = Invoke-RestMethod -Uri "$KeycloakUrl/admin/realms/$Realm/users?username=$AgencyAdminEmail" -Method Get -Headers $headers
$userId = $users[0].id

Write-Host ">>> Assigning User ($userId) to Group ($groupId)..."
try {
    Invoke-RestMethod -Uri "$KeycloakUrl/admin/realms/$Realm/users/$userId/groups/$groupId" -Method Put -Headers $headers
    Write-Host "User successfully assigned to the group."
}
catch {
    Write-Host "Assignment error: $($_.Exception.Message)"
}

Write-Host "=== B2B Tenant Provisioning Completed Successfully ! ==="
Write-Host "Agency Name : $AgencyName"
Write-Host "Tenant ID   : $AgencyTenantId"
Write-Host "Admin Login : $AgencyAdminEmail"
