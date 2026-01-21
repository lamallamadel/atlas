#requires -Version 5.1
<#
Atlas Dev Console (Windows GUI)

Goal:
- Provide a Windows WPF GUI to operate the local dev environment and CI toolkits shipped in this repository.
- Commands are aligned with the runbooks under docs/ and the scripts under scripts/ and infra/.

Run:
  pwsh -ExecutionPolicy Bypass -File .\tools\AtlasDevConsole.ps1

Notes:
- Windows only (WPF).
- Uses 'docker compose' if available, otherwise falls back to 'docker-compose'.
#>


$ErrorActionPreference = 'Stop'

function Assert-Windows {
    # $IsWindows exists in PowerShell 6+; Windows PowerShell 5.1 does not expose it.
    $isWin = $false
    if (Get-Variable -Name IsWindows -Scope Global -ErrorAction SilentlyContinue) {
        $isWin = [bool]$IsWindows
    } else {
        $isWin = ($env:OS -like '*Windows*')
    }
    if (-not $isWin) {
        throw "This GUI requires Windows (WPF). Run it with PowerShell on Windows." 
    }
}

Assert-Windows

# ----------------------------
# Helpers
# ----------------------------

function Resolve-RepoRoot {
    param([string]$StartPath)

    $p = (Resolve-Path $StartPath).Path
    while ($true) {
        if (Test-Path (Join-Path $p 'infra')) { return $p }
        if (Test-Path (Join-Path $p 'backend')) { return $p }
        if (Test-Path (Join-Path $p 'frontend')) { return $p }

        $parent = Split-Path -Parent $p
        if ([string]::IsNullOrEmpty($parent) -or $parent -eq $p) {
            return (Resolve-Path $StartPath).Path
        }
        $p = $parent
    }
}

function Get-ComposeCommand {
    # Prefer Docker Compose v2 plugin: 'docker compose'
    try {
        $null = & docker compose version 2>$null
        return @{ Type = 'plugin'; Command = 'docker'; ArgsPrefix = @('compose') }
    } catch {
        # Fallback: docker-compose
        try {
            $null = & docker-compose version 2>$null
            return @{ Type = 'legacy'; Command = 'docker-compose'; ArgsPrefix = @() }
        } catch {
            return $null
        }
    }
}

function Get-MavenCommand {
    param([string]$BackendDir)

    $mvnwCmd = Join-Path $BackendDir 'mvnw.cmd'
    $mvnw = Join-Path $BackendDir 'mvnw'

    if (Test-Path $mvnwCmd) { return @{ Command = $mvnwCmd; ArgsPrefix = @() } }
    if (Test-Path $mvnw) { return @{ Command = $mvnw; ArgsPrefix = @() } }

    # The repo ships mvn.cmd wrappers in backend/
    $mvnCmd = Join-Path $BackendDir 'mvn.cmd'
    if (Test-Path $mvnCmd) { return @{ Command = $mvnCmd; ArgsPrefix = @() } }

    return @{ Command = 'mvn'; ArgsPrefix = @() }
}

function Get-PowerShellExe {
    # Prefer PowerShell 7 (pwsh) if available, otherwise fallback to Windows PowerShell.
    if (Get-Command pwsh -ErrorAction SilentlyContinue) { return 'pwsh' }
    return 'powershell'
}

$psExe = Get-PowerShellExe

function Open-Url {
    param([string]$Url)
    try { Start-Process $Url | Out-Null } catch { }
}

function Open-Path {
    param([string]$Path)
    if (Test-Path $Path) {
        Start-Process -FilePath $Path | Out-Null
    }
}

# Runs a process with redirected stdout/stderr and streams to UI output.
# Returns the process object.
function Start-StreamingProcess {
    param(
        [string]$FilePath,
        [string[]]$Arguments,
        [string]$WorkingDirectory,
        [hashtable]$Environment,
        [System.Windows.Controls.TextBox]$OutputTextBox,
        [System.Windows.Window]$Window
    )

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $FilePath
    $psi.WorkingDirectory = $WorkingDirectory
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true

    if ($psi.PSObject.Properties.Name -contains 'ArgumentList') {
        foreach ($a in $Arguments) { $null = $psi.ArgumentList.Add($a) }
    } else {
        function Quote-Arg([string]$s) {
            if ($s -match '[\s"]') {
                return '"' + ($s -replace '"','\\"') + '"'
            }
            return $s
        }
        $psi.Arguments = ($Arguments | ForEach-Object { Quote-Arg $_ }) -join ' '
    }

    if ($Environment) {
        foreach ($k in $Environment.Keys) {
            if ($psi.PSObject.Properties.Name -contains 'Environment') {
                $psi.Environment[$k] = [string]$Environment[$k]
            } else {
                $psi.EnvironmentVariables[$k] = [string]$Environment[$k]
            }
        }
    }

    $p = New-Object System.Diagnostics.Process
    $p.StartInfo = $psi
    $p.EnableRaisingEvents = $true

    $appendLine = {
        param($line)
        if ($null -eq $line) { return }
        $Window.Dispatcher.Invoke([action]{
            $OutputTextBox.AppendText($line + [Environment]::NewLine)
            $OutputTextBox.ScrollToEnd()
        })
    }

    $p.add_OutputDataReceived({ param($sender,$e) & $appendLine $e.Data })
    $p.add_ErrorDataReceived({ param($sender,$e) & $appendLine $e.Data })

    $started = $p.Start()
    if (-not $started) { throw "Failed to start process: $FilePath" }

    $p.BeginOutputReadLine()
    $p.BeginErrorReadLine()

    return $p
}

function NowStamp { (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') }

# ----------------------------
# UI (WPF)
# ----------------------------

Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase
Add-Type -AssemblyName System.Xaml
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName Microsoft.VisualBasic

[xml]$xaml = @'
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Atlas Dev Console" Height="780" Width="1180"
        WindowStartupLocation="CenterScreen" Background="#111827" Foreground="#E5E7EB">
  <Window.Resources>
    <SolidColorBrush x:Key="Accent" Color="#22C55E"/>
    <SolidColorBrush x:Key="Muted" Color="#9CA3AF"/>

    <Style TargetType="Button">
      <Setter Property="Margin" Value="6"/>
      <Setter Property="Padding" Value="10,8"/>
      <Setter Property="Background" Value="#1F2937"/>
      <Setter Property="Foreground" Value="#E5E7EB"/>
      <Setter Property="BorderBrush" Value="#374151"/>
      <Setter Property="BorderThickness" Value="1"/>
      <Setter Property="Cursor" Value="Hand"/>
      <Setter Property="MinWidth" Value="110"/>
      <Setter Property="Template">
        <Setter.Value>
          <ControlTemplate TargetType="Button">
            <Border CornerRadius="8" Background="{TemplateBinding Background}" BorderBrush="{TemplateBinding BorderBrush}" BorderThickness="{TemplateBinding BorderThickness}">
              <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
            </Border>
            <ControlTemplate.Triggers>
              <Trigger Property="IsMouseOver" Value="True">
                <Setter Property="Background" Value="#111C2D"/>
                <Setter Property="BorderBrush" Value="#4B5563"/>
              </Trigger>
              <Trigger Property="IsPressed" Value="True">
                <Setter Property="Background" Value="#0B1220"/>
              </Trigger>
              <Trigger Property="IsEnabled" Value="False">
                <Setter Property="Opacity" Value="0.45"/>
              </Trigger>
            </ControlTemplate.Triggers>
          </ControlTemplate>
        </Setter.Value>
      </Setter>
    </Style>

    <Style TargetType="TextBox">
      <Setter Property="Margin" Value="6"/>
      <Setter Property="Padding" Value="10,8"/>
      <Setter Property="Background" Value="#0B1220"/>
      <Setter Property="Foreground" Value="#E5E7EB"/>
      <Setter Property="BorderBrush" Value="#374151"/>
      <Setter Property="BorderThickness" Value="1"/>
      <Setter Property="FontFamily" Value="Consolas"/>
      <Setter Property="FontSize" Value="12"/>
    </Style>

    <Style TargetType="GroupBox">
      <Setter Property="Margin" Value="10"/>
      <Setter Property="Padding" Value="10"/>
      <Setter Property="BorderBrush" Value="#374151"/>
      <Setter Property="BorderThickness" Value="1"/>
    </Style>

    <Style TargetType="TabItem">
      <Setter Property="Padding" Value="12,8"/>
      <Setter Property="Background" Value="#111827"/>
      <Setter Property="Foreground" Value="#E5E7EB"/>
      <Setter Property="BorderBrush" Value="#374151"/>
      <Setter Property="Template">
        <Setter.Value>
          <ControlTemplate TargetType="TabItem">
            <Border CornerRadius="8,8,0,0" Background="{TemplateBinding Background}" BorderBrush="{TemplateBinding BorderBrush}" BorderThickness="1" Margin="2,0">
              <ContentPresenter Margin="10,6"/>
            </Border>
            <ControlTemplate.Triggers>
              <Trigger Property="IsSelected" Value="True">
                <Setter Property="Background" Value="#1F2937"/>
                <Setter Property="BorderBrush" Value="#4B5563"/>
              </Trigger>
              <Trigger Property="IsMouseOver" Value="True">
                <Setter Property="Background" Value="#0B1220"/>
              </Trigger>
            </ControlTemplate.Triggers>
          </ControlTemplate>
        </Setter.Value>
      </Setter>
    </Style>

    <Style TargetType="TextBlock">
      <Setter Property="Margin" Value="6,2"/>
    </Style>
  </Window.Resources>

  <DockPanel LastChildFill="True">
    <!-- Header -->
    <Border DockPanel.Dock="Top" Background="#0B1220" BorderBrush="#374151" BorderThickness="0,0,0,1" Padding="14">
      <Grid>
        <Grid.ColumnDefinitions>
          <ColumnDefinition Width="*"/>
          <ColumnDefinition Width="Auto"/>
        </Grid.ColumnDefinitions>
        <StackPanel Orientation="Vertical">
          <TextBlock Text="Atlas Dev Console" FontSize="18" FontWeight="SemiBold"/>
          <TextBlock Text="Ops UI for infra, dev and CI toolkits (Docker Compose / Maven / Angular / Playwright)" Foreground="#9CA3AF"/>
        </StackPanel>
        <StackPanel Grid.Column="1" Orientation="Horizontal" VerticalAlignment="Center">
          <Button x:Name="BtnClear" Content="Clear Output"/>
          <Button x:Name="BtnStop" Content="Stop Current"/>
        </StackPanel>
      </Grid>
    </Border>

    <!-- Footer -->
    <Border DockPanel.Dock="Bottom" Background="#0B1220" BorderBrush="#374151" BorderThickness="0,1,0,0" Padding="10">
      <Grid>
        <Grid.ColumnDefinitions>
          <ColumnDefinition Width="*"/>
          <ColumnDefinition Width="Auto"/>
        </Grid.ColumnDefinitions>
        <TextBlock x:Name="TxtStatus" Text="Ready." Foreground="#9CA3AF"/>
        <TextBlock Grid.Column="1" x:Name="TxtContext" Text="" Foreground="#9CA3AF"/>
      </Grid>
    </Border>

    <!-- Main -->
    <Grid Margin="10">
      <Grid.ColumnDefinitions>
        <ColumnDefinition Width="420"/>
        <ColumnDefinition Width="*"/>
      </Grid.ColumnDefinitions>

      <!-- Left: Controls -->
      <StackPanel Grid.Column="0">
        <GroupBox Header="Repository">
          <StackPanel>
            <TextBlock Text="Project root" Foreground="#9CA3AF"/>
            <DockPanel>
              <TextBox x:Name="TxtRepo" MinHeight="28" DockPanel.Dock="Left"/>
              <Button x:Name="BtnBrowse" Content="Browse" MinWidth="90"/>
            </DockPanel>
            <TextBlock x:Name="TxtChecks" Text="" Foreground="#9CA3AF"/>
          </StackPanel>
        </GroupBox>

        <TabControl x:Name="Tabs" Margin="10,0,10,10">
          <TabItem Header="Infra">
            <ScrollViewer VerticalScrollBarVisibility="Auto">
              <StackPanel>
                <TextBlock Text="Docker-first stack (Postgres, Keycloak, backend, ELK, Prometheus/Grafana, Adminer)" Foreground="#9CA3AF"/>
                <WrapPanel>
                  <Button x:Name="BtnInfraUp" Content="Start"/>
                  <Button x:Name="BtnInfraDown" Content="Stop"/>
                  <Button x:Name="BtnInfraDownV" Content="Down -v"/>
                  <Button x:Name="BtnResetDb" Content="Reset DB"/>
                  <Button x:Name="BtnInfraPs" Content="Status"/>
                  <Button x:Name="BtnInfraLogs" Content="Logs (select)"/>
                </WrapPanel>
                <TextBlock Text="Tips: use the Observability tab to open Kibana/Grafana/Prometheus." Foreground="#9CA3AF"/>
              </StackPanel>
            </ScrollViewer>
          </TabItem>

          <TabItem Header="Backend">
            <ScrollViewer VerticalScrollBarVisibility="Auto">
              <StackPanel>
                <TextBlock Text="Spring Boot backend actions" Foreground="#9CA3AF"/>
                <WrapPanel>
                  <Button x:Name="BtnBackendRunDev" Content="Run (dev)"/>
                  <Button x:Name="BtnBackendRunE2e" Content="Run (e2e)"/>
                  <Button x:Name="BtnBackendTest" Content="Tests"/>
                  <Button x:Name="BtnBackendE2eH2" Content="E2E H2"/>
                  <Button x:Name="BtnBackendE2ePg" Content="E2E Postgres"/>
                  <Button x:Name="BtnBackendLint" Content="Spotless?"/>
                </WrapPanel>
                <TextBlock Text="Note: E2E profiles are defined in Maven profiles; Postgres E2E uses Testcontainers." Foreground="#9CA3AF"/>
              </StackPanel>
            </ScrollViewer>
          </TabItem>

          <TabItem Header="Frontend">
            <ScrollViewer VerticalScrollBarVisibility="Auto">
              <StackPanel>
                <TextBlock Text="Angular + Playwright" Foreground="#9CA3AF"/>
                <WrapPanel>
                  <Button x:Name="BtnFrontInstall" Content="npm ci"/>
                  <Button x:Name="BtnFrontStart" Content="Start"/>
                  <Button x:Name="BtnFrontTest" Content="Unit tests"/>
                  <Button x:Name="BtnFrontLint" Content="Lint"/>
                  <Button x:Name="BtnFrontE2eFast" Content="E2E fast"/>
                  <Button x:Name="BtnFrontE2eFull" Content="E2E full"/>
                </WrapPanel>
                <TextBlock Text="Tip: E2E fast expects backend up (or uses mock token per config)." Foreground="#9CA3AF"/>
              </StackPanel>
            </ScrollViewer>
          </TabItem>

          <TabItem Header="CI / Tests">
            <ScrollViewer VerticalScrollBarVisibility="Auto">
              <StackPanel>
                <TextBlock Text="Use repository toolkits to validate build and tests." Foreground="#9CA3AF"/>
                <WrapPanel>
                  <Button x:Name="BtnFullSuite" Content="Full suite"/>
                  <Button x:Name="BtnGenReport" Content="Generate report"/>
                  <Button x:Name="BtnOpenReports" Content="Open reports"/>
                </WrapPanel>
                <TextBlock Text="Full suite: scripts/run-full-test-suite.ps1" Foreground="#9CA3AF"/>
              </StackPanel>
            </ScrollViewer>
          </TabItem>

          <TabItem Header="Observability">
            <ScrollViewer VerticalScrollBarVisibility="Auto">
              <StackPanel>
                <TextBlock Text="Open local UIs and quick health checks (per RUNBOOK_OBSERVABILITY.md)." Foreground="#9CA3AF"/>
                <WrapPanel>
                  <Button x:Name="BtnOpenBackend" Content="Backend"/>
                  <Button x:Name="BtnOpenSwagger" Content="Swagger"/>
                  <Button x:Name="BtnOpenHealth" Content="Health"/>
                  <Button x:Name="BtnOpenKeycloak" Content="Keycloak"/>
                  <Button x:Name="BtnOpenAdminer" Content="Adminer"/>
                </WrapPanel>
                <WrapPanel>
                  <Button x:Name="BtnOpenKibana" Content="Kibana"/>
                  <Button x:Name="BtnOpenGrafana" Content="Grafana"/>
                  <Button x:Name="BtnOpenProm" Content="Prometheus"/>
                  <Button x:Name="BtnOpenElastic" Content="Elasticsearch"/>
                </WrapPanel>
              </StackPanel>
            </ScrollViewer>
          </TabItem>

        </TabControl>
      </StackPanel>

      <!-- Right: Output -->
      <GroupBox Grid.Column="1" Header="Output">
        <Grid>
          <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
          </Grid.RowDefinitions>
          <DockPanel Grid.Row="0">
            <TextBlock Text="Command output (stdout/stderr)" Foreground="#9CA3AF"/>
          </DockPanel>
          <TextBox Grid.Row="1" x:Name="TxtOutput" AcceptsReturn="True" AcceptsTab="True" VerticalScrollBarVisibility="Auto" HorizontalScrollBarVisibility="Auto" TextWrapping="NoWrap" IsReadOnly="True"/>
        </Grid>
      </GroupBox>
    </Grid>
  </DockPanel>
</Window>
'@

$reader = New-Object System.Xml.XmlNodeReader $xaml
$window = [Windows.Markup.XamlReader]::Load($reader)

# Find named controls
$find = { param($name) $window.FindName($name) }

$txtRepo     = & $find 'TxtRepo'
$btnBrowse   = & $find 'BtnBrowse'
$txtOutput   = & $find 'TxtOutput'
$txtStatus   = & $find 'TxtStatus'
$txtContext  = & $find 'TxtContext'
$txtChecks   = & $find 'TxtChecks'
$btnClear    = & $find 'BtnClear'
$btnStop     = & $find 'BtnStop'

$btnInfraUp  = & $find 'BtnInfraUp'
$btnInfraDown = & $find 'BtnInfraDown'
$btnInfraDownV = & $find 'BtnInfraDownV'
$btnResetDb  = & $find 'BtnResetDb'
$btnInfraPs  = & $find 'BtnInfraPs'
$btnInfraLogs = & $find 'BtnInfraLogs'

$btnBackendRunDev = & $find 'BtnBackendRunDev'
$btnBackendRunE2e = & $find 'BtnBackendRunE2e'
$btnBackendTest = & $find 'BtnBackendTest'
$btnBackendE2eH2 = & $find 'BtnBackendE2eH2'
$btnBackendE2ePg = & $find 'BtnBackendE2ePg'
$btnBackendLint = & $find 'BtnBackendLint'

$btnFrontInstall = & $find 'BtnFrontInstall'
$btnFrontStart = & $find 'BtnFrontStart'
$btnFrontTest = & $find 'BtnFrontTest'
$btnFrontLint = & $find 'BtnFrontLint'
$btnFrontE2eFast = & $find 'BtnFrontE2eFast'
$btnFrontE2eFull = & $find 'BtnFrontE2eFull'

$btnFullSuite = & $find 'BtnFullSuite'
$btnGenReport = & $find 'BtnGenReport'
$btnOpenReports = & $find 'BtnOpenReports'

$btnOpenBackend = & $find 'BtnOpenBackend'
$btnOpenSwagger = & $find 'BtnOpenSwagger'
$btnOpenHealth = & $find 'BtnOpenHealth'
$btnOpenKeycloak = & $find 'BtnOpenKeycloak'
$btnOpenAdminer = & $find 'BtnOpenAdminer'
$btnOpenKibana = & $find 'BtnOpenKibana'
$btnOpenGrafana = & $find 'BtnOpenGrafana'
$btnOpenProm = & $find 'BtnOpenProm'
$btnOpenElastic = & $find 'BtnOpenElastic'

# ----------------------------
# Runtime state
# ----------------------------

$repoRoot = Resolve-RepoRoot $PSScriptRoot
$txtRepo.Text = $repoRoot
$txtContext.Text = "Repo: $repoRoot"

$currentProcess = $null

function Set-Status([string]$message) {
    $txtStatus.Text = $message
}

function Append-Out([string]$line) {
    $txtOutput.AppendText($line + [Environment]::NewLine)
    $txtOutput.ScrollToEnd()
}

function Clear-Out {
    $txtOutput.Clear()
}

function Stop-CurrentProcess {
    if ($null -ne $currentProcess -and -not $currentProcess.HasExited) {
        try {
            Append-Out "[$(NowStamp)] Stopping process pid=$($currentProcess.Id) ..."
            $currentProcess.Kill($true)
        } catch {
            Append-Out "[$(NowStamp)] Stop failed: $_"
        }
    }
    $currentProcess = $null
}

function Update-Checks {
    param([string]$Root)

    $compose = Get-ComposeCommand
    $checks = @()

    if ($compose) {
        $checks += "Docker Compose: OK ($($compose.Type))"
    } else {
        $checks += "Docker Compose: NOT FOUND (install Docker Desktop + Compose)"
    }

    # Java
    try {
        $j = & java -version 2>&1 | Select-Object -First 1
        $checks += "Java: OK ($j)"
    } catch {
        $checks += "Java: NOT FOUND"
    }

    # Node
    try {
        $n = & node -v 2>$null
        $checks += "Node: OK ($n)"
    } catch { $checks += "Node: NOT FOUND" }

    # NPM
    try {
        $npm = & npm -v 2>$null
        $checks += "npm: OK ($npm)"
    } catch { $checks += "npm: NOT FOUND" }

    $txtChecks.Text = ($checks -join "  |  ")
}

Update-Checks $repoRoot

function Invoke-Tool {
    param(
        [string]$Title,
        [string]$WorkingDir,
        [string]$Command,
        [string[]]$Args,
        [hashtable]$Env
    )

    Stop-CurrentProcess

    Append-Out ""
    Append-Out "[$(NowStamp)] === $Title ==="
    Append-Out "[$(NowStamp)] cwd: $WorkingDir"
    Append-Out "[$(NowStamp)] cmd: $Command $($Args -join ' ')"

    Set-Status "Running: $Title"

    try {
        $currentProcess = Start-StreamingProcess -FilePath $Command -Arguments $Args -WorkingDirectory $WorkingDir -Environment $Env -OutputTextBox $txtOutput -Window $window
        $pid = $currentProcess.Id
        Append-Out "[$(NowStamp)] Started pid=$pid"

        Register-ObjectEvent -InputObject $currentProcess -EventName Exited -Action {
            $window.Dispatcher.Invoke([action]{
                Set-Status "Ready."
            })
        } | Out-Null

    } catch {
        Append-Out "[$(NowStamp)] ERROR: $_"
        Set-Status "Error."
        $currentProcess = $null
    }
}

# ----------------------------
# Actions
# ----------------------------

function Get-Paths {
    param([string]$Root)
    return @{
        Root = $Root
        Infra = Join-Path $Root 'infra'
        Backend = Join-Path $Root 'backend'
        Frontend = Join-Path $Root 'frontend'
        Scripts = Join-Path $Root 'scripts'
        Reports = Join-Path $Root 'test-reports'
    }
}

function Require-RepoStructure {
    param([hashtable]$Paths)
    foreach ($k in @('Infra','Backend','Frontend','Scripts')) {
        if (-not (Test-Path $Paths[$k])) {
            throw "Expected folder not found: $($Paths[$k])"
        }
    }
}

# Infra
$btnInfraUp.Add_Click({
    $repoRoot = $txtRepo.Text
    $paths = Get-Paths $repoRoot
    Require-RepoStructure $paths

    $compose = Get-ComposeCommand
    if (-not $compose) { Append-Out "Docker Compose not found."; return }

    Invoke-Tool -Title 'Infra: docker compose up -d' -WorkingDir $paths.Infra -Command $compose.Command -Args ($compose.ArgsPrefix + @('up','-d')) -Env @{}
})

$btnInfraDown.Add_Click({
    $repoRoot = $txtRepo.Text
    $paths = Get-Paths $repoRoot
    Require-RepoStructure $paths

    $compose = Get-ComposeCommand
    if (-not $compose) { Append-Out "Docker Compose not found."; return }

    Invoke-Tool -Title 'Infra: docker compose down' -WorkingDir $paths.Infra -Command $compose.Command -Args ($compose.ArgsPrefix + @('down')) -Env @{}
})

$btnInfraDownV.Add_Click({
    $repoRoot = $txtRepo.Text
    $paths = Get-Paths $repoRoot
    Require-RepoStructure $paths

    $compose = Get-ComposeCommand
    if (-not $compose) { Append-Out "Docker Compose not found."; return }

    Invoke-Tool -Title 'Infra: docker compose down -v' -WorkingDir $paths.Infra -Command $compose.Command -Args ($compose.ArgsPrefix + @('down','-v')) -Env @{}
})

$btnInfraPs.Add_Click({
    $repoRoot = $txtRepo.Text
    $paths = Get-Paths $repoRoot
    Require-RepoStructure $paths

    $compose = Get-ComposeCommand
    if (-not $compose) { Append-Out "Docker Compose not found."; return }

    Invoke-Tool -Title 'Infra: docker compose ps' -WorkingDir $paths.Infra -Command $compose.Command -Args ($compose.ArgsPrefix + @('ps')) -Env @{}
})

$btnResetDb.Add_Click({
    $repoRoot = $txtRepo.Text
    $paths = Get-Paths $repoRoot
    Require-RepoStructure $paths

    $compose = Get-ComposeCommand
    if (-not $compose) { Append-Out "Docker Compose not found."; return }

    # Compose detection already done in GUI; reuse its type (plugin vs legacy)
    $script = @'
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Set-Location "__INFRA_DIR__"

# Compose shim (so we can call either 'docker compose' or 'docker-compose')
$composeType = "__COMPOSE_TYPE__"
if ($composeType -eq 'plugin') {
  $composeCmd = 'docker'
  $composePrefix = @('compose')
} else {
  $composeCmd = 'docker-compose'
  $composePrefix = @()
}
function Invoke-Compose {
  param([Parameter(Mandatory=$true)][string[]]$Args)
  & $composeCmd @($composePrefix + $Args)
}

Write-Host 'Stopping stack...' -ForegroundColor Yellow
Invoke-Compose @('down')

Write-Host 'Removing postgres volume (postgres_data)...' -ForegroundColor Yellow
try { docker volume rm postgres_data 2>$null | Out-Null } catch { }

Write-Host 'Starting stack...' -ForegroundColor Yellow
Invoke-Compose @('up','-d')

Write-Host 'Waiting for Postgres to be healthy...' -ForegroundColor Yellow
$max = 120
for ($i=0; $i -lt $max; $i++) {
  $out = (Invoke-Compose @('ps') | Out-String)
  if ($out -match 'postgres' -and $out -match 'healthy') { break }
  Start-Sleep -Seconds 1
}

Invoke-Compose @('ps')
Write-Host 'DB reset complete.' -ForegroundColor Green
'@

    $script = $script.Replace('__INFRA_DIR__', $paths.Infra).Replace('__COMPOSE_TYPE__', $compose.Type)

    Invoke-Tool -Title 'Infra: Reset DB' -WorkingDir $paths.Infra -Command $psExe -Args @('-NoProfile','-ExecutionPolicy','Bypass','-Command',$script) -Env @{}
})

$btnInfraLogs.Add_Click({
    $repoRoot = $txtRepo.Text
    $paths = Get-Paths $repoRoot
    Require-RepoStructure $paths

    $compose = Get-ComposeCommand
    if (-not $compose) { Append-Out "Docker Compose not found."; return }

    # Ask user for a service name
    $service = [Microsoft.VisualBasic.Interaction]::InputBox('Service name (e.g., backend, postgres, keycloak, kibana):','Docker logs','backend')
    if ([string]::IsNullOrWhiteSpace($service)) { return }

    # Open logs in a separate console to avoid flooding the GUI
    $cmd = "$($compose.Command) $($compose.ArgsPrefix -join ' ') logs -f $service"
    Append-Out "[$(NowStamp)] Opening logs in a new PowerShell window: $cmd"
    Start-Process -FilePath $psExe -ArgumentList @('-NoExit','-Command',"Set-Location '$($paths.Infra)'; $cmd") | Out-Null
})

# Backend
$btnBackendRunDev.Add_Click({
    $repoRoot = $txtRepo.Text
    $paths = Get-Paths $repoRoot
    Require-RepoStructure $paths

    $mvn = Get-MavenCommand $paths.Backend
    $env = @{ 'SPRING_PROFILES_ACTIVE' = 'dev' }
    Invoke-Tool -Title 'Backend: spring-boot:run (dev)' -WorkingDir $paths.Backend -Command $mvn.Command -Args ($mvn.ArgsPrefix + @('spring-boot:run')) -Env $env
})

$btnBackendRunE2e.Add_Click({
    $repoRoot = $txtRepo.Text
    $paths = Get-Paths $repoRoot
    Require-RepoStructure $paths

    $mvn = Get-MavenCommand $paths.Backend
    $env = @{ 'SPRING_PROFILES_ACTIVE' = 'e2e' }
    Invoke-Tool -Title 'Backend: spring-boot:run (e2e)' -WorkingDir $paths.Backend -Command $mvn.Command -Args ($mvn.ArgsPrefix + @('spring-boot:run')) -Env $env
})

$btnBackendTest.Add_Click({
    $repoRoot = $txtRepo.Text
    $paths = Get-Paths $repoRoot
    Require-RepoStructure $paths

    $mvn = Get-MavenCommand $paths.Backend
    Invoke-Tool -Title 'Backend: mvn test' -WorkingDir $paths.Backend -Command $mvn.Command -Args ($mvn.ArgsPrefix + @('test')) -Env @{}
})

$btnBackendE2eH2.Add_Click({
    $repoRoot = $txtRepo.Text
    $paths = Get-Paths $repoRoot
    Require-RepoStructure $paths

    $mvn = Get-MavenCommand $paths.Backend
    Invoke-Tool -Title 'Backend: E2E H2 (profile backend-e2e-h2)' -WorkingDir $paths.Backend -Command $mvn.Command -Args ($mvn.ArgsPrefix + @('clean','test','-Pbackend-e2e-h2')) -Env @{}
})

$btnBackendE2ePg.Add_Click({
    $repoRoot = $txtRepo.Text
    $paths = Get-Paths $repoRoot
    Require-RepoStructure $paths

    $mvn = Get-MavenCommand $paths.Backend
    Invoke-Tool -Title 'Backend: E2E Postgres (profile backend-e2e-postgres)' -WorkingDir $paths.Backend -Command $mvn.Command -Args ($mvn.ArgsPrefix + @('clean','test','-Pbackend-e2e-postgres')) -Env @{}
})

$btnBackendLint.Add_Click({
    Append-Out "[$(NowStamp)] Spotless/format step is not wired here by default. If you use Spotless, add a button mapping to 'mvn spotless:check' or 'spotless:apply'."
})

# Frontend
$btnFrontInstall.Add_Click({
    $repoRoot = $txtRepo.Text
    $paths = Get-Paths $repoRoot
    Require-RepoStructure $paths

    Invoke-Tool -Title 'Frontend: npm ci' -WorkingDir $paths.Frontend -Command 'npm' -Args @('ci') -Env @{}
})

$btnFrontStart.Add_Click({
    $repoRoot = $txtRepo.Text
    $paths = Get-Paths $repoRoot
    Require-RepoStructure $paths

    Invoke-Tool -Title 'Frontend: npm start' -WorkingDir $paths.Frontend -Command 'npm' -Args @('run','start') -Env @{}
})

$btnFrontTest.Add_Click({
    $repoRoot = $txtRepo.Text
    $paths = Get-Paths $repoRoot
    Require-RepoStructure $paths

    Invoke-Tool -Title 'Frontend: npm test' -WorkingDir $paths.Frontend -Command 'npm' -Args @('run','test') -Env @{}
})

$btnFrontLint.Add_Click({
    $repoRoot = $txtRepo.Text
    $paths = Get-Paths $repoRoot
    Require-RepoStructure $paths

    Invoke-Tool -Title 'Frontend: npm run lint' -WorkingDir $paths.Frontend -Command 'npm' -Args @('run','lint') -Env @{}
})

$btnFrontE2eFast.Add_Click({
    $repoRoot = $txtRepo.Text
    $paths = Get-Paths $repoRoot
    Require-RepoStructure $paths

    Invoke-Tool -Title 'Frontend: npm run e2e:fast' -WorkingDir $paths.Frontend -Command 'npm' -Args @('run','e2e:fast') -Env @{}
})

$btnFrontE2eFull.Add_Click({
    $repoRoot = $txtRepo.Text
    $paths = Get-Paths $repoRoot
    Require-RepoStructure $paths

    Invoke-Tool -Title 'Frontend: npm run e2e:full' -WorkingDir $paths.Frontend -Command 'npm' -Args @('run','e2e:full') -Env @{}
})

# CI / Tests
$btnFullSuite.Add_Click({
    $repoRoot = $txtRepo.Text
    $paths = Get-Paths $repoRoot
    Require-RepoStructure $paths

    $suite = Join-Path $paths.Scripts 'run-full-test-suite.ps1'
    if (-not (Test-Path $suite)) { Append-Out "run-full-test-suite.ps1 not found."; return }

    Invoke-Tool -Title 'CI: run-full-test-suite.ps1' -WorkingDir $paths.Root -Command $psExe -Args @('-ExecutionPolicy','Bypass','-File',$suite) -Env @{}
})

$btnGenReport.Add_Click({
    $repoRoot = $txtRepo.Text
    $paths = Get-Paths $repoRoot
    Require-RepoStructure $paths

    $gen = Join-Path $paths.Scripts 'generate-test-report.ps1'
    if (-not (Test-Path $gen)) { Append-Out "generate-test-report.ps1 not found."; return }

    Invoke-Tool -Title 'CI: generate-test-report.ps1' -WorkingDir $paths.Root -Command $psExe -Args @('-ExecutionPolicy','Bypass','-File',$gen) -Env @{}
})

$btnOpenReports.Add_Click({
    $repoRoot = $txtRepo.Text
    $reports = Join-Path $repoRoot 'test-reports'
    if (-not (Test-Path $reports)) { New-Item -ItemType Directory -Path $reports | Out-Null }
    Start-Process explorer.exe -ArgumentList @($reports) | Out-Null
})

# Observability links
$btnOpenBackend.Add_Click({ Open-Url 'http://localhost:8080' })
$btnOpenSwagger.Add_Click({ Open-Url 'http://localhost:8080/swagger-ui' })
$btnOpenHealth.Add_Click({ Open-Url 'http://localhost:8080/actuator/health' })
$btnOpenKeycloak.Add_Click({ Open-Url 'http://localhost:8081' })
$btnOpenAdminer.Add_Click({ Open-Url 'http://localhost:8082' })
$btnOpenKibana.Add_Click({ Open-Url 'http://localhost:5601' })
$btnOpenGrafana.Add_Click({ Open-Url 'http://localhost:3000' })
$btnOpenProm.Add_Click({ Open-Url 'http://localhost:9090' })
$btnOpenElastic.Add_Click({ Open-Url 'http://localhost:9200' })

# Header buttons
$btnClear.Add_Click({ Clear-Out; Set-Status 'Ready.' })
$btnStop.Add_Click({ Stop-CurrentProcess; Set-Status 'Ready.' })

# Browse
$btnBrowse.Add_Click({
    $dlg = New-Object System.Windows.Forms.FolderBrowserDialog
    $dlg.Description = 'Select Atlas repository root'
    $dlg.SelectedPath = $txtRepo.Text
    if ($dlg.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        $root = $dlg.SelectedPath
        $txtRepo.Text = $root
        $txtContext.Text = "Repo: $root"
        Update-Checks $root
        Append-Out "[$(NowStamp)] Repo root set to: $root"
    }
})

# Shutdown cleanup
$window.Add_Closing({ Stop-CurrentProcess })

# First message
Append-Out "[$(NowStamp)] Ready. See docs/RUNBOOK_OBSERVABILITY.md and docs/atlas-immobilier/03_technique/17_runbook_dev_deploy_mvp.md for reference." 

# Show window
$null = $window.ShowDialog()
