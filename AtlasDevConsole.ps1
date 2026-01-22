<#
Atlas Dev Dashboard (v1.3.0)
- WPF GUI to operate dev environment and CI toolkits
- Auto-discovers repo commands (dev*/mak*/setup*/run*/mvn*/maven*, package.json scripts, docker-compose files, Maven, Spring profiles, Playwright project names)
- Observability links inferred from runbooks if possible; falls back to standard localhost endpoints
Compatible: Windows PowerShell 5.1 + PowerShell 7 (STA enforced)
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Restart-InSTA {
  try {
    if ($Host.Runspace.ApartmentState -ne "STA") {
      $exe = (Get-Process -Id $PID).Path
      $args = @()
      if ($PSVersionTable.PSEdition -eq "Core") { $args += "-Sta" }
      $args += "-NoProfile","-ExecutionPolicy","Bypass","-File",$PSCommandPath
      Start-Process -FilePath $exe -ArgumentList $args -WorkingDirectory (Get-Location) | Out-Null
      exit
    }
  } catch { }
}
Restart-InSTA

Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase, System.Xaml

# ----------------------------
# Utilities
# ----------------------------
function First-NotNull {
  param([object[]]$Items)
  foreach ($i in $Items) { if ($null -ne $i) { return $i } }
  return $null
}

function Try-ReadText([string]$Path) {
  try { Get-Content -LiteralPath $Path -Raw -ErrorAction Stop } catch { $null }
}

function Safe-InvokeItem([string]$PathOrUrl) {
  try { Start-Process $PathOrUrl | Out-Null } catch { }
}

function Get-CommandExists([string]$Name) {
  [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Find-RepoRoot([string]$StartDir) {
  $dir = Resolve-Path -LiteralPath $StartDir -ErrorAction Stop | Select-Object -First 1
  $current = [System.IO.DirectoryInfo]$dir.Path
  while ($null -ne $current) {
    $markers = @(".git","infra","backend","frontend","pom.xml","package.json","docs")
    foreach ($m in $markers) {
      if (Test-Path (Join-Path $current.FullName $m)) { return $current.FullName }
    }
    $current = $current.Parent
  }
  return (Resolve-Path -LiteralPath $StartDir -ErrorAction Stop | Select-Object -First 1 -ExpandProperty Path)
}

function New-Action([string]$Category,[string]$Title,[string]$Command,[string]$Args,[string]$WorkDir,[string]$Source,[string]$Kind) {
  [PSCustomObject]@{
    Category = $Category
    Title    = $Title
    Command  = $Command
    Args     = $Args
    WorkDir  = $WorkDir
    Source   = $Source
    Kind     = $Kind   # Script | Npm | Maven | Docker | Doc | Link
  }
}


function To-Array {
  param([object]$Value)
  if ($null -eq $Value) { return @() }
  if ($Value -is [string]) { return @($Value) }
  if ($Value -is [System.Array]) { return $Value }
  try { return @($Value) } catch { return @($Value) }
}

# ----------------------------
# Discovery
# ----------------------------
function Discover-Compose([string]$RepoRoot) {
  $actions = New-Object System.Collections.Generic.List[object]
  $infraDir = Join-Path $RepoRoot "infra"

  $composeFiles = @()
  if (Test-Path $infraDir) {
    $composeFiles += Get-ChildItem -Path $infraDir -Filter "docker-compose*.yml"  -File -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName
    $composeFiles += Get-ChildItem -Path $infraDir -Filter "docker-compose*.yaml" -File -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName
  }

  if (@($composeFiles).Count -eq 0) {
    $composeFiles += Get-ChildItem -Path $RepoRoot -Filter "docker-compose*.yml"  -File -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName
    $composeFiles += Get-ChildItem -Path $RepoRoot -Filter "docker-compose*.yaml" -File -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName
  }

  $composeFiles = @($composeFiles | Sort-Object -Unique)
  if (@($composeFiles).Count -eq 0) { return @{ Actions=@(); Files=@() } }

  $composeMode = $null
  if (Get-CommandExists "docker") {
    try { & docker compose version *> $null; $composeMode = "docker compose" } catch {
      if (Get-CommandExists "docker-compose") { $composeMode = "docker-compose" }
    }
  } elseif (Get-CommandExists "docker-compose") {
    $composeMode = "docker-compose"
  }

  foreach ($f in $composeFiles) {
    $name  = Split-Path $f -Leaf
    $label = if ($name -match "e2e|test") { "E2E" } else { "Default" }
    $wd    = Split-Path $f -Parent

    if ($composeMode -eq "docker compose") {
      $baseCmd  = "docker"
      $baseArgs = "compose -f `"$f`""
    } elseif ($composeMode -eq "docker-compose") {
      $baseCmd  = "docker-compose"
      $baseArgs = "-f `"$f`""
    } else {
      # still exposed; will fail with clear output if docker missing
      $baseCmd  = "docker"
      $baseArgs = "compose -f `"$f`""
    }

    $actions.Add((New-Action "Operations" "Infra ($label): Up"         $baseCmd "$baseArgs up -d"            $wd $f "Docker"))
    $actions.Add((New-Action "Operations" "Infra ($label): Up (build)" $baseCmd "$baseArgs up -d --build"   $wd $f "Docker"))
    $actions.Add((New-Action "Operations" "Infra ($label): Down"       $baseCmd "$baseArgs down"            $wd $f "Docker"))
    $actions.Add((New-Action "Operations" "Infra ($label): Down (-v)"  $baseCmd "$baseArgs down -v"         $wd $f "Docker"))
    $actions.Add((New-Action "Operations" "Infra ($label): Status"     $baseCmd "$baseArgs ps"              $wd $f "Docker"))
  }

  return @{ Actions=$actions; Files=$composeFiles }
}

function Discover-Scripts([string]$RepoRoot) {
  $actions  = New-Object System.Collections.Generic.List[object]
  $patterns = @(
    "dev*.ps1","dev*.cmd","dev*.bat",
    "mak*.ps1","mak*.cmd","mak*.bat",
    "make*.ps1","make*.cmd","make*.bat",
    "setup*.ps1","setup*.cmd","setup*.bat",
    "run*.ps1","run*.cmd","run*.bat",
    "mvn*.ps1","mvn*.cmd","mvn*.bat",
    "maven*.ps1","maven*.cmd","maven*.bat"
  )

  $folders = @(
    $RepoRoot,
    (Join-Path $RepoRoot "scripts"),
    (Join-Path $RepoRoot "toolkit"),
    (Join-Path $RepoRoot "tools"),
    (Join-Path $RepoRoot "infra"),
    (Join-Path $RepoRoot "backend"),
    (Join-Path $RepoRoot "frontend")
  ) | Where-Object { Test-Path $_ } | Select-Object -Unique

  $found = New-Object System.Collections.Generic.List[string]
  foreach ($d in $folders) {
    foreach ($p in $patterns) {
      Get-ChildItem -Path $d -Filter $p -File -ErrorAction SilentlyContinue | ForEach-Object { $found.Add($_.FullName) }
    }
  }

  foreach ($f in ($found | Sort-Object -Unique)) {
    $leaf = Split-Path $f -Leaf
    $wd   = Split-Path $f -Parent

    if ($leaf -like "*.ps1") {
      $cmd  = "powershell"
      $args = "-NoProfile -ExecutionPolicy Bypass -File `"$f`""
    } else {
      $cmd  = "cmd.exe"
      $args = "/c `"$f`""
    }

    $actions.Add((New-Action "Toolkits" $leaf $cmd $args $wd $f "Script"))
  }

  return $actions
}

function Discover-Docs([string]$RepoRoot) {
  $actions = New-Object System.Collections.Generic.List[object]
  $docDirs = @((Join-Path $RepoRoot "docs"), (Join-Path $RepoRoot "infra"), $RepoRoot) | Where-Object { Test-Path $_ } | Select-Object -Unique

  $mds = @()
  foreach ($d in $docDirs) {
    $mds += Get-ChildItem -Path $d -Filter "RUNBOOK*.md" -File -ErrorAction SilentlyContinue
    $mds += Get-ChildItem -Path $d -Filter "*.md"       -File -ErrorAction SilentlyContinue
  }

  foreach ($m in ($mds | Sort-Object FullName -Unique)) {
    $actions.Add((New-Action "Guide" ("Open: " + $m.Name) "explorer.exe" "`"$($m.FullName)`"" (Split-Path $m.FullName -Parent) $m.FullName "Doc"))
  }

  return $actions
}

function Discover-Npm([string]$RepoRoot) {
  $actions = New-Object System.Collections.Generic.List[object]
  if (-not (Get-CommandExists "npm")) { return $actions }

  $candidates = @(
    (Join-Path $RepoRoot "frontend\package.json"),
    (Join-Path $RepoRoot "package.json")
  ) | Where-Object { Test-Path $_ } | Select-Object -Unique

  foreach ($pj in $candidates) {
    $txt = Try-ReadText $pj
    if (-not $txt) { continue }

    try { $json = $txt | ConvertFrom-Json -ErrorAction Stop } catch { continue }
    if (-not $json.scripts) { continue }

    $wd   = Split-Path $pj -Parent
    $lock = Join-Path $wd "package-lock.json"

    if (Test-Path $lock) { $actions.Add((New-Action "Frontend" "npm ci"      "npm" "ci"      $wd $pj "Npm")) }
    else                 { $actions.Add((New-Action "Frontend" "npm install" "npm" "install" $wd $pj "Npm")) }

    $scriptNames = @($json.scripts.PSObject.Properties.Name) | Sort-Object
    foreach ($name in $scriptNames) {
      $val = [string]$json.scripts.$name
      $cat = if (("$name $val") -match "playwright|e2e|test|lint|dev|start|build") { "Frontend" } else { "Toolkits" }
      $actions.Add((New-Action $cat ("npm run " + $name) "npm" ("run " + $name) $wd $pj "Npm"))
    }
  }

  return $actions
}

function Discover-Maven([string]$RepoRoot) {
  $backendPom = Join-Path $RepoRoot "backend\pom.xml"
  $rootPom    = Join-Path $RepoRoot "pom.xml"
  $pom = $null
  if (Test-Path $backendPom) { $pom = $backendPom }
  elseif (Test-Path $rootPom) { $pom = $rootPom }

  $result = @{
    Actions  = @()
    Profiles = @()
    Pom      = $pom
    MavenCmd = $null
    WorkDir  = $null
  }

  if (-not $pom) { return $result }

  $wd = Split-Path $pom -Parent
  $mvn = $null
  $mvnw = Join-Path $wd "mvnw.cmd"
  if (Test-Path $mvnw) { $mvn = $mvnw }
  elseif (Get-CommandExists "mvn") { $mvn = "mvn" }

  $result.WorkDir  = $wd
  $result.MavenCmd = $mvn

  if ($mvn) {
    $result.Actions += New-Action "Backend" "Maven: clean test"      $mvn "clean test"      $wd $pom "Maven"
    $result.Actions += New-Action "Backend" "Maven: clean verify"    $mvn "clean verify"    $wd $pom "Maven"
    $result.Actions += New-Action "Backend" "Maven: spotless check"  $mvn "spotless:check"  $wd $pom "Maven"
    $result.Actions += New-Action "Backend" "Maven: spring-boot run" $mvn "spring-boot:run" $wd $pom "Maven"
  }

  $xml = Try-ReadText $pom
  if ($xml) {
    $profiles = New-Object System.Collections.Generic.List[string]
    foreach ($m in [regex]::Matches($xml, "<profile>\s*.*?<id>\s*([^<\s]+)\s*</id>.*?</profile>", "Singleline")) {
      $profiles.Add($m.Groups[1].Value)
    }
    $result.Profiles = $profiles | Sort-Object -Unique
  }

  return $result
}

function Discover-SpringProfiles([string]$RepoRoot) {
  $profiles = New-Object System.Collections.Generic.List[string]
  $roots = @(
    Join-Path $RepoRoot "backend\src\main\resources",
    Join-Path $RepoRoot "src\main\resources",
    Join-Path $RepoRoot "backend\src\test\resources",
    Join-Path $RepoRoot "src\test\resources"
  ) | Where-Object { Test-Path $_ } | Select-Object -Unique

  foreach ($r in $roots) {
    Get-ChildItem -Path $r -File -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -match "^application-(.+)\.(yml|yaml|properties)$" } |
      ForEach-Object { $profiles.Add($Matches[1]) }
  }

  $profiles | Sort-Object -Unique
}

function Discover-PlaywrightProjects([string]$RepoRoot) {
  $projects = New-Object System.Collections.Generic.List[string]
  $cands = @(
    Join-Path $RepoRoot "frontend\playwright.config.ts",
    Join-Path $RepoRoot "frontend\playwright.config.js",
    Join-Path $RepoRoot "playwright.config.ts",
    Join-Path $RepoRoot "playwright.config.js"
  ) | Where-Object { Test-Path $_ } | Select-Object -Unique

  foreach ($c in $cands) {
    $txt = Try-ReadText $c
    if (-not $txt) { continue }
    foreach ($m in [regex]::Matches($txt, "name\s*:\s*['""]([^'""]+)['""]")) {
      $projects.Add($m.Groups[1].Value)
    }
  }

  $projects | Sort-Object -Unique
}

function Discover-ObservabilityLinks([string]$RepoRoot) {
  $links = New-Object System.Collections.Generic.List[object]
  $fallbacks = @(
    @{Title="Backend";        Url="http://localhost:8080"},
    @{Title="Health";         Url="http://localhost:8080/actuator/health"},
    @{Title="Swagger UI";     Url="http://localhost:8080/swagger-ui/index.html"},
    @{Title="Keycloak";       Url="http://localhost:8081"},
    @{Title="Adminer";        Url="http://localhost:8082"},
    @{Title="Grafana";        Url="http://localhost:3000"},
    @{Title="Prometheus";     Url="http://localhost:9090"},
    @{Title="Kibana";         Url="http://localhost:5601"},
    @{Title="Elasticsearch";  Url="http://localhost:9200"}
  )

  $mds = @(
    (Join-Path $RepoRoot "docs\RUNBOOK_OBSERVABILITY.md")
    (Join-Path $RepoRoot "infra\RUNBOOK_OBSERVABILITY.md")
    (Join-Path $RepoRoot "README.md")
    (Join-Path $RepoRoot "infra\README.md")
    (Join-Path $RepoRoot "docs\README.md")
  ) | Where-Object { Test-Path $_ }

  $all = ""
  foreach ($m in $mds) {
    $t = Try-ReadText $m
    if ($t) { $all += "`n" + $t }
  }

  if ($all) {
    foreach ($m in [regex]::Matches($all, "https?://[^\s\)\]]+")) {
      $url = $m.Value.Trim()
      $title = $url
      if     ($url -match "swagger")          { $title = "Swagger UI" }
      elseif ($url -match "health|actuator")  { $title = "Health" }
      elseif ($url -match "grafana")          { $title = "Grafana" }
      elseif ($url -match "prometheus")       { $title = "Prometheus" }
      elseif ($url -match "kibana")           { $title = "Kibana" }
      elseif ($url -match "keycloak")         { $title = "Keycloak" }
      elseif ($url -match "adminer")          { $title = "Adminer" }
      elseif ($url -match "9200")             { $title = "Elasticsearch" }

      $links.Add([PSCustomObject]@{ Title=$title; Url=$url })
    }
  }

  if ($links.Count -eq 0) {
    foreach ($f in $fallbacks) { $links.Add([PSCustomObject]@{ Title=$f.Title; Url=$f.Url }) }
  } else {
    foreach ($n in @("Health","Swagger UI")) {
      if (-not ($links | Where-Object { $_.Title -eq $n })) {
        $fb = $fallbacks | Where-Object { $_.Title -eq $n } | Select-Object -First 1
        if ($fb) { $links.Add([PSCustomObject]@{ Title=$fb.Title; Url=$fb.Url }) }
      }
    }
  }

  $links | Sort-Object Url -Unique
}

# ----------------------------
# Runner
# ----------------------------
$global:CurrentProc = $null
$global:RepoRoot    = Find-RepoRoot ((Get-Location).Path)

function Format-Now { (Get-Date).ToString("yyyy-MM-dd HH:mm:ss") }

function Append-Output([string]$Text) {
  if ($null -eq $Text) { return }
  $TxtOutput.Dispatcher.Invoke([action]{
    $TxtOutput.AppendText($Text)
    if (-not $Text.EndsWith("`n")) { $TxtOutput.AppendText("`r`n") }
    $TxtOutput.ScrollToEnd()
  })
}

function Set-Status([string]$Text) {
  $TxtStatus.Dispatcher.Invoke([action]{ $TxtStatus.Text = $Text })
}

function Stop-Current {
  try {
    if ($global:CurrentProc -and -not $global:CurrentProc.HasExited) {
      $global:CurrentProc.Kill()
      Append-Output "[INFO] Process terminated."
    }
  } catch {
    Append-Output ("[WARN] Failed to stop: " + $_.Exception.Message)
  } finally {
    $global:CurrentProc = $null
    Set-Status "Ready."
  }
}

function Show-FixHints {
  try {
    $txt = $TxtOutput.Text
    if (-not $txt) { return }
    $lines = $txt -split "`r?`n"
    $tail  = ($lines | Select-Object -Last 200) -join "`n"

    $hints = New-Object System.Collections.Generic.List[string]
    if ($tail -match "API route and version|server supports the requested API version|Minimum supported API version") {
      $hints.Add("Docker API mismatch: update Docker Desktop or reset DOCKER_API_VERSION and restart Docker.")
    }
    if ($tail -match "compose build requires buildx|buildx") {
      $hints.Add("Docker buildx missing: update Docker Desktop or enable buildx.")
    }
    if ($tail -match "package-lock\.json|unable to cache dependencies|npm ci") {
      $hints.Add("Node lockfile: ensure package-lock.json exists or use npm install.")
    }
    if ($tail -match "JAVA_HOME|Unsupported class file major version") {
      $hints.Add("Java mismatch: ensure expected Java version is active and JAVA_HOME is correct.")
    }
    if ($tail -match "mvnw\.cmd.*cannot find|mvn.*not recognized") {
      $hints.Add("Maven not found: install mvn or use mvnw.cmd from backend folder.")
    }

    $TxtHints.Dispatcher.Invoke([action]{
      if ($hints.Count -gt 0) { $TxtHints.Text = "- " + (($hints | Sort-Object -Unique) -join "`r`n- ") }
      else { $TxtHints.Text = "" }
    })
  } catch { }
}

function Start-Action([object]$Action) {
  if (-not $Action) { return }
  if ($global:CurrentProc -and -not $global:CurrentProc.HasExited) {
    Append-Output "[WARN] A process is already running. Stop it first."
    return
  }

  if (-not $Action.Command) { Append-Output "[ERROR] No command defined."; return }

  Append-Output ("[{0}] >>> {1} {2}" -f (Format-Now), $Action.Command, $Action.Args)
  Set-Status ("Running: " + $Action.Title)

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $Action.Command
  $psi.Arguments = $Action.Args
  $psi.WorkingDirectory = $Action.WorkDir
  $psi.UseShellExecute = $false
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError  = $true
  $psi.CreateNoWindow = $true
  $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
  $psi.StandardErrorEncoding  = [System.Text.Encoding]::UTF8

  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $psi
  $p.EnableRaisingEvents = $true

  $p.add_OutputDataReceived({ param($s,$e) if ($e.Data) { Append-Output $e.Data } })
  $p.add_ErrorDataReceived({ param($s,$e) if ($e.Data) { Append-Output ("[ERR] " + $e.Data) } })
  $p.add_Exited({
    $exit = $p.ExitCode
    $global:CurrentProc = $null
    $TxtOutput.Dispatcher.Invoke([action]{ $TxtOutput.AppendText(("[" + (Format-Now) + "] <<< ExitCode: " + $exit + "`r`n")); $TxtOutput.ScrollToEnd() })
    $TxtLastRun.Dispatcher.Invoke([action]{ $TxtLastRun.Text = ("Last run: " + $Action.Title + " | Exit " + $exit + " | " + (Format-Now)) })
    if ($exit -eq 0) { Set-Status "Ready." } else { Set-Status "Completed with errors." }
    Show-FixHints
  })

  try {
    $null = $p.Start()
    $global:CurrentProc = $p
    $p.BeginOutputReadLine()
    $p.BeginErrorReadLine()
  } catch {
    Append-Output ("[ERROR] Failed to start: " + $_.Exception.Message)
    Set-Status "Ready."
  }
}

# ----------------------------
# UI (XAML) - no ampersands in text to avoid XML parsing issues
# ----------------------------
[xml]$xaml = @'
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Atlas Dev Dashboard" Height="820" Width="1280"
        WindowStartupLocation="CenterScreen" Background="#0B1220" Foreground="#E5E7EB">
  <Window.Resources>
    <SolidColorBrush x:Key="Surface"  Color="#111827"/>
    <SolidColorBrush x:Key="Surface2" Color="#0F172A"/>
    <SolidColorBrush x:Key="Border"   Color="#243041"/>
    <SolidColorBrush x:Key="Muted"    Color="#9CA3AF"/>

    <Style TargetType="Button">
      <Setter Property="Margin" Value="6"/>
      <Setter Property="Padding" Value="10,8"/>
      <Setter Property="Background" Value="{StaticResource Surface}"/>
      <Setter Property="Foreground" Value="#E5E7EB"/>
      <Setter Property="BorderBrush" Value="{StaticResource Border}"/>
      <Setter Property="BorderThickness" Value="1"/>
      <Setter Property="Cursor" Value="Hand"/>
      <Setter Property="MinWidth" Value="110"/>
      <Setter Property="Template">
        <Setter.Value>
          <ControlTemplate TargetType="Button">
            <Border CornerRadius="10" Background="{TemplateBinding Background}" BorderBrush="{TemplateBinding BorderBrush}" BorderThickness="{TemplateBinding BorderThickness}">
              <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
            </Border>
            <ControlTemplate.Triggers>
              <Trigger Property="IsMouseOver" Value="True">
                <Setter Property="Background" Value="#0E1A2F"/>
                <Setter Property="BorderBrush" Value="#3B4A63"/>
              </Trigger>
              <Trigger Property="IsPressed" Value="True">
                <Setter Property="Background" Value="#071025"/>
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
      <Setter Property="Background" Value="{StaticResource Surface2}"/>
      <Setter Property="Foreground" Value="#E5E7EB"/>
      <Setter Property="BorderBrush" Value="{StaticResource Border}"/>
      <Setter Property="BorderThickness" Value="1"/>
      <Setter Property="FontFamily" Value="Consolas"/>
      <Setter Property="FontSize" Value="12"/>
    </Style>

    <Style TargetType="ListView">
      <Setter Property="Margin" Value="6"/>
      <Setter Property="Background" Value="{StaticResource Surface2}"/>
      <Setter Property="Foreground" Value="#E5E7EB"/>
      <Setter Property="BorderBrush" Value="{StaticResource Border}"/>
      <Setter Property="BorderThickness" Value="1"/>
    </Style>

    <Style TargetType="GroupBox">
      <Setter Property="Margin" Value="10"/>
      <Setter Property="Padding" Value="10"/>
      <Setter Property="BorderBrush" Value="{StaticResource Border}"/>
      <Setter Property="BorderThickness" Value="1"/>
    </Style>

    <Style TargetType="TextBlock">
      <Setter Property="Margin" Value="4,2"/>
    </Style>

    <Style x:Key="NavButton" TargetType="Button">
      <Setter Property="Margin" Value="6,6"/>
      <Setter Property="Padding" Value="12,10"/>
      <Setter Property="Background" Value="#0F172A"/>
      <Setter Property="BorderBrush" Value="{StaticResource Border}"/>
      <Setter Property="MinWidth" Value="0"/>
      <Setter Property="HorizontalContentAlignment" Value="Left"/>
      <Setter Property="Template">
        <Setter.Value>
          <ControlTemplate TargetType="Button">
            <Border CornerRadius="12" Background="{TemplateBinding Background}" BorderBrush="{TemplateBinding BorderBrush}" BorderThickness="1">
              <Grid Margin="10,6">
                <Grid.ColumnDefinitions>
                  <ColumnDefinition Width="30"/>
                  <ColumnDefinition Width="*"/>
                </Grid.ColumnDefinitions>
                <TextBlock Text="{TemplateBinding Tag}" FontFamily="Segoe MDL2 Assets" FontSize="16" Foreground="{StaticResource Muted}" VerticalAlignment="Center"/>
                <ContentPresenter Grid.Column="1" VerticalAlignment="Center" Margin="10,0,0,0"/>
              </Grid>
            </Border>
            <ControlTemplate.Triggers>
              <Trigger Property="IsMouseOver" Value="True">
                <Setter Property="Background" Value="#111E35"/>
                <Setter Property="BorderBrush" Value="#3B4A63"/>
              </Trigger>
              <Trigger Property="IsPressed" Value="True">
                <Setter Property="Background" Value="#0B1220"/>
              </Trigger>
            </ControlTemplate.Triggers>
          </ControlTemplate>
        </Setter.Value>
      </Setter>
    </Style>
  </Window.Resources>

  <DockPanel LastChildFill="True">
    <Border DockPanel.Dock="Top" Background="#071025" BorderBrush="{StaticResource Border}" BorderThickness="0,0,0,1" Padding="12">
      <Grid>
        <Grid.ColumnDefinitions>
          <ColumnDefinition Width="*"/>
          <ColumnDefinition Width="Auto"/>
        </Grid.ColumnDefinitions>
        <StackPanel Orientation="Vertical">
          <TextBlock Text="Atlas Dev Dashboard" FontSize="18" FontWeight="SemiBold"/>
          <TextBlock Text="Operations, Observability, Toolkits and Guide - auto-discovered from your repository" Foreground="{StaticResource Muted}"/>
        </StackPanel>
        <StackPanel Grid.Column="1" Orientation="Horizontal" VerticalAlignment="Center">
          <Button x:Name="BtnReload" Content="Reload"/>
          <Button x:Name="BtnClear" Content="Clear Output"/>
          <Button x:Name="BtnStop" Content="Stop Current"/>
        </StackPanel>
      </Grid>
    </Border>

    <Border DockPanel.Dock="Bottom" Background="#071025" BorderBrush="{StaticResource Border}" BorderThickness="0,1,0,0" Padding="10">
      <Grid>
        <Grid.ColumnDefinitions>
          <ColumnDefinition Width="*"/>
          <ColumnDefinition Width="Auto"/>
        </Grid.ColumnDefinitions>
        <TextBlock x:Name="TxtStatus" Text="Ready." Foreground="{StaticResource Muted}"/>
        <TextBlock Grid.Column="1" x:Name="TxtContext" Text="" Foreground="{StaticResource Muted}"/>
      </Grid>
    </Border>

    <Grid>
      <Grid.ColumnDefinitions>
        <ColumnDefinition Width="260"/>
        <ColumnDefinition Width="*"/>
      </Grid.ColumnDefinitions>

      <Border Grid.Column="0" Background="#071025" BorderBrush="{StaticResource Border}" BorderThickness="0,0,1,0">
        <DockPanel>
          <GroupBox Header="Repository" DockPanel.Dock="Top">
            <StackPanel>
              <TextBlock Text="Project root" Foreground="{StaticResource Muted}"/>
              <TextBox x:Name="TxtRepo" MinHeight="28"/>
              <TextBlock x:Name="TxtChecks" Text="" Foreground="{StaticResource Muted}" TextWrapping="Wrap"/>
            </StackPanel>
          </GroupBox>

          <ScrollViewer VerticalScrollBarVisibility="Auto">
            <StackPanel Margin="8">
              <Button x:Name="NavDashboard"     Style="{StaticResource NavButton}" Tag="&#xE80F;" Content="Dashboard"/>
              <Button x:Name="NavOperations"    Style="{StaticResource NavButton}" Tag="&#xE7C1;" Content="Operations"/>
              <Button x:Name="NavToolkits"      Style="{StaticResource NavButton}" Tag="&#xE8B7;" Content="Toolkits"/>
              <Button x:Name="NavBackend"       Style="{StaticResource NavButton}" Tag="&#xE943;" Content="Backend"/>
              <Button x:Name="NavFrontend"      Style="{StaticResource NavButton}" Tag="&#xE7C3;" Content="Frontend"/>
              <Button x:Name="NavObservability" Style="{StaticResource NavButton}" Tag="&#xE9D9;" Content="Observability"/>
              <Button x:Name="NavGuide"         Style="{StaticResource NavButton}" Tag="&#xE8A5;" Content="Guide"/>
              <Separator Margin="8"/>
              <Button x:Name="NavSettings"      Style="{StaticResource NavButton}" Tag="&#xE713;" Content="Settings"/>
            </StackPanel>
          </ScrollViewer>
        </DockPanel>
      </Border>

      <Grid Grid.Column="1" Margin="10">
        <Grid.RowDefinitions>
          <RowDefinition Height="Auto"/>
          <RowDefinition Height="*"/>
        </Grid.RowDefinitions>

        <Border Grid.Row="0" Background="{StaticResource Surface}" BorderBrush="{StaticResource Border}" BorderThickness="1" CornerRadius="14" Padding="12" Margin="0,0,0,10">
          <Grid>
            <Grid.ColumnDefinitions>
              <ColumnDefinition Width="*"/>
              <ColumnDefinition Width="Auto"/>
            </Grid.ColumnDefinitions>
            <StackPanel>
              <TextBlock x:Name="TxtPageTitle" Text="Dashboard" FontSize="16" FontWeight="SemiBold"/>
              <TextBlock x:Name="TxtPageSubtitle" Text="Overview and quick actions" Foreground="{StaticResource Muted}"/>
            </StackPanel>
            <StackPanel Grid.Column="1" Orientation="Horizontal" VerticalAlignment="Center">
              <TextBox x:Name="TxtSearch" Width="320" ToolTip="Filter commands by title, category, or file"/>
              <Button x:Name="BtnRunSelected" Content="Run Selected" MinWidth="130"/>
            </StackPanel>
          </Grid>
        </Border>

        <Grid Grid.Row="1">
          <Grid.ColumnDefinitions>
            <ColumnDefinition Width="560"/>
            <ColumnDefinition Width="*"/>
          </Grid.ColumnDefinitions>

          <!-- Left views -->
          <Grid Grid.Column="0">
            <Grid x:Name="ViewDashboard">
              <StackPanel>
                <GroupBox Header="Quick actions">
                  <WrapPanel>
                    <Button x:Name="BtnQuickUp" Content="Infra Up"/>
                    <Button x:Name="BtnQuickPs" Content="Infra Status"/>
                    <Button x:Name="BtnQuickBackendRun" Content="Backend Run"/>
                    <Button x:Name="BtnQuickFrontendStart" Content="Frontend Start"/>
                    <Button x:Name="BtnQuickHealth" Content="Open Health"/>
                    <Button x:Name="BtnQuickSwagger" Content="Open Swagger"/>
                  </WrapPanel>
                </GroupBox>

                <GroupBox Header="Detected profiles">
                  <Grid>
                    <Grid.ColumnDefinitions>
                      <ColumnDefinition Width="*"/>
                      <ColumnDefinition Width="*"/>
                    </Grid.ColumnDefinitions>
                    <StackPanel Grid.Column="0">
                      <TextBlock Text="Spring profiles" Foreground="{StaticResource Muted}"/>
                      <ListBox x:Name="ListSpringProfiles" Margin="6" Background="{StaticResource Surface2}" BorderBrush="{StaticResource Border}" BorderThickness="1"/>
                    </StackPanel>
                    <StackPanel Grid.Column="1">
                      <TextBlock Text="Playwright projects" Foreground="{StaticResource Muted}"/>
                      <ListBox x:Name="ListPlaywrightProjects" Margin="6" Background="{StaticResource Surface2}" BorderBrush="{StaticResource Border}" BorderThickness="1"/>
                    </StackPanel>
                  </Grid>
                </GroupBox>

                <GroupBox Header="Command catalog (auto-discovered)">
                  <ListView x:Name="ListActions" Height="240">
                    <ListView.View>
                      <GridView>
                        <GridViewColumn Header="Category" DisplayMemberBinding="{Binding Category}" Width="120"/>
                        <GridViewColumn Header="Title" DisplayMemberBinding="{Binding Title}" Width="270"/>
                        <GridViewColumn Header="Kind" DisplayMemberBinding="{Binding Kind}" Width="80"/>
                      </GridView>
                    </ListView.View>
                  </ListView>
                </GroupBox>
              </StackPanel>
            </Grid>

            <Grid x:Name="ViewOperations" Visibility="Collapsed">
              <StackPanel>
                <GroupBox Header="Operations">
                  <StackPanel>
                  <TextBlock Text="Docker Compose actions from docker-compose files in infra or repo root." Foreground="{StaticResource Muted}"/>
                  <ListView x:Name="ListOps" Height="520">
                    <ListView.View>
                      <GridView>
                        <GridViewColumn Header="Title" DisplayMemberBinding="{Binding Title}" Width="330"/>
                        <GridViewColumn Header="Source" DisplayMemberBinding="{Binding Source}" Width="210"/>
                      </GridView>
                    </ListView.View>
                  </ListView>

                  </StackPanel>
</GroupBox>
              </StackPanel>
            </Grid>

            <Grid x:Name="ViewToolkits" Visibility="Collapsed">
              <StackPanel>
                <GroupBox Header="Toolkits">
                  <StackPanel>
                  <TextBlock Text="Discovered scripts: dev*, mak*, setup*, run*, mvn*, maven*." Foreground="{StaticResource Muted}"/>
                  <ListView x:Name="ListToolkits" Height="520">
                    <ListView.View>
                      <GridView>
                        <GridViewColumn Header="Title" DisplayMemberBinding="{Binding Title}" Width="250"/>
                        <GridViewColumn Header="Source" DisplayMemberBinding="{Binding Source}" Width="290"/>
                      </GridView>
                    </ListView.View>
                  </ListView>

                  </StackPanel>
</GroupBox>
              </StackPanel>
            </Grid>

            <Grid x:Name="ViewBackend" Visibility="Collapsed">
              <StackPanel>
                <GroupBox Header="Backend">
                  <StackPanel>
                  <TextBlock Text="Maven actions plus Spring profile aware run." Foreground="{StaticResource Muted}"/>
                  <WrapPanel>
                    <Button x:Name="BtnBackendRun" Content="Run"/>
                    <Button x:Name="BtnBackendTest" Content="Tests"/>
                    <Button x:Name="BtnBackendVerify" Content="Verify"/>
                    <Button x:Name="BtnBackendSpotless" Content="Spotless"/>
                  </WrapPanel>

                  <Grid Margin="6">
                    <Grid.ColumnDefinitions>
                      <ColumnDefinition Width="*"/>
                      <ColumnDefinition Width="*"/>
                    </Grid.ColumnDefinitions>

                    <StackPanel Grid.Column="0">
                      <TextBlock Text="Maven profiles" Foreground="{StaticResource Muted}"/>
                      <ListBox x:Name="ListMavenProfiles" Margin="6" Background="{StaticResource Surface2}" BorderBrush="{StaticResource Border}" BorderThickness="1"/>
                    </StackPanel>
                    <StackPanel Grid.Column="1">
                      <TextBlock Text="Spring profile for run" Foreground="{StaticResource Muted}"/>
                      <ComboBox x:Name="CmbSpringRunProfile" Margin="6" Background="{StaticResource Surface2}" BorderBrush="{StaticResource Border}" BorderThickness="1"/>
                      <TextBlock Text="Sets -Dspring-boot.run.profiles and -Dspring.profiles.active." Foreground="{StaticResource Muted}"/>
                    </StackPanel>
                  </Grid>

                  <ListView x:Name="ListBackend" Height="300">
                    <ListView.View>
                      <GridView>
                        <GridViewColumn Header="Title" DisplayMemberBinding="{Binding Title}" Width="330"/>
                        <GridViewColumn Header="Kind" DisplayMemberBinding="{Binding Kind}" Width="80"/>
                      </GridView>
                    </ListView.View>
                  </ListView>

                  </StackPanel>
</GroupBox>
              </StackPanel>
            </Grid>

            <Grid x:Name="ViewFrontend" Visibility="Collapsed">
              <StackPanel>
                <GroupBox Header="Frontend">
                  <StackPanel>
                  <TextBlock Text="NPM scripts from package.json." Foreground="{StaticResource Muted}"/>
                  <ListView x:Name="ListFrontend" Height="560">
                    <ListView.View>
                      <GridView>
                        <GridViewColumn Header="Title" DisplayMemberBinding="{Binding Title}" Width="320"/>
                        <GridViewColumn Header="Source" DisplayMemberBinding="{Binding Source}" Width="220"/>
                      </GridView>
                    </ListView.View>
                  </ListView>

                  </StackPanel>
</GroupBox>
              </StackPanel>
            </Grid>

            <Grid x:Name="ViewObservability" Visibility="Collapsed">
              <StackPanel>
                <GroupBox Header="Observability">
                  <StackPanel>
                  <TextBlock Text="Links from runbooks when present; fallbacks otherwise." Foreground="{StaticResource Muted}"/>
                  <ListView x:Name="ListLinks" Height="520">
                    <ListView.View>
                      <GridView>
                        <GridViewColumn Header="Title" DisplayMemberBinding="{Binding Title}" Width="200"/>
                        <GridViewColumn Header="URL"   DisplayMemberBinding="{Binding Url}"   Width="360"/>
                      </GridView>
                    </ListView.View>
                  </ListView>
                  <WrapPanel>
                    <Button x:Name="BtnOpenLink" Content="Open selected link"/>
                    <Button x:Name="BtnCopyLink" Content="Copy URL"/>
                  </WrapPanel>

                  </StackPanel>
</GroupBox>
              </StackPanel>
            </Grid>

            <Grid x:Name="ViewGuide" Visibility="Collapsed">
              <StackPanel>
                <GroupBox Header="Guide">
                  <StackPanel>
                  <TextBlock Text="Runbooks and documentation." Foreground="{StaticResource Muted}"/>
                  <ListView x:Name="ListDocs" Height="520">
                    <ListView.View>
                      <GridView>
                        <GridViewColumn Header="Title" DisplayMemberBinding="{Binding Title}"  Width="260"/>
                        <GridViewColumn Header="File"  DisplayMemberBinding="{Binding Source}" Width="300"/>
                      </GridView>
                    </ListView.View>
                  </ListView>
                  <Button x:Name="BtnOpenDoc" Content="Open selected"/>

                  </StackPanel>
</GroupBox>
              </StackPanel>
            </Grid>

            <Grid x:Name="ViewSettings" Visibility="Collapsed">
              <StackPanel>
                <GroupBox Header="Settings">
                  <StackPanel>
                  <TextBlock Text="Open folders and review error hints." Foreground="{StaticResource Muted}"/>
                  <WrapPanel>
                    <Button x:Name="BtnOpenRepo" Content="Open repo folder"/>
                    <Button x:Name="BtnOpenInCode" Content="Open in VS Code"/>
                  </WrapPanel>
                  <GroupBox Header="Error hints">
                    <StackPanel>
                    <TextBlock Text="When a command fails, hints are derived from output signatures." Foreground="{StaticResource Muted}"/>
                    <TextBox x:Name="TxtHints" Height="170" IsReadOnly="True" TextWrapping="Wrap"/>

                    </StackPanel>
</GroupBox>

                  </StackPanel>
</GroupBox>
              </StackPanel>
            </Grid>
          </Grid>

          <!-- Right side -->
          <StackPanel Grid.Column="1">
            <GroupBox Header="Selected action">
              <StackPanel>
                <TextBlock x:Name="TxtSelectedTitle" Text="(none selected)" FontWeight="SemiBold"/>
                <TextBlock x:Name="TxtSelectedCmd" Text="" Foreground="{StaticResource Muted}" TextWrapping="Wrap"/>
                <TextBlock x:Name="TxtLastRun" Text="Last run: (none)" Foreground="{StaticResource Muted}"/>
                <WrapPanel>
                  <Button x:Name="BtnOpenSource" Content="Open source" IsEnabled="False"/>
                  <Button x:Name="BtnOpenWorkDir" Content="Open workdir" IsEnabled="False"/>
                </WrapPanel>
              </StackPanel>
            </GroupBox>

            <GroupBox Header="Output">
              <TextBox x:Name="TxtOutput" AcceptsReturn="True" VerticalScrollBarVisibility="Auto" HorizontalScrollBarVisibility="Auto" TextWrapping="NoWrap" IsReadOnly="True"/>
            </GroupBox>
          </StackPanel>
        </Grid>
      </Grid>
    </Grid>
  </DockPanel>
</Window>
'@

$reader = New-Object System.Xml.XmlNodeReader $xaml
$window = [Windows.Markup.XamlReader]::Load($reader)

function Get-Control([string]$Name) { $window.FindName($Name) }

# Bind controls
$TxtRepo      = Get-Control "TxtRepo"
$TxtChecks    = Get-Control "TxtChecks"
$TxtContext   = Get-Control "TxtContext"
$TxtStatus    = Get-Control "TxtStatus"
$TxtSearch    = Get-Control "TxtSearch"
$BtnReload    = Get-Control "BtnReload"
$BtnClear     = Get-Control "BtnClear"
$BtnStop      = Get-Control "BtnStop"
$BtnRunSelected = Get-Control "BtnRunSelected"

$NavDashboard = Get-Control "NavDashboard"
$NavOperations = Get-Control "NavOperations"
$NavToolkits  = Get-Control "NavToolkits"
$NavBackend   = Get-Control "NavBackend"
$NavFrontend  = Get-Control "NavFrontend"
$NavObservability = Get-Control "NavObservability"
$NavGuide     = Get-Control "NavGuide"
$NavSettings  = Get-Control "NavSettings"

$ViewDashboard = Get-Control "ViewDashboard"
$ViewOperations = Get-Control "ViewOperations"
$ViewToolkits  = Get-Control "ViewToolkits"
$ViewBackend   = Get-Control "ViewBackend"
$ViewFrontend  = Get-Control "ViewFrontend"
$ViewObservability = Get-Control "ViewObservability"
$ViewGuide     = Get-Control "ViewGuide"
$ViewSettings  = Get-Control "ViewSettings"

$TxtPageTitle  = Get-Control "TxtPageTitle"
$TxtPageSubtitle = Get-Control "TxtPageSubtitle"

$ListActions   = Get-Control "ListActions"
$ListOps       = Get-Control "ListOps"
$ListToolkits  = Get-Control "ListToolkits"
$ListBackend   = Get-Control "ListBackend"
$ListFrontend  = Get-Control "ListFrontend"
$ListLinks     = Get-Control "ListLinks"
$ListDocs      = Get-Control "ListDocs"

$BtnQuickUp    = Get-Control "BtnQuickUp"
$BtnQuickPs    = Get-Control "BtnQuickPs"
$BtnQuickBackendRun = Get-Control "BtnQuickBackendRun"
$BtnQuickFrontendStart = Get-Control "BtnQuickFrontendStart"
$BtnQuickHealth = Get-Control "BtnQuickHealth"
$BtnQuickSwagger = Get-Control "BtnQuickSwagger"

$ListSpringProfiles = Get-Control "ListSpringProfiles"
$ListPlaywrightProjects = Get-Control "ListPlaywrightProjects"
$ListMavenProfiles = Get-Control "ListMavenProfiles"
$CmbSpringRunProfile = Get-Control "CmbSpringRunProfile"

$BtnBackendRun = Get-Control "BtnBackendRun"
$BtnBackendTest = Get-Control "BtnBackendTest"
$BtnBackendVerify = Get-Control "BtnBackendVerify"
$BtnBackendSpotless = Get-Control "BtnBackendSpotless"

$BtnOpenLink   = Get-Control "BtnOpenLink"
$BtnCopyLink   = Get-Control "BtnCopyLink"
$BtnOpenDoc    = Get-Control "BtnOpenDoc"

$BtnOpenRepo   = Get-Control "BtnOpenRepo"
$BtnOpenInCode = Get-Control "BtnOpenInCode"
$TxtHints      = Get-Control "TxtHints"

$TxtSelectedTitle = Get-Control "TxtSelectedTitle"
$TxtSelectedCmd   = Get-Control "TxtSelectedCmd"
$TxtLastRun       = Get-Control "TxtLastRun"
$BtnOpenSource    = Get-Control "BtnOpenSource"
$BtnOpenWorkDir   = Get-Control "BtnOpenWorkDir"

$TxtOutput = Get-Control "TxtOutput"

# ----------------------------
# State + View logic
# ----------------------------
$global:AllActions = @()
$global:ComposeActions = @()
$global:ToolkitActions = @()
$global:BackendActions = @()
$global:FrontendActions = @()
$global:Docs = @()
$global:Links = @()
$global:MavenInfo = $null

function Hide-AllViews {
  $ViewDashboard.Visibility = "Collapsed"
  $ViewOperations.Visibility = "Collapsed"
  $ViewToolkits.Visibility  = "Collapsed"
  $ViewBackend.Visibility   = "Collapsed"
  $ViewFrontend.Visibility  = "Collapsed"
  $ViewObservability.Visibility = "Collapsed"
  $ViewGuide.Visibility     = "Collapsed"
  $ViewSettings.Visibility  = "Collapsed"
}

function Show-View([string]$Name) {
  Hide-AllViews
  switch ($Name) {
    "Dashboard"     { $ViewDashboard.Visibility = "Visible";     $TxtPageTitle.Text="Dashboard";     $TxtPageSubtitle.Text="Overview and quick actions" }
    "Operations"    { $ViewOperations.Visibility = "Visible";    $TxtPageTitle.Text="Operations";    $TxtPageSubtitle.Text="Infra operations from docker-compose files" }
    "Toolkits"      { $ViewToolkits.Visibility = "Visible";      $TxtPageTitle.Text="Toolkits";      $TxtPageSubtitle.Text="Scripts discovered by naming convention" }
    "Backend"       { $ViewBackend.Visibility = "Visible";       $TxtPageTitle.Text="Backend";       $TxtPageSubtitle.Text="Maven and Spring profiles" }
    "Frontend"      { $ViewFrontend.Visibility = "Visible";      $TxtPageTitle.Text="Frontend";      $TxtPageSubtitle.Text="NPM scripts and Playwright related commands" }
    "Observability" { $ViewObservability.Visibility = "Visible"; $TxtPageTitle.Text="Observability"; $TxtPageSubtitle.Text="Health, Swagger and platform links" }
    "Guide"         { $ViewGuide.Visibility = "Visible";         $TxtPageTitle.Text="Guide";         $TxtPageSubtitle.Text="Runbooks and documentation" }
    "Settings"      { $ViewSettings.Visibility = "Visible";      $TxtPageTitle.Text="Settings";      $TxtPageSubtitle.Text="Open repo and view error hints" }
  }
}

function Update-Checks([string]$RepoRoot) {
  $checks = New-Object System.Collections.Generic.List[string]
  $checks.Add("Repo: " + $RepoRoot)
  $checks.Add("Docker: " + ($(if (Get-CommandExists "docker") { "OK" } else { "Missing" })))
  $checks.Add("Node: " +   ($(if (Get-CommandExists "node")   { "OK" } else { "Missing" })))
  $checks.Add("Npm: " +    ($(if (Get-CommandExists "npm")    { "OK" } else { "Missing" })))
  $checks.Add("Maven: " +  ($(if (Get-CommandExists "mvn")    { "OK" } elseif (Test-Path (Join-Path $RepoRoot "backend\mvnw.cmd")) { "mvnw" } else { "Unknown" })))
  $TxtChecks.Text = ($checks -join "`r`n")
  $TxtContext.Text = "Root: " + $RepoRoot
}

function Apply-Filter([string]$Q) {
  if ($null -eq $Q) { $Q = "" }
  $q2 = $Q.Trim()
  if ([string]::IsNullOrWhiteSpace($q2)) {
    $ListActions.ItemsSource = $global:AllActions
    return
  }
  $ListActions.ItemsSource = ($global:AllActions | Where-Object {
    ($_.Title -like "*$q2*") -or ($_.Category -like "*$q2*") -or ($_.Source -like "*$q2*")
  })
}

function Select-Action([object]$A) {
  if (-not $A) { return }
  $TxtSelectedTitle.Text = $A.Title
  $TxtSelectedCmd.Text   = ("{0} {1}`r`nWorkDir: {2}`r`nSource: {3}" -f $A.Command, $A.Args, $A.WorkDir, $A.Source)
  $BtnOpenSource.IsEnabled  = [bool]$A.Source
  $BtnOpenWorkDir.IsEnabled = [bool]$A.WorkDir
}

function Reload-All {
  $repo = $TxtRepo.Text
  if (-not $repo -or -not (Test-Path $repo)) { $repo = $global:RepoRoot; $TxtRepo.Text = $repo }
  $global:RepoRoot = (Resolve-Path -LiteralPath $repo -ErrorAction Stop | Select-Object -First 1 -ExpandProperty Path)
  Update-Checks $global:RepoRoot

  $composeInfo = Discover-Compose $global:RepoRoot
  # Compose actions (safe array conversion for WPF ItemsSource)
  $global:ComposeActions = @()
  try {
    $ca = $null
    if ($composeInfo -is [System.Collections.IDictionary]) { $ca = $composeInfo['Actions'] } else { $ca = $composeInfo.Actions }

    if ($null -eq $ca) {
      $global:ComposeActions = @()
    }
    elseif ($ca -is [System.Array]) {
      $global:ComposeActions = $ca
    }
    elseif ($ca -is [System.Collections.IList] -and ($ca.GetType().FullName -like 'System.Collections.Generic.List*')) {
      # Generic List<T> -> ToArray avoids some PowerShell adapter edge cases in Windows PowerShell 5.1
      $global:ComposeActions = $ca.ToArray()
    }
    elseif ($ca -is [System.Collections.IEnumerable] -and -not ($ca -is [string])) {
      $global:ComposeActions = @($ca)
    }
    else {
      $global:ComposeActions = @($ca)
    }
  } catch {
    $global:ComposeActions = @()
    Append-Output ("[WARN] Compose discovery failed: " + $_.Exception.Message)
  }

  $global:ToolkitActions = To-Array (Discover-Scripts $global:RepoRoot)
  $global:Docs = To-Array (Discover-Docs $global:RepoRoot)
  $global:Links = To-Array (Discover-ObservabilityLinks $global:RepoRoot)

  $global:MavenInfo = Discover-Maven $global:RepoRoot
  # Backend actions (safe array conversion)
  $global:BackendActions = @()
  try {
    $ba = $null
    if ($global:MavenInfo -is [System.Collections.IDictionary]) { $ba = $global:MavenInfo['Actions'] } else { $ba = $global:MavenInfo.Actions }

    if ($null -eq $ba) { $global:BackendActions = @() }
    elseif ($ba -is [System.Array]) { $global:BackendActions = $ba }
    elseif ($ba -is [System.Collections.IEnumerable] -and -not ($ba -is [string])) { $global:BackendActions = @($ba) }
    else { $global:BackendActions = @($ba) }
  } catch {
    $global:BackendActions = @()
    Append-Output ("[WARN] Maven action discovery failed: " + $_.Exception.Message)
  }

  $npmActions = To-Array (Discover-Npm $global:RepoRoot)
  $global:FrontendActions = @($npmActions | Where-Object { $_.Category -eq "Frontend" })

  $springProfiles = @(Discover-SpringProfiles $global:RepoRoot)
  $pwProjects     = @(Discover-PlaywrightProjects $global:RepoRoot)

  $ListSpringProfiles.ItemsSource = $springProfiles
  $ListPlaywrightProjects.ItemsSource = $pwProjects
  $ListMavenProfiles.ItemsSource = $global:MavenInfo.Profiles

  $CmbSpringRunProfile.Items.Clear()
  $CmbSpringRunProfile.Items.Add("(none)") | Out-Null
  foreach ($p in $springProfiles) { $CmbSpringRunProfile.Items.Add($p) | Out-Null }
  $CmbSpringRunProfile.SelectedIndex = 0

  $global:AllActions = @()
  $global:AllActions += $global:ComposeActions
  $global:AllActions += $global:ToolkitActions
  $global:AllActions += $global:BackendActions
  $global:AllActions += $global:FrontendActions
  $global:AllActions += ($global:Docs | Where-Object { $_.Category -eq "Guide" })

  $ListActions.ItemsSource = $global:AllActions
  $ListOps.ItemsSource = $global:ComposeActions
  $ListToolkits.ItemsSource = $global:ToolkitActions
  $ListBackend.ItemsSource = $global:BackendActions
  $ListFrontend.ItemsSource = $global:FrontendActions
  $ListLinks.ItemsSource = $global:Links
  $ListDocs.ItemsSource = $global:Docs

  # Quick action heuristics
  $global:QuickUp      = ($global:ComposeActions | Where-Object { $_.Title -like "*Up" } | Select-Object -First 1)
  $global:QuickPs      = ($global:ComposeActions | Where-Object { $_.Title -like "*Status*" } | Select-Object -First 1)
  $global:QuickBackend = ($global:BackendActions | Where-Object { $_.Title -like "*spring-boot run*" } | Select-Object -First 1)
  $global:QuickFront   = ($global:FrontendActions | Where-Object { $_.Title -match "npm run start|npm run dev" } | Select-Object -First 1)
  $global:QuickHealth  = ($global:Links | Where-Object { $_.Title -eq "Health" } | Select-Object -First 1)
  $global:QuickSwagger = ($global:Links | Where-Object { $_.Title -eq "Swagger UI" } | Select-Object -First 1)

  Set-Status "Ready."
}

# ----------------------------
# Events
# ----------------------------
$BtnReload.Add_Click({ Reload-All })
$BtnClear.Add_Click({ $TxtOutput.Clear(); $TxtHints.Clear() })
$BtnStop.Add_Click({ Stop-Current })
$TxtSearch.Add_TextChanged({ Apply-Filter $TxtSearch.Text })

$ListActions.Add_SelectionChanged({ Select-Action $ListActions.SelectedItem })
$ListOps.Add_SelectionChanged({ Select-Action $ListOps.SelectedItem })
$ListToolkits.Add_SelectionChanged({ Select-Action $ListToolkits.SelectedItem })
$ListBackend.Add_SelectionChanged({ Select-Action $ListBackend.SelectedItem })
$ListFrontend.Add_SelectionChanged({ Select-Action $ListFrontend.SelectedItem })
$ListDocs.Add_SelectionChanged({ Select-Action $ListDocs.SelectedItem })

$BtnRunSelected.Add_Click({
  $sel = First-NotNull @(
    $ListActions.SelectedItem,
    $ListOps.SelectedItem,
    $ListToolkits.SelectedItem,
    $ListBackend.SelectedItem,
    $ListFrontend.SelectedItem,
    $ListDocs.SelectedItem
  )
  if ($sel) { Start-Action $sel } else { Append-Output "[INFO] Select an action first." }
})

$BtnOpenSource.Add_Click({
  $sel = First-NotNull @(
    $ListActions.SelectedItem,$ListOps.SelectedItem,$ListToolkits.SelectedItem,$ListBackend.SelectedItem,$ListFrontend.SelectedItem,$ListDocs.SelectedItem
  )
  if ($sel -and $sel.Source) { Safe-InvokeItem $sel.Source }
})

$BtnOpenWorkDir.Add_Click({
  $sel = First-NotNull @(
    $ListActions.SelectedItem,$ListOps.SelectedItem,$ListToolkits.SelectedItem,$ListBackend.SelectedItem,$ListFrontend.SelectedItem,$ListDocs.SelectedItem
  )
  if ($sel -and $sel.WorkDir) { Safe-InvokeItem $sel.WorkDir }
})

$BtnQuickUp.Add_Click({ if ($global:QuickUp) { Start-Action $global:QuickUp } })
$BtnQuickPs.Add_Click({ if ($global:QuickPs) { Start-Action $global:QuickPs } })

$BtnQuickBackendRun.Add_Click({
  if (-not $global:QuickBackend) { return }
  $profile = [string]$CmbSpringRunProfile.SelectedItem
  if ($profile -and $profile -ne "(none)" -and $global:MavenInfo -and $global:MavenInfo.MavenCmd) {
    $cmd  = $global:MavenInfo.MavenCmd
    $wd   = $global:MavenInfo.WorkDir
    $pom  = $global:MavenInfo.Pom
    $args = "spring-boot:run -Dspring-boot.run.profiles=$profile -Dspring.profiles.active=$profile"
    Start-Action (New-Action "Backend" ("Maven: spring-boot run (profile=" + $profile + ")") $cmd $args $wd $pom "Maven")
  } else {
    Start-Action $global:QuickBackend
  }
})

$BtnQuickFrontendStart.Add_Click({ if ($global:QuickFront) { Start-Action $global:QuickFront } })
$BtnQuickHealth.Add_Click({ if ($global:QuickHealth) { Safe-InvokeItem $global:QuickHealth.Url } })
$BtnQuickSwagger.Add_Click({ if ($global:QuickSwagger) { Safe-InvokeItem $global:QuickSwagger.Url } })

$BtnBackendRun.Add_Click({
  if (-not $global:MavenInfo -or -not $global:MavenInfo.MavenCmd) { Append-Output "[WARN] Maven not detected."; return }
  $profile = [string]$CmbSpringRunProfile.SelectedItem
  $args = "spring-boot:run"
  $title = "Maven: spring-boot run"
  if ($profile -and $profile -ne "(none)") {
    $args  = "spring-boot:run -Dspring-boot.run.profiles=$profile -Dspring.profiles.active=$profile"
    $title = "Maven: spring-boot run (profile=" + $profile + ")"
  }
  Start-Action (New-Action "Backend" $title $global:MavenInfo.MavenCmd $args $global:MavenInfo.WorkDir $global:MavenInfo.Pom "Maven")
})

$BtnBackendTest.Add_Click({
  if ($global:MavenInfo -and $global:MavenInfo.MavenCmd) {
    Start-Action (New-Action "Backend" "Maven: clean test" $global:MavenInfo.MavenCmd "clean test" $global:MavenInfo.WorkDir $global:MavenInfo.Pom "Maven")
  }
})

$BtnBackendVerify.Add_Click({
  if ($global:MavenInfo -and $global:MavenInfo.MavenCmd) {
    Start-Action (New-Action "Backend" "Maven: clean verify" $global:MavenInfo.MavenCmd "clean verify" $global:MavenInfo.WorkDir $global:MavenInfo.Pom "Maven")
  }
})

$BtnBackendSpotless.Add_Click({
  if ($global:MavenInfo -and $global:MavenInfo.MavenCmd) {
    Start-Action (New-Action "Backend" "Maven: spotless check" $global:MavenInfo.MavenCmd "spotless:check" $global:MavenInfo.WorkDir $global:MavenInfo.Pom "Maven")
  }
})

$BtnOpenLink.Add_Click({ if ($ListLinks.SelectedItem) { Safe-InvokeItem $ListLinks.SelectedItem.Url } })
$BtnCopyLink.Add_Click({ if ($ListLinks.SelectedItem) { [System.Windows.Clipboard]::SetText([string]$ListLinks.SelectedItem.Url) } })
$BtnOpenDoc.Add_Click({ if ($ListDocs.SelectedItem -and $ListDocs.SelectedItem.Source) { Safe-InvokeItem $ListDocs.SelectedItem.Source } })

$BtnOpenRepo.Add_Click({ Safe-InvokeItem $global:RepoRoot })
$BtnOpenInCode.Add_Click({
  if (Get-CommandExists "code") { Start-Process "code" ("`"" + $global:RepoRoot + "`"") | Out-Null }
  else { Append-Output "[WARN] VS Code 'code' not found in PATH." }
})

$NavDashboard.Add_Click({ Show-View "Dashboard" })
$NavOperations.Add_Click({ Show-View "Operations" })
$NavToolkits.Add_Click({ Show-View "Toolkits" })
$NavBackend.Add_Click({ Show-View "Backend" })
$NavFrontend.Add_Click({ Show-View "Frontend" })
$NavObservability.Add_Click({ Show-View "Observability" })
$NavGuide.Add_Click({ Show-View "Guide" })
$NavSettings.Add_Click({ Show-View "Settings" })

# Init
$TxtRepo.Text = $global:RepoRoot
Reload-All
Show-View "Dashboard"
$null = $window.ShowDialog()
