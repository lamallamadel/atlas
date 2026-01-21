#requires -Version 5.1
<#[
Atlas Dev Console (Windows GUI) - v1.1.0

Purpose
- Provide a Windows GUI to operate the Atlas dev environment and CI toolkits.
- Autodetects the repository structure and available scripts to avoid command drift.

Run
  Windows PowerShell:
    powershell -ExecutionPolicy Bypass -File .\AtlasDevConsole_v1.1.0.ps1

  PowerShell 7:
    pwsh -Sta -ExecutionPolicy Bypass -File .\AtlasDevConsole_v1.1.0.ps1

Notes
- WPF requires an STA thread. If not STA, the script will relaunch itself with -STA.
- Docker Compose detection prefers `docker compose` and falls back to `docker-compose`.
#>

$ErrorActionPreference = 'Stop'

# ----------------------------
# STA + Windows guards
# ----------------------------

function Assert-Windows {
    $isWin = $false
    if (Get-Variable -Name IsWindows -Scope Global -ErrorAction SilentlyContinue) {
        $isWin = [bool]$IsWindows
    } else {
        $isWin = ($env:OS -like '*Windows*')
    }
    if (-not $isWin) {
        throw 'This GUI requires Windows (WPF).'
    }
}

Assert-Windows

try {
    $apt = [System.Threading.Thread]::CurrentThread.ApartmentState
    if ($apt -ne [System.Threading.ApartmentState]::STA) {
        $self = $PSCommandPath
        $args = @('-NoProfile','-ExecutionPolicy','Bypass','-STA','-File', $self)
        Start-Process -FilePath 'powershell.exe' -ArgumentList $args -WorkingDirectory (Get-Location).Path | Out-Null
        exit 0
    }
} catch {
    # ignore
}

Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase
Add-Type -AssemblyName System.Windows.Forms

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
    try {
        $null = & docker compose version 2>$null
        return @{ Command = 'docker'; ArgsPrefix = @('compose'); Kind = 'plugin' }
    } catch {
        try {
            $null = & docker-compose version 2>$null
            return @{ Command = 'docker-compose'; ArgsPrefix = @(); Kind = 'legacy' }
        } catch {
            return $null
        }
    }
}

function Get-MavenCommand {
    param([string]$BackendDir)

    $mvnwCmd = Join-Path $BackendDir 'mvnw.cmd'
    $mvnCmd  = Join-Path $BackendDir 'mvn.cmd'

    if (Test-Path $mvnwCmd) { return @{ Command = $mvnwCmd; ArgsPrefix = @() } }
    if (Test-Path $mvnCmd)  { return @{ Command = $mvnCmd; ArgsPrefix = @() } }

    return @{ Command = 'mvn'; ArgsPrefix = @() }
}

function Get-FrontendInfo {
    param([string]$FrontendDir)

    $pkgJson = Join-Path $FrontendDir 'package.json'
    $info = [ordered]@{
        Exists = (Test-Path $pkgJson)
        PackageManager = 'npm'
        InstallArgs = @('install')
        Scripts = @()
    }

    if (-not $info.Exists) { return $info }

    # Pick package manager based on lock file presence
    if (Test-Path (Join-Path $FrontendDir 'pnpm-lock.yaml')) {
        $info.PackageManager = 'pnpm'
        $info.InstallArgs = @('install')
    } elseif (Test-Path (Join-Path $FrontendDir 'yarn.lock')) {
        $info.PackageManager = 'yarn'
        $info.InstallArgs = @('install')
    } else {
        $info.PackageManager = 'npm'
        # npm ci only when package-lock exists
        if (Test-Path (Join-Path $FrontendDir 'package-lock.json')) {
            $info.InstallArgs = @('ci')
        } else {
            $info.InstallArgs = @('install')
        }
    }

    try {
        $json = Get-Content $pkgJson -Raw | ConvertFrom-Json
        if ($json.scripts) {
            $info.Scripts = @($json.scripts.PSObject.Properties.Name | Sort-Object)
        }
    } catch {
        $info.Scripts = @()
    }

    return $info
}

function Test-SpotlessConfigured {
    param([string]$PomPath)
    if (-not (Test-Path $PomPath)) { return $false }
    try {
        $hit = Select-String -Path $PomPath -Pattern 'spotless' -SimpleMatch -Quiet
        return [bool]$hit
    } catch {
        return $false
    }
}

function Start-StreamingProcess {
    param(
        [string]$FilePath,
        [string[]]$Arguments,
        [string]$WorkingDirectory,
        [System.Windows.Controls.TextBox]$OutputTextBox,
        [System.Windows.Controls.TextBlock]$StatusTextBlock,
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
            if ($s -match '[\s"]') { return '"' + ($s -replace '"','\\"') + '"' }
            return $s
        }
        $psi.Arguments = ($Arguments | ForEach-Object { Quote-Arg $_ }) -join ' '
    }

    $p = New-Object System.Diagnostics.Process
    $p.StartInfo = $psi

    $append = {
        param([string]$line)
        if ([string]::IsNullOrEmpty($line)) { return }
        $Window.Dispatcher.Invoke([action] {
            $OutputTextBox.AppendText($line + [Environment]::NewLine)
            $OutputTextBox.ScrollToEnd()
        }) | Out-Null
    }

    $Window.Dispatcher.Invoke([action] {
        $StatusTextBlock.Text = 'Running...'
    }) | Out-Null

    $p.add_OutputDataReceived({ if ($_.Data) { & $append $_.Data } })
    $p.add_ErrorDataReceived({ if ($_.Data) { & $append ('[ERR] ' + $_.Data) } })

    $null = $p.Start()
    $p.BeginOutputReadLine()
    $p.BeginErrorReadLine()

    Register-ObjectEvent -InputObject $p -EventName Exited -Action {
        try {
            $Window.Dispatcher.Invoke([action] {
                $StatusTextBlock.Text = 'Ready.'
            }) | Out-Null
        } catch {}
    } | Out-Null

    return $p
}

function Append-Header {
    param(
        [System.Windows.Controls.TextBox]$OutputTextBox,
        [System.Windows.Window]$Window,
        [string]$Title,
        [string]$CommandLine
    )

    $Window.Dispatcher.Invoke([action] {
        $OutputTextBox.AppendText('')
        $OutputTextBox.AppendText('===== ' + $Title + ' =====' + [Environment]::NewLine)
        if ($CommandLine) {
            $OutputTextBox.AppendText($CommandLine + [Environment]::NewLine)
        }
        $OutputTextBox.ScrollToEnd()
    }) | Out-Null
}

function Get-ComposeBaseArgs {
    param(
        [string]$RepoRoot,
        [string]$Mode
    )

    $infra = Join-Path $RepoRoot 'infra'
    $base = Join-Path $infra 'docker-compose.yml'
    $e2e = Join-Path $infra 'docker-compose.e2e-postgres.yml'

    if ($Mode -eq 'E2E-Postgres') {
        return @('-f', $base, '-f', $e2e)
    }
    return @('-f', $base)
}

function Get-ComposeServices {
    param(
        [hashtable]$Compose,
        [string]$RepoRoot,
        [string]$Mode
    )

    if (-not $Compose) { return @() }
    $infra = Join-Path $RepoRoot 'infra'

    $args = @()
    $args += $Compose.ArgsPrefix
    $args += (Get-ComposeBaseArgs -RepoRoot $RepoRoot -Mode $Mode)
    $args += @('config','--services')

    try {
        $out = & $Compose.Command @args 2>$null
        if ($LASTEXITCODE -ne 0) { return @() }
        $svcs = @($out | Where-Object { $_ -and $_.Trim() -ne '' } | ForEach-Object { $_.Trim() })
        return $svcs
    } catch {
        return @()
    }
}

function Run-Compose {
    param(
        [hashtable]$Compose,
        [string]$RepoRoot,
        [string]$Mode,
        [string[]]$ComposeArgs,
        [System.Windows.Controls.TextBox]$OutputTextBox,
        [System.Windows.Controls.TextBlock]$StatusTextBlock,
        [System.Windows.Window]$Window
    )

    $infra = Join-Path $RepoRoot 'infra'
    $args = @()
    $args += $Compose.ArgsPrefix
    $args += (Get-ComposeBaseArgs -RepoRoot $RepoRoot -Mode $Mode)
    $args += $ComposeArgs

    $cmdLine = ($Compose.Command + ' ' + (($args | ForEach-Object { if ($_ -match '\s') { '"' + $_ + '"' } else { $_ } }) -join ' '))
    Append-Header -OutputTextBox $OutputTextBox -Window $Window -Title 'Compose' -CommandLine $cmdLine

    return Start-StreamingProcess -FilePath $Compose.Command -Arguments $args -WorkingDirectory $infra -OutputTextBox $OutputTextBox -StatusTextBlock $StatusTextBlock -Window $Window
}

function Run-PS1 {
    param(
        [string]$ScriptPath,
        [string]$RepoRoot,
        [System.Windows.Controls.TextBox]$OutputTextBox,
        [System.Windows.Controls.TextBlock]$StatusTextBlock,
        [System.Windows.Window]$Window
    )

    $ps = if (Get-Command pwsh -ErrorAction SilentlyContinue) { 'pwsh' } else { 'powershell' }
    $args = @('-NoProfile','-ExecutionPolicy','Bypass','-File', $ScriptPath)

    $cmdLine = ($ps + ' ' + (($args | ForEach-Object { if ($_ -match '\s') { '"' + $_ + '"' } else { $_ } }) -join ' '))
    Append-Header -OutputTextBox $OutputTextBox -Window $Window -Title 'Toolkit' -CommandLine $cmdLine

    return Start-StreamingProcess -FilePath $ps -Arguments $args -WorkingDirectory $RepoRoot -OutputTextBox $OutputTextBox -StatusTextBlock $StatusTextBlock -Window $Window
}

function Run-Frontend {
    param(
        [hashtable]$FrontendInfo,
        [string]$RepoRoot,
        [string[]]$Args,
        [System.Windows.Controls.TextBox]$OutputTextBox,
        [System.Windows.Controls.TextBlock]$StatusTextBlock,
        [System.Windows.Window]$Window
    )

    $frontendDir = Join-Path $RepoRoot 'frontend'
    $exe = $FrontendInfo.PackageManager

    $cmdLine = ($exe + ' ' + (($Args | ForEach-Object { if ($_ -match '\s') { '"' + $_ + '"' } else { $_ } }) -join ' '))
    Append-Header -OutputTextBox $OutputTextBox -Window $Window -Title 'Frontend' -CommandLine $cmdLine

    return Start-StreamingProcess -FilePath $exe -Arguments $Args -WorkingDirectory $frontendDir -OutputTextBox $OutputTextBox -StatusTextBlock $StatusTextBlock -Window $Window
}

function Run-BackendMaven {
    param(
        [hashtable]$Mvn,
        [string]$RepoRoot,
        [string[]]$Args,
        [System.Windows.Controls.TextBox]$OutputTextBox,
        [System.Windows.Controls.TextBlock]$StatusTextBlock,
        [System.Windows.Window]$Window
    )

    $backendDir = Join-Path $RepoRoot 'backend'
    $exe = $Mvn.Command

    $cmdLine = ($exe + ' ' + (($Args | ForEach-Object { if ($_ -match '\s') { '"' + $_ + '"' } else { $_ } }) -join ' '))
    Append-Header -OutputTextBox $OutputTextBox -Window $Window -Title 'Backend' -CommandLine $cmdLine

    return Start-StreamingProcess -FilePath $exe -Arguments $Args -WorkingDirectory $backendDir -OutputTextBox $OutputTextBox -StatusTextBlock $StatusTextBlock -Window $Window
}

# ----------------------------
# UI (XAML)
# ----------------------------

[xml]$xaml = @'
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Atlas Dev Console" Height="820" Width="1240"
        WindowStartupLocation="CenterScreen" Background="#111827" Foreground="#E5E7EB">
  <Window.Resources>
    <Style TargetType="Button">
      <Setter Property="Margin" Value="6"/>
      <Setter Property="Padding" Value="10,8"/>
      <Setter Property="Background" Value="#1F2937"/>
      <Setter Property="Foreground" Value="#E5E7EB"/>
      <Setter Property="BorderBrush" Value="#374151"/>
      <Setter Property="BorderThickness" Value="1"/>
      <Setter Property="Cursor" Value="Hand"/>
      <Setter Property="MinWidth" Value="120"/>
      <Setter Property="Template">
        <Setter.Value>
          <ControlTemplate TargetType="Button">
            <Border CornerRadius="8" Background="{TemplateBinding Background}" BorderBrush="{TemplateBinding BorderBrush}" BorderThickness="{TemplateBinding BorderThickness}">
              <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
            </Border>
            <ControlTemplate.Triggers>
              <Trigger Property="IsMouseOver" Value="True">
                <Setter Property="Background" Value="#0B1220"/>
                <Setter Property="BorderBrush" Value="#4B5563"/>
              </Trigger>
              <Trigger Property="IsPressed" Value="True">
                <Setter Property="Background" Value="#050A14"/>
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

    <Style TargetType="ComboBox">
      <Setter Property="Margin" Value="6"/>
      <Setter Property="Padding" Value="6"/>
      <Setter Property="Background" Value="#0B1220"/>
      <Setter Property="Foreground" Value="#E5E7EB"/>
      <Setter Property="BorderBrush" Value="#374151"/>
      <Setter Property="BorderThickness" Value="1"/>
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
          <TextBlock Text="Ops UI for infra, dev and CI toolkits (Docker Compose, Maven, Angular, Playwright)" Foreground="#9CA3AF"/>
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
        <ColumnDefinition Width="450"/>
        <ColumnDefinition Width="*"/>
      </Grid.ColumnDefinitions>

      <!-- Left: controls -->
      <StackPanel Grid.Column="0">
        <GroupBox Header="Repository">
          <StackPanel>
            <TextBlock Text="Project root" Foreground="#9CA3AF"/>
            <DockPanel>
              <TextBox x:Name="TxtRepo" MinHeight="28" DockPanel.Dock="Left"/>
              <Button x:Name="BtnBrowse" Content="Browse" MinWidth="90"/>
            </DockPanel>
            <TextBlock x:Name="TxtChecks" Text="" Foreground="#9CA3AF" TextWrapping="Wrap"/>
          </StackPanel>
        </GroupBox>

        <TabControl x:Name="Tabs" Margin="10,0,10,10">
          <TabItem Header="Infra">
            <ScrollViewer VerticalScrollBarVisibility="Auto">
              <StackPanel>
                <TextBlock Text="Docker Compose stacks" Foreground="#9CA3AF"/>
                <DockPanel>
                  <TextBlock Text="Mode" VerticalAlignment="Center" Foreground="#9CA3AF"/>
                  <ComboBox x:Name="CmbStackMode" MinWidth="220" Margin="10,6,6,6"/>
                  <Button x:Name="BtnRefreshServices" Content="Refresh" MinWidth="90"/>
                </DockPanel>

                <WrapPanel>
                  <Button x:Name="BtnInfraUp" Content="Start"/>
                  <Button x:Name="BtnInfraUpBuild" Content="Start --build"/>
                  <Button x:Name="BtnInfraDown" Content="Stop"/>
                  <Button x:Name="BtnInfraDownV" Content="Down -v"/>
                  <Button x:Name="BtnInfraPs" Content="Status"/>
                  <Button x:Name="BtnResetDb" Content="Reset DB"/>
                </WrapPanel>

                <GroupBox Header="Service actions">
                  <StackPanel>
                    <DockPanel>
                      <TextBlock Text="Service" VerticalAlignment="Center" Foreground="#9CA3AF"/>
                      <ComboBox x:Name="CmbService" MinWidth="240" Margin="10,6,6,6"/>
                    </DockPanel>
                    <WrapPanel>
                      <Button x:Name="BtnInfraLogs" Content="Tail logs"/>
                      <Button x:Name="BtnInfraRestartSvc" Content="Restart service"/>
                      <Button x:Name="BtnInfraStopSvc" Content="Stop service"/>
                      <Button x:Name="BtnInfraStartSvc" Content="Start service"/>
                    </WrapPanel>
                    <TextBlock Text="Tip: if backend runs in Docker, use Tail logs on the backend service." Foreground="#9CA3AF" TextWrapping="Wrap"/>
                  </StackPanel>
                </GroupBox>
              </StackPanel>
            </ScrollViewer>
          </TabItem>

          <TabItem Header="Backend">
            <ScrollViewer VerticalScrollBarVisibility="Auto">
              <StackPanel>
                <TextBlock Text="Backend (tests/build locally; runtime often in Docker via Infra)" Foreground="#9CA3AF"/>
                <WrapPanel>
                  <Button x:Name="BtnBackendTest" Content="mvn test"/>
                  <Button x:Name="BtnBackendPackage" Content="mvn package"/>
                  <Button x:Name="BtnBackendSpotless" Content="spotless:check"/>
                </WrapPanel>
                <WrapPanel>
                  <Button x:Name="BtnBackendDockerLogs" Content="Docker logs"/>
                  <Button x:Name="BtnOpenSwagger" Content="Open Swagger"/>
                  <Button x:Name="BtnOpenHealth" Content="Open Health"/>
                </WrapPanel>
                <TextBlock x:Name="TxtBackendHints" Text="" Foreground="#9CA3AF" TextWrapping="Wrap"/>
              </StackPanel>
            </ScrollViewer>
          </TabItem>

          <TabItem Header="Frontend">
            <ScrollViewer VerticalScrollBarVisibility="Auto">
              <StackPanel>
                <TextBlock Text="Angular and Playwright" Foreground="#9CA3AF"/>
                <WrapPanel>
                  <Button x:Name="BtnFrontInstall" Content="Install deps"/>
                  <Button x:Name="BtnFrontStart" Content="Start"/>
                  <Button x:Name="BtnFrontTest" Content="Unit tests"/>
                  <Button x:Name="BtnFrontLint" Content="Lint"/>
                  <Button x:Name="BtnFrontInstallBrowsers" Content="Playwright install"/>
                </WrapPanel>
                <WrapPanel>
                  <Button x:Name="BtnFrontE2eFast" Content="E2E fast"/>
                  <Button x:Name="BtnFrontE2eUi" Content="E2E UI"/>
                  <Button x:Name="BtnFrontE2eFull" Content="E2E full"/>
                </WrapPanel>
                <GroupBox Header="Run any npm script">
                  <StackPanel>
                    <DockPanel>
                      <TextBlock Text="Script" VerticalAlignment="Center" Foreground="#9CA3AF"/>
                      <ComboBox x:Name="CmbNpmScript" MinWidth="240" Margin="10,6,6,6"/>
                      <Button x:Name="BtnRunNpmScript" Content="Run" MinWidth="90"/>
                    </DockPanel>
                    <TextBlock x:Name="TxtFrontHints" Text="" Foreground="#9CA3AF" TextWrapping="Wrap"/>
                  </StackPanel>
                </GroupBox>
              </StackPanel>
            </ScrollViewer>
          </TabItem>

          <TabItem Header="CI / Toolkits">
            <ScrollViewer VerticalScrollBarVisibility="Auto">
              <StackPanel>
                <TextBlock Text="Repository scripts for CI-style validation" Foreground="#9CA3AF"/>
                <WrapPanel>
                  <Button x:Name="BtnFullSuite" Content="Full test suite"/>
                  <Button x:Name="BtnGenReport" Content="Generate report"/>
                  <Button x:Name="BtnOpenReports" Content="Open reports"/>
                </WrapPanel>
                <TextBlock Text="Full suite: scripts/run-full-test-suite.ps1" Foreground="#9CA3AF"/>
                <TextBlock Text="Report: scripts/generate-test-report.ps1 (outputs to ./test-reports)" Foreground="#9CA3AF"/>
              </StackPanel>
            </ScrollViewer>
          </TabItem>

          <TabItem Header="Observability">
            <ScrollViewer VerticalScrollBarVisibility="Auto">
              <StackPanel>
                <TextBlock Text="Open local UIs" Foreground="#9CA3AF"/>
                <WrapPanel>
                  <Button x:Name="BtnOpenFrontend" Content="Frontend"/>
                  <Button x:Name="BtnOpenBackend" Content="Backend"/>
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
          <TextBlock Grid.Row="0" Text="Command output (stdout/stderr)" Foreground="#9CA3AF"/>
          <TextBox Grid.Row="1" x:Name="TxtOutput" AcceptsReturn="True" AcceptsTab="True"
                   VerticalScrollBarVisibility="Auto" HorizontalScrollBarVisibility="Auto"
                   TextWrapping="NoWrap" IsReadOnly="True"/>
        </Grid>
      </GroupBox>

    </Grid>
  </DockPanel>
</Window>
'@

$reader = (New-Object System.Xml.XmlNodeReader $xaml)
$Window = [Windows.Markup.XamlReader]::Load($reader)

# ----------------------------
# Grab controls
# ----------------------------

$TxtRepo = $Window.FindName('TxtRepo')
$BtnBrowse = $Window.FindName('BtnBrowse')
$TxtChecks = $Window.FindName('TxtChecks')
$TxtStatus = $Window.FindName('TxtStatus')
$TxtContext = $Window.FindName('TxtContext')
$TxtOutput = $Window.FindName('TxtOutput')
$BtnClear = $Window.FindName('BtnClear')
$BtnStop = $Window.FindName('BtnStop')

$CmbStackMode = $Window.FindName('CmbStackMode')
$BtnRefreshServices = $Window.FindName('BtnRefreshServices')
$BtnInfraUp = $Window.FindName('BtnInfraUp')
$BtnInfraUpBuild = $Window.FindName('BtnInfraUpBuild')
$BtnInfraDown = $Window.FindName('BtnInfraDown')
$BtnInfraDownV = $Window.FindName('BtnInfraDownV')
$BtnInfraPs = $Window.FindName('BtnInfraPs')
$BtnResetDb = $Window.FindName('BtnResetDb')
$CmbService = $Window.FindName('CmbService')
$BtnInfraLogs = $Window.FindName('BtnInfraLogs')
$BtnInfraRestartSvc = $Window.FindName('BtnInfraRestartSvc')
$BtnInfraStopSvc = $Window.FindName('BtnInfraStopSvc')
$BtnInfraStartSvc = $Window.FindName('BtnInfraStartSvc')

$BtnBackendTest = $Window.FindName('BtnBackendTest')
$BtnBackendPackage = $Window.FindName('BtnBackendPackage')
$BtnBackendSpotless = $Window.FindName('BtnBackendSpotless')
$BtnBackendDockerLogs = $Window.FindName('BtnBackendDockerLogs')
$BtnOpenSwagger = $Window.FindName('BtnOpenSwagger')
$BtnOpenHealth = $Window.FindName('BtnOpenHealth')
$TxtBackendHints = $Window.FindName('TxtBackendHints')

$BtnFrontInstall = $Window.FindName('BtnFrontInstall')
$BtnFrontStart = $Window.FindName('BtnFrontStart')
$BtnFrontTest = $Window.FindName('BtnFrontTest')
$BtnFrontLint = $Window.FindName('BtnFrontLint')
$BtnFrontInstallBrowsers = $Window.FindName('BtnFrontInstallBrowsers')
$BtnFrontE2eFast = $Window.FindName('BtnFrontE2eFast')
$BtnFrontE2eUi = $Window.FindName('BtnFrontE2eUi')
$BtnFrontE2eFull = $Window.FindName('BtnFrontE2eFull')
$CmbNpmScript = $Window.FindName('CmbNpmScript')
$BtnRunNpmScript = $Window.FindName('BtnRunNpmScript')
$TxtFrontHints = $Window.FindName('TxtFrontHints')

$BtnFullSuite = $Window.FindName('BtnFullSuite')
$BtnGenReport = $Window.FindName('BtnGenReport')
$BtnOpenReports = $Window.FindName('BtnOpenReports')

$BtnOpenFrontend = $Window.FindName('BtnOpenFrontend')
$BtnOpenBackend = $Window.FindName('BtnOpenBackend')
$BtnOpenKeycloak = $Window.FindName('BtnOpenKeycloak')
$BtnOpenAdminer = $Window.FindName('BtnOpenAdminer')
$BtnOpenKibana = $Window.FindName('BtnOpenKibana')
$BtnOpenGrafana = $Window.FindName('BtnOpenGrafana')
$BtnOpenProm = $Window.FindName('BtnOpenProm')
$BtnOpenElastic = $Window.FindName('BtnOpenElastic')

# ----------------------------
# State
# ----------------------------

$scriptDir = Split-Path -Parent $PSCommandPath
$RepoRoot = Resolve-RepoRoot -StartPath $scriptDir
$Compose = Get-ComposeCommand
$CurrentProcess = $null

$StackModes = @(
    @{ Key = 'Full'; Name = 'Full (infra/docker-compose.yml)' },
    @{ Key = 'E2E-Postgres'; Name = 'E2E Postgres (base + docker-compose.e2e-postgres.yml)' }
)

# ----------------------------
# UI actions
# ----------------------------

function Set-ChecksText {
    param([string]$RepoRoot)

    $infraOk = Test-Path (Join-Path $RepoRoot 'infra\docker-compose.yml')
    $backendOk = Test-Path (Join-Path $RepoRoot 'backend')
    $frontendOk = Test-Path (Join-Path $RepoRoot 'frontend')
    $scriptsOk = Test-Path (Join-Path $RepoRoot 'scripts')

    $composeTxt = if ($Compose) { ($Compose.Command + ' ' + ($Compose.ArgsPrefix -join ' ')).Trim() } else { 'NOT FOUND' }

    $lines = @()
    $lines += ('Compose: ' + $composeTxt)
    $lines += ('infra/docker-compose.yml: ' + ($(if ($infraOk) { 'OK' } else { 'MISSING' })))
    $lines += ('backend/: ' + ($(if ($backendOk) { 'OK' } else { 'MISSING' })))
    $lines += ('frontend/: ' + ($(if ($frontendOk) { 'OK' } else { 'MISSING' })))
    $lines += ('scripts/: ' + ($(if ($scriptsOk) { 'OK' } else { 'MISSING' })))

    $TxtChecks.Text = ($lines -join "`n")
}

function Refresh-Services {
    $mode = ($CmbStackMode.SelectedItem.Tag)
    $svcs = Get-ComposeServices -Compose $Compose -RepoRoot $RepoRoot -Mode $mode

    $CmbService.Items.Clear()
    $CmbService.Items.Add('(all)') | Out-Null
    foreach ($s in $svcs) { $CmbService.Items.Add($s) | Out-Null }
    $CmbService.SelectedIndex = 0

    $TxtContext.Text = ('Services: ' + ($svcs.Count))
}

function Refresh-FrontendScripts {
    $front = Get-FrontendInfo -FrontendDir (Join-Path $RepoRoot 'frontend')

    $CmbNpmScript.Items.Clear()
    foreach ($s in $front.Scripts) { $CmbNpmScript.Items.Add($s) | Out-Null }
    if ($front.Scripts.Count -gt 0) { $CmbNpmScript.SelectedIndex = 0 }

    $TxtFrontHints.Text = ('Package manager: ' + $front.PackageManager + ' | Install: ' + ($front.InstallArgs -join ' '))
    return $front
}

function Refresh-BackendHints {
    $backendDir = Join-Path $RepoRoot 'backend'
    $pom = Join-Path $backendDir 'pom.xml'
    $spotless = Test-SpotlessConfigured -PomPath $pom
    if ($spotless) {
        $TxtBackendHints.Text = 'Spotless detected in pom.xml.'
    } else {
        $TxtBackendHints.Text = 'Spotless not detected in pom.xml (button may fail if plugin is absent).'
    }
    return $spotless
}

function Ensure-NotRunning {
    if ($CurrentProcess -and -not $CurrentProcess.HasExited) {
        [System.Windows.MessageBox]::Show('A command is already running. Stop it first.', 'Atlas Dev Console') | Out-Null
        return $false
    }
    return $true
}

function Start-Op {
    param([scriptblock]$Runner)

    if (-not (Ensure-NotRunning)) { return }
    try {
        $CurrentProcess = & $Runner
    } catch {
        Append-Header -OutputTextBox $TxtOutput -Window $Window -Title 'ERROR' -CommandLine ($_.Exception.Message)
        $TxtStatus.Text = 'Ready.'
    }
}

# Initialize stack modes
$CmbStackMode.Items.Clear()
foreach ($m in $StackModes) {
    $item = New-Object System.Windows.Controls.ComboBoxItem
    $item.Content = $m.Name
    $item.Tag = $m.Key
    $CmbStackMode.Items.Add($item) | Out-Null
}
$CmbStackMode.SelectedIndex = 0

$TxtRepo.Text = $RepoRoot
Set-ChecksText -RepoRoot $RepoRoot
$FrontendInfo = Refresh-FrontendScripts
$SpotlessConfigured = Refresh-BackendHints
Refresh-Services

# ----------------------------
# Button handlers
# ----------------------------

$BtnBrowse.Add_Click({
    $dlg = New-Object System.Windows.Forms.FolderBrowserDialog
    $dlg.Description = 'Select repository root (the folder containing infra/, backend/, frontend/).'
    $dlg.SelectedPath = $RepoRoot
    if ($dlg.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        $RepoRoot = Resolve-RepoRoot -StartPath $dlg.SelectedPath
        $TxtRepo.Text = $RepoRoot
        Set-ChecksText -RepoRoot $RepoRoot
        $FrontendInfo = Refresh-FrontendScripts
        $SpotlessConfigured = Refresh-BackendHints
        Refresh-Services
    }
})

$BtnRefreshServices.Add_Click({ Refresh-Services })
$CmbStackMode.Add_SelectionChanged({ Refresh-Services })

$BtnClear.Add_Click({ $TxtOutput.Clear() })

$BtnStop.Add_Click({
    try {
        if ($CurrentProcess -and -not $CurrentProcess.HasExited) {
            Append-Header -OutputTextBox $TxtOutput -Window $Window -Title 'Stop' -CommandLine 'Stopping current process...'
            $CurrentProcess.Kill()
        }
    } catch {}
})

# Infra
$BtnInfraUp.Add_Click({
    if (-not $Compose) {
        [System.Windows.MessageBox]::Show('Docker Compose not found. Install Docker Desktop or docker-compose.', 'Atlas Dev Console') | Out-Null
        return
    }
    Start-Op {
        $mode = ($CmbStackMode.SelectedItem.Tag)
        Run-Compose -Compose $Compose -RepoRoot $RepoRoot -Mode $mode -ComposeArgs @('up','-d') -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
    }
})

$BtnInfraUpBuild.Add_Click({
    if (-not $Compose) {
        [System.Windows.MessageBox]::Show('Docker Compose not found. Install Docker Desktop or docker-compose.', 'Atlas Dev Console') | Out-Null
        return
    }
    Start-Op {
        $mode = ($CmbStackMode.SelectedItem.Tag)
        Run-Compose -Compose $Compose -RepoRoot $RepoRoot -Mode $mode -ComposeArgs @('up','-d','--build') -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
    }
})

$BtnInfraDown.Add_Click({
    if (-not $Compose) { return }
    Start-Op {
        $mode = ($CmbStackMode.SelectedItem.Tag)
        Run-Compose -Compose $Compose -RepoRoot $RepoRoot -Mode $mode -ComposeArgs @('down') -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
    }
})

$BtnInfraDownV.Add_Click({
    if (-not $Compose) { return }
    Start-Op {
        $mode = ($CmbStackMode.SelectedItem.Tag)
        Run-Compose -Compose $Compose -RepoRoot $RepoRoot -Mode $mode -ComposeArgs @('down','-v') -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
    }
})

$BtnInfraPs.Add_Click({
    if (-not $Compose) { return }
    Start-Op {
        $mode = ($CmbStackMode.SelectedItem.Tag)
        Run-Compose -Compose $Compose -RepoRoot $RepoRoot -Mode $mode -ComposeArgs @('ps') -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
    }
})

$BtnInfraLogs.Add_Click({
    if (-not $Compose) { return }
    Start-Op {
        $mode = ($CmbStackMode.SelectedItem.Tag)
        $svc = [string]$CmbService.SelectedItem
        $args = @('logs','-f')
        if ($svc -and $svc -ne '(all)') { $args += @($svc) }
        Run-Compose -Compose $Compose -RepoRoot $RepoRoot -Mode $mode -ComposeArgs $args -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
    }
})

$BtnInfraRestartSvc.Add_Click({
    if (-not $Compose) { return }
    $svc = [string]$CmbService.SelectedItem
    if (-not $svc -or $svc -eq '(all)') {
        [System.Windows.MessageBox]::Show('Select a specific service first.', 'Atlas Dev Console') | Out-Null
        return
    }
    Start-Op {
        $mode = ($CmbStackMode.SelectedItem.Tag)
        Run-Compose -Compose $Compose -RepoRoot $RepoRoot -Mode $mode -ComposeArgs @('restart',$svc) -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
    }
})

$BtnInfraStopSvc.Add_Click({
    if (-not $Compose) { return }
    $svc = [string]$CmbService.SelectedItem
    if (-not $svc -or $svc -eq '(all)') {
        [System.Windows.MessageBox]::Show('Select a specific service first.', 'Atlas Dev Console') | Out-Null
        return
    }
    Start-Op {
        $mode = ($CmbStackMode.SelectedItem.Tag)
        Run-Compose -Compose $Compose -RepoRoot $RepoRoot -Mode $mode -ComposeArgs @('stop',$svc) -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
    }
})

$BtnInfraStartSvc.Add_Click({
    if (-not $Compose) { return }
    $svc = [string]$CmbService.SelectedItem
    if (-not $svc -or $svc -eq '(all)') {
        [System.Windows.MessageBox]::Show('Select a specific service first.', 'Atlas Dev Console') | Out-Null
        return
    }
    Start-Op {
        $mode = ($CmbStackMode.SelectedItem.Tag)
        Run-Compose -Compose $Compose -RepoRoot $RepoRoot -Mode $mode -ComposeArgs @('start',$svc) -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
    }
})

$BtnResetDb.Add_Click({
    if (-not $Compose) { return }
    $infra = Join-Path $RepoRoot 'infra'
    $resetWin = Join-Path $infra 'reset-db.ps1'

    Start-Op {
        if (Test-Path $resetWin) {
            Run-PS1 -ScriptPath $resetWin -RepoRoot $RepoRoot -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
        } else {
            $mode = ($CmbStackMode.SelectedItem.Tag)
            # Best-effort destructive reset: down, remove postgres_data, up
            $p1 = Run-Compose -Compose $Compose -RepoRoot $RepoRoot -Mode $mode -ComposeArgs @('down') -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
            try { $p1.WaitForExit() } catch {}

            Append-Header -OutputTextBox $TxtOutput -Window $Window -Title 'Reset' -CommandLine 'docker volume rm postgres_data'
            try {
                $null = & docker volume rm postgres_data 2>$null
            } catch {}

            Run-Compose -Compose $Compose -RepoRoot $RepoRoot -Mode $mode -ComposeArgs @('up','-d','postgres') -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
        }
    }
})

# Backend
$BtnBackendTest.Add_Click({
    Start-Op {
        $mvn = Get-MavenCommand -BackendDir (Join-Path $RepoRoot 'backend')
        Run-BackendMaven -Mvn $mvn -RepoRoot $RepoRoot -Args @('test') -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
    }
})

$BtnBackendPackage.Add_Click({
    Start-Op {
        $mvn = Get-MavenCommand -BackendDir (Join-Path $RepoRoot 'backend')
        Run-BackendMaven -Mvn $mvn -RepoRoot $RepoRoot -Args @('clean','package') -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
    }
})

$BtnBackendSpotless.Add_Click({
    Start-Op {
        $backendDir = Join-Path $RepoRoot 'backend'
        $pom = Join-Path $backendDir 'pom.xml'
        if (-not (Test-SpotlessConfigured -PomPath $pom)) {
            Append-Header -OutputTextBox $TxtOutput -Window $Window -Title 'Notice' -CommandLine 'Spotless not detected in pom.xml; command may fail.'
        }
        $mvn = Get-MavenCommand -BackendDir $backendDir
        Run-BackendMaven -Mvn $mvn -RepoRoot $RepoRoot -Args @('spotless:check') -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
    }
})

$BtnBackendDockerLogs.Add_Click({
    if (-not $Compose) {
        Append-Header -OutputTextBox $TxtOutput -Window $Window -Title 'Compose' -CommandLine 'Docker Compose not found.'
        return
    }
    Start-Op {
        $mode = ($CmbStackMode.SelectedItem.Tag)
        Run-Compose -Compose $Compose -RepoRoot $RepoRoot -Mode $mode -ComposeArgs @('logs','-f','backend') -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
    }
})

$BtnOpenSwagger.Add_Click({ Start-Process 'http://localhost:8080/swagger-ui' | Out-Null })
$BtnOpenHealth.Add_Click({ Start-Process 'http://localhost:8080/actuator/health' | Out-Null })

# Frontend
$BtnFrontInstall.Add_Click({
    $FrontendInfo = Refresh-FrontendScripts
    Start-Op {
        Run-Frontend -FrontendInfo $FrontendInfo -RepoRoot $RepoRoot -Args @($FrontendInfo.InstallArgs) -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
    }
})

$BtnFrontStart.Add_Click({
    $FrontendInfo = Refresh-FrontendScripts
    Start-Op {
        Run-Frontend -FrontendInfo $FrontendInfo -RepoRoot $RepoRoot -Args @('start') -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
    }
})

$BtnFrontTest.Add_Click({
    $FrontendInfo = Refresh-FrontendScripts
    Start-Op {
        Run-Frontend -FrontendInfo $FrontendInfo -RepoRoot $RepoRoot -Args @('run','test') -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
    }
})

$BtnFrontLint.Add_Click({
    $FrontendInfo = Refresh-FrontendScripts
    Start-Op {
        Run-Frontend -FrontendInfo $FrontendInfo -RepoRoot $RepoRoot -Args @('run','lint') -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
    }
})

$BtnFrontInstallBrowsers.Add_Click({
    $FrontendInfo = Refresh-FrontendScripts
    Start-Op {
        Run-Frontend -FrontendInfo $FrontendInfo -RepoRoot $RepoRoot -Args @('run','install-browsers') -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
    }
})

$BtnFrontE2eFast.Add_Click({
    $FrontendInfo = Refresh-FrontendScripts
    Start-Op {
        Run-Frontend -FrontendInfo $FrontendInfo -RepoRoot $RepoRoot -Args @('run','e2e:fast') -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
    }
})

$BtnFrontE2eUi.Add_Click({
    $FrontendInfo = Refresh-FrontendScripts
    Start-Op {
        Run-Frontend -FrontendInfo $FrontendInfo -RepoRoot $RepoRoot -Args @('run','e2e:ui') -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
    }
})

$BtnFrontE2eFull.Add_Click({
    $FrontendInfo = Refresh-FrontendScripts
    Start-Op {
        Run-Frontend -FrontendInfo $FrontendInfo -RepoRoot $RepoRoot -Args @('run','e2e:full') -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
    }
})

$BtnRunNpmScript.Add_Click({
    $FrontendInfo = Refresh-FrontendScripts
    $scriptName = [string]$CmbNpmScript.SelectedItem
    if (-not $scriptName) {
        [System.Windows.MessageBox]::Show('No script selected.', 'Atlas Dev Console') | Out-Null
        return
    }
    Start-Op {
        Run-Frontend -FrontendInfo $FrontendInfo -RepoRoot $RepoRoot -Args @('run', $scriptName) -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
    }
})

# CI / Toolkits
$BtnFullSuite.Add_Click({
    $p = Join-Path $RepoRoot 'scripts\run-full-test-suite.ps1'
    if (-not (Test-Path $p)) {
        [System.Windows.MessageBox]::Show('Missing scripts/run-full-test-suite.ps1', 'Atlas Dev Console') | Out-Null
        return
    }
    Start-Op {
        Run-PS1 -ScriptPath $p -RepoRoot $RepoRoot -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
    }
})

$BtnGenReport.Add_Click({
    $p = Join-Path $RepoRoot 'scripts\generate-test-report.ps1'
    if (-not (Test-Path $p)) {
        [System.Windows.MessageBox]::Show('Missing scripts/generate-test-report.ps1', 'Atlas Dev Console') | Out-Null
        return
    }
    Start-Op {
        Run-PS1 -ScriptPath $p -RepoRoot $RepoRoot -OutputTextBox $TxtOutput -StatusTextBlock $TxtStatus -Window $Window
    }
})

$BtnOpenReports.Add_Click({
    $p = Join-Path $RepoRoot 'test-reports'
    if (-not (Test-Path $p)) {
        New-Item -ItemType Directory -Path $p | Out-Null
    }
    Start-Process -FilePath $p | Out-Null
})

# Observability
$BtnOpenFrontend.Add_Click({ Start-Process 'http://localhost:4200' | Out-Null })
$BtnOpenBackend.Add_Click({ Start-Process 'http://localhost:8080' | Out-Null })
$BtnOpenKeycloak.Add_Click({ Start-Process 'http://localhost:8081' | Out-Null })
$BtnOpenAdminer.Add_Click({ Start-Process 'http://localhost:8082' | Out-Null })
$BtnOpenKibana.Add_Click({ Start-Process 'http://localhost:5601' | Out-Null })
$BtnOpenGrafana.Add_Click({ Start-Process 'http://localhost:3000' | Out-Null })
$BtnOpenProm.Add_Click({ Start-Process 'http://localhost:9090' | Out-Null })
$BtnOpenElastic.Add_Click({ Start-Process 'http://localhost:9200' | Out-Null })

# Close cleanup
$Window.add_Closing({
    try {
        if ($CurrentProcess -and -not $CurrentProcess.HasExited) {
            $CurrentProcess.Kill()
        }
    } catch {}
})

# Show
$Window.ShowDialog() | Out-Null
