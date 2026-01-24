<#
Atlas Dev Dashboard (v1.5.7)
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

  # Strings are IEnumerable but must be treated as scalar
  if ($Value -is [string]) { return ,$Value }

  # Already an array
  if ($Value -is [System.Array]) { return $Value }

  # Generic lists / IEnumerable -> materialize to object[]
  if ($Value -is [System.Collections.IEnumerable]) {
    try {
      $list = New-Object System.Collections.Generic.List[object]
      foreach ($x in $Value) { $list.Add($x) | Out-Null }
      return $list.ToArray()
    } catch {
      # fallback: single item
      return ,$Value
    }
  }

  return ,$Value
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
    (Join-Path $RepoRoot "backend\src\main\resources")
    (Join-Path $RepoRoot "src\main\resources")
    (Join-Path $RepoRoot "backend\src\test\resources")
    (Join-Path $RepoRoot "src\test\resources")
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
    (Join-Path $RepoRoot "frontend\playwright.config.ts")
    (Join-Path $RepoRoot "frontend\playwright.config.js")
    (Join-Path $RepoRoot "playwright.config.ts")
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
        xmlns:shell="clr-namespace:System.Windows.Shell;assembly=PresentationFramework"
        Title="Atlas Dev Dashboard" Height="820" Width="1280"
        WindowStartupLocation="CenterScreen" Background="#0B1220" Foreground="#E5E7EB" WindowStyle="None" ResizeMode="CanResize" ShowInTaskbar="True">
  <Window.Resources>
    <SolidColorBrush x:Key="Surface"  Color="#111827"/>
    <SolidColorBrush x:Key="Surface2" Color="#0F172A"/>
    <SolidColorBrush x:Key="Border"   Color="#243041"/>
    <SolidColorBrush x:Key="Muted"    Color="#9CA3AF"/>
    <SolidColorBrush x:Key="Accent"   Color="#22C55E"/>

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


    <Style TargetType="ListBox">
      <Setter Property="Margin" Value="6"/>
      <Setter Property="Background" Value="{StaticResource Surface2}"/>
      <Setter Property="Foreground" Value="#E5E7EB"/>
      <Setter Property="BorderBrush" Value="{StaticResource Border}"/>
      <Setter Property="BorderThickness" Value="1"/>
    </Style>

    <Style TargetType="ComboBox">
      <Setter Property="Margin" Value="6"/>
      <Setter Property="Padding" Value="8,6"/>
      <Setter Property="Background" Value="{StaticResource Surface2}"/>
      <Setter Property="Foreground" Value="#E5E7EB"/>
      <Setter Property="BorderBrush" Value="{StaticResource Border}"/>
      <Setter Property="BorderThickness" Value="1"/>
    </Style>

    <Style TargetType="ToggleButton">
      <Setter Property="Margin" Value="6"/>
      <Setter Property="Padding" Value="10,8"/>
      <Setter Property="Background" Value="{StaticResource Surface2}"/>
      <Setter Property="Foreground" Value="#E5E7EB"/>
      <Setter Property="BorderBrush" Value="{StaticResource Border}"/>
      <Setter Property="BorderThickness" Value="1"/>
      <Setter Property="Cursor" Value="Hand"/>
      <Setter Property="Template">
        <Setter.Value>
          <ControlTemplate TargetType="ToggleButton">
            <Border x:Name="Bd" CornerRadius="10" Background="{TemplateBinding Background}" BorderBrush="{TemplateBinding BorderBrush}" BorderThickness="{TemplateBinding BorderThickness}">
              <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center" TextElement.Foreground="{TemplateBinding Foreground}"/>
            </Border>
            <ControlTemplate.Triggers>
              <Trigger Property="IsMouseOver" Value="True">
                <Setter TargetName="Bd" Property="Background" Value="#111E35"/>
                <Setter TargetName="Bd" Property="BorderBrush" Value="#3B4A63"/>
              </Trigger>
              <Trigger Property="IsPressed" Value="True">
                <Setter TargetName="Bd" Property="Background" Value="#0B1220"/>
              </Trigger>
              <Trigger Property="IsChecked" Value="True">
                <Setter TargetName="Bd" Property="BorderBrush" Value="{StaticResource Accent}"/>
                <Setter TargetName="Bd" Property="Background" Value="#0B1B33"/>
              </Trigger>
              <Trigger Property="IsEnabled" Value="False">
                <Setter Property="Opacity" Value="0.55"/>
              </Trigger>
            </ControlTemplate.Triggers>
          </ControlTemplate>
        </Setter.Value>
      </Setter>
    </Style>


    <Style TargetType="Label">
      <Setter Property="Foreground" Value="#E5E7EB"/>
    </Style>

    <Style TargetType="ListViewItem">
      <Setter Property="Foreground" Value="#E5E7EB"/>
    </Style>

    <Style TargetType="ListBoxItem">
      <Setter Property="Foreground" Value="#E5E7EB"/>
    </Style>

    <Style TargetType="ComboBoxItem">
      <Setter Property="Foreground" Value="#E5E7EB"/>
    </Style>

    <Style TargetType="GridViewColumnHeader">
      <Setter Property="Background" Value="{StaticResource Surface}"/>
      <Setter Property="Foreground" Value="#E5E7EB"/>
      <Setter Property="BorderBrush" Value="{StaticResource Border}"/>
      <Setter Property="BorderThickness" Value="0,0,0,1"/>
      <Setter Property="Padding" Value="10,6"/>
    </Style>
<Style TargetType="GroupBox">
            <Setter Property="Foreground" Value="#E5E7EB"/>
<Setter Property="Margin" Value="10"/>
      <Setter Property="Padding" Value="10"/>
      <Setter Property="BorderBrush" Value="{StaticResource Border}"/>
      <Setter Property="BorderThickness" Value="1"/>
    </Style>

    <Style TargetType="TextBlock">
      <Setter Property="Margin" Value="4,2"/>
      <Setter Property="Foreground" Value="#E5E7EB"/>
    </Style>

    <Style x:Key="NavButton" TargetType="ToggleButton">
      <Setter Property="Margin" Value="6,6"/>
      <Setter Property="Padding" Value="12,10"/>
      <Setter Property="Background" Value="#0F172A"/>
      <Setter Property="Foreground" Value="#E5E7EB"/>
      <Setter Property="BorderBrush" Value="{StaticResource Border}"/>
      <Setter Property="MinWidth" Value="0"/>
      <Setter Property="HorizontalContentAlignment" Value="Left"/>
      <Setter Property="Template">
        <Setter.Value>
          <ControlTemplate TargetType="ToggleButton">
            <Border x:Name="Bd" CornerRadius="12" Background="{TemplateBinding Background}" BorderBrush="{TemplateBinding BorderBrush}" BorderThickness="1">
              <Grid Margin="10,6">
                <Grid.ColumnDefinitions>
                  <ColumnDefinition Width="30"/>
                  <ColumnDefinition Width="*"/>
                </Grid.ColumnDefinitions>
                <TextBlock x:Name="Icon" Text="{TemplateBinding Tag}" FontFamily="Segoe MDL2 Assets" FontSize="16" Foreground="{StaticResource Muted}" VerticalAlignment="Center"/>
                <TextBlock x:Name="Txt" Grid.Column="1" Text="{TemplateBinding Content}" Foreground="{TemplateBinding Foreground}" VerticalAlignment="Center" Margin="10,0,0,0"/>
              </Grid>
            </Border>
            <ControlTemplate.Triggers>
              <Trigger Property="IsMouseOver" Value="True">
                <Setter TargetName="Bd" Property="Background" Value="#111E35"/>
                <Setter TargetName="Bd" Property="BorderBrush" Value="#3B4A63"/>
              </Trigger>
              <Trigger Property="IsPressed" Value="True">
                <Setter TargetName="Bd" Property="Background" Value="#0B1220"/>
              </Trigger>
              <Trigger Property="IsChecked" Value="True">
                <Setter TargetName="Bd" Property="Background" Value="#0B1B33"/>
                <Setter TargetName="Bd" Property="BorderBrush" Value="{StaticResource Accent}"/>
                <Setter TargetName="Icon" Property="Foreground" Value="{StaticResource Accent}"/>
                <Setter Property="Foreground" Value="#E5E7EB"/>
              </Trigger>
              <Trigger Property="IsEnabled" Value="False">
                <Setter Property="Opacity" Value="0.55"/>
              </Trigger>
            </ControlTemplate.Triggers>
          </ControlTemplate>
        </Setter.Value>
      </Setter>
    </Style>

    <Style x:Key="TitleBarButton" TargetType="Button">
      <Setter Property="Width" Value="44"/>
      <Setter Property="Height" Value="32"/>
      <Setter Property="Margin" Value="2,0"/>
      <Setter Property="Padding" Value="0"/>
      <Setter Property="Background" Value="Transparent"/>
      <Setter Property="Foreground" Value="#E5E7EB"/>
      <Setter Property="BorderBrush" Value="Transparent"/>
      <Setter Property="BorderThickness" Value="0"/>
      <Setter Property="FontFamily" Value="Segoe MDL2 Assets"/>
      <Setter Property="FontSize" Value="12"/>
      <Setter Property="Cursor" Value="Hand"/>
      <Setter Property="Template">
        <Setter.Value>
          <ControlTemplate TargetType="Button">
            <Border CornerRadius="8" Background="{TemplateBinding Background}">
              <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
            </Border>
            <ControlTemplate.Triggers>
              <Trigger Property="IsMouseOver" Value="True">
                <Setter Property="Background" Value="#111E35"/>
              </Trigger>
              <Trigger Property="IsPressed" Value="True">
                <Setter Property="Background" Value="#0B1220"/>
              </Trigger>
            </ControlTemplate.Triggers>
          </ControlTemplate>
        </Setter.Value>
      </Setter>
    </Style>

    <Style x:Key="TitleBarCloseButton" TargetType="Button" BasedOn="{StaticResource TitleBarButton}">
      <Style.Triggers>
        <Trigger Property="IsMouseOver" Value="True">
          <Setter Property="Background" Value="#B91C1C"/>
        </Trigger>
        <Trigger Property="IsPressed" Value="True">
          <Setter Property="Background" Value="#7F1D1D"/>
        </Trigger>
      </Style.Triggers>
    </Style>
  </Window.Resources>

  <shell:WindowChrome.WindowChrome>
    <shell:WindowChrome CaptionHeight="44" ResizeBorderThickness="6" CornerRadius="0" GlassFrameThickness="0" UseAeroCaptionButtons="False"/>
  </shell:WindowChrome.WindowChrome>

  <Grid>
  <DockPanel LastChildFill="True">

    <!-- Custom Title Bar -->
    <Border x:Name="TitleBar" DockPanel.Dock="Top" Background="#071025" BorderBrush="{StaticResource Border}" BorderThickness="0,0,0,1" Padding="10">
      <Grid>
        <Grid.ColumnDefinitions>
          <ColumnDefinition Width="*"/>
          <ColumnDefinition Width="Auto"/>
          <ColumnDefinition Width="Auto"/>
        </Grid.ColumnDefinitions>

        <StackPanel Orientation="Vertical" VerticalAlignment="Center">
          <TextBlock Text="Atlas Dev Dashboard" FontSize="16" FontWeight="SemiBold"/>
          <TextBlock Text="Operations, Observability, Toolkits and Guide - auto-discovered from your repository" Foreground="{StaticResource Muted}"/>
        </StackPanel>

        <StackPanel Grid.Column="1" Orientation="Horizontal" VerticalAlignment="Center" Margin="0,0,10,0">
          <Button x:Name="BtnCmdPalette" Content="Command Palette (Ctrl+K)"/>
          <Button x:Name="BtnReload" Content="Reload"/>
          <Button x:Name="BtnClear" Content="Clear Output"/>
          <Button x:Name="BtnStop" Content="Stop Current"/>
        </StackPanel>

        <StackPanel Grid.Column="2" Orientation="Horizontal" VerticalAlignment="Center">
          <Button x:Name="BtnMin" Style="{StaticResource TitleBarButton}" Content="&#xE921;" ToolTip="Minimize"/>
          <Button x:Name="BtnMax" Style="{StaticResource TitleBarButton}" Content="&#xE922;" ToolTip="Maximize / Restore"/>
          <Button x:Name="BtnClose" Style="{StaticResource TitleBarCloseButton}" Content="&#xE8BB;" ToolTip="Close"/>
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
              <ToggleButton x:Name="NavDashboard"     Style="{StaticResource NavButton}" Tag="&#xE80F;" Content="Dashboard" IsChecked="True"/>
              <ToggleButton x:Name="NavOperations"    Style="{StaticResource NavButton}" Tag="&#xE7C1;" Content="Operations"/>
              <ToggleButton x:Name="NavToolkits"      Style="{StaticResource NavButton}" Tag="&#xE8B7;" Content="Toolkits"/>
              <ToggleButton x:Name="NavBackend"       Style="{StaticResource NavButton}" Tag="&#xE943;" Content="Backend"/>
              <ToggleButton x:Name="NavFrontend"      Style="{StaticResource NavButton}" Tag="&#xE7C3;" Content="Frontend"/>
              <ToggleButton x:Name="NavObservability" Style="{StaticResource NavButton}" Tag="&#xE9D9;" Content="Observability"/>
              <ToggleButton x:Name="NavGuide"         Style="{StaticResource NavButton}" Tag="&#xE8A5;" Content="Guide"/>
              <Separator Margin="8"/>
              <ToggleButton x:Name="NavSettings"      Style="{StaticResource NavButton}" Tag="&#xE713;" Content="Settings"/>
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

  <!-- Command Palette Overlay -->
  <Border x:Name="CmdOverlay" Background="#A6000000" Visibility="Collapsed">
    <Grid VerticalAlignment="Center" HorizontalAlignment="Center" Width="920" MaxWidth="920">
      <Border Background="{StaticResource Surface}" BorderBrush="{StaticResource Border}" BorderThickness="1" CornerRadius="18" Padding="14">
        <Grid>
          <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
          </Grid.RowDefinitions>

          <StackPanel Grid.Row="0">
            <TextBlock Text="Command Palette" FontSize="16" FontWeight="SemiBold"/>
            <TextBlock Text="Fuzzy search + categories + recent commands. Works on actions, links, Spring profiles and Playwright projects." Foreground="{StaticResource Muted}"/>
            <Grid Margin="0,10,0,8">
              <Grid.ColumnDefinitions>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="220"/>
                <ColumnDefinition Width="Auto"/>
                <ColumnDefinition Width="Auto"/>
              </Grid.ColumnDefinitions>
              <TextBox x:Name="TxtCmdSearch" MinHeight="34" Margin="0,0,10,0"/>
              <ComboBox x:Name="CmbCmdCategory" Grid.Column="1" MinHeight="34" Margin="0,0,10,0"/>
              <ToggleButton x:Name="TglCmdRecent" Grid.Column="2" Content="Recent" MinWidth="90" Margin="0,0,10,0"/>
              <Button x:Name="BtnCmdClearRecent" Grid.Column="3" Content="Clear" MinWidth="80"/>
            </Grid>
          </StackPanel>

          <ListBox Grid.Row="1" x:Name="LstCmdResults" Background="{StaticResource Surface2}" BorderBrush="{StaticResource Border}" BorderThickness="1" Margin="0,6,0,6">
            <ListBox.ItemTemplate>
              <DataTemplate>
                <Grid Margin="8,6">
                  <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="140"/>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="130"/>
                  </Grid.ColumnDefinitions>
                  <Border Grid.Column="0" Background="#0B1220" BorderBrush="{StaticResource Border}" BorderThickness="1" CornerRadius="10" Padding="8,4" Margin="0,0,10,0">
                    <TextBlock Text="{Binding Category}" Foreground="{StaticResource Muted}" FontSize="12"/>
                  </Border>
                  <StackPanel Grid.Column="1">
                    <TextBlock Text="{Binding Title}" FontSize="13" FontWeight="SemiBold"/>
                    <TextBlock Text="{Binding Hint}" Foreground="{StaticResource Muted}" TextTrimming="CharacterEllipsis"/>
                  </StackPanel>
                  <TextBlock Grid.Column="2" Text="{Binding Shortcut}" Foreground="{StaticResource Muted}" VerticalAlignment="Center" HorizontalAlignment="Right" Margin="10,0,0,0"/>
                </Grid>
              </DataTemplate>
            </ListBox.ItemTemplate>
          </ListBox>

          <DockPanel Grid.Row="2" LastChildFill="False" Margin="0,6,0,0">
            <TextBlock x:Name="TxtCmdHint" Text="Ctrl+K: open | Enter: run | Esc: close | Alt+1..7: navigate | ↑↓: navigate" Foreground="{StaticResource Muted}" VerticalAlignment="Center"/>
            <StackPanel Orientation="Horizontal" DockPanel.Dock="Right">
              <Button x:Name="BtnCmdRun" Content="Run" MinWidth="90"/>
              <Button x:Name="BtnCmdClose" Content="Close" MinWidth="90"/>
            </StackPanel>
          </DockPanel>
        </Grid>
      </Border>
    </Grid>
  </Border>
</Grid>
</Window>

'@

function New-WindowFromXaml([xml]$XamlDoc) {
  $reader = New-Object System.Xml.XmlNodeReader $XamlDoc
  return [Windows.Markup.XamlReader]::Load($reader)
}

function Get-FallbackXamlDoc([xml]$XamlDoc) {
  # Fallback: remove WindowChrome if the platform cannot instantiate it.
  $raw = $XamlDoc.OuterXml

  # Remove WindowChrome block and shell namespace
  $raw = [regex]::Replace($raw, '(?s)<shell:WindowChrome\.WindowChrome>.*?</shell:WindowChrome\.WindowChrome>', '')
  $raw = [regex]::Replace($raw, '\s+xmlns:shell="[^"]+"', '')

  # Restore standard window chrome
  $raw = $raw -replace 'WindowStyle="None"', 'WindowStyle="SingleBorderWindow"'
  $raw = $raw -replace 'ResizeMode="CanResizeWithGrip"', 'ResizeMode="CanResize"'

  # Ensure a readable foreground in case theme resources fail
  if ($raw -notmatch 'Foreground="#') {
    $raw = $raw -replace '<Window ', '<Window Foreground="#E5E7EB" '
  }

  try { return ([xml]$raw) } catch { return $XamlDoc }
}

try {
  $window = New-WindowFromXaml $xaml
} catch {
  # If the failure looks like WindowChrome / missing type, retry without custom chrome
  $msg = $_.Exception.Message
  if ($msg -match 'WindowChrome' -or $msg -match 'type inconnu' -or $msg -match 'unknown type') {
    $xaml2 = Get-FallbackXamlDoc $xaml
    $window = New-WindowFromXaml $xaml2
  } else {
    throw
  }
}

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
$BtnMin      = Get-Control "BtnMin"
$BtnMax      = Get-Control "BtnMax"
$BtnClose    = Get-Control "BtnClose"
$TitleBar    = Get-Control "TitleBar"

$BtnCmdPalette = Get-Control "BtnCmdPalette"
$CmdOverlay   = Get-Control "CmdOverlay"
$TxtCmdSearch = Get-Control "TxtCmdSearch"
$LstCmdResults = Get-Control "LstCmdResults"
$TxtCmdHint   = Get-Control "TxtCmdHint"
$BtnCmdRun    = Get-Control "BtnCmdRun"
$BtnCmdClose  = Get-Control "BtnCmdClose"

$CmbCmdCategory = Get-Control "CmbCmdCategory"
$TglCmdRecent  = Get-Control "TglCmdRecent"
$BtnCmdClearRecent = Get-Control "BtnCmdClearRecent"

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


function Set-NavChecked([string]$Name) {
  $map = @{
    "Dashboard"     = $NavDashboard
    "Operations"    = $NavOperations
    "Toolkits"      = $NavToolkits
    "Backend"       = $NavBackend
    "Frontend"      = $NavFrontend
    "Observability" = $NavObservability
    "Guide"         = $NavGuide
    "Settings"      = $NavSettings
  }
  foreach ($k in $map.Keys) {
    try { $map[$k].IsChecked = ($k -eq $Name) } catch { }
  }
}

function Get-HashString([string]$Text) {
  try {
    $sha1 = [System.Security.Cryptography.SHA1]::Create()
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
    $hash  = $sha1.ComputeHash($bytes)
    return ([System.BitConverter]::ToString($hash) -replace "-", "").ToLowerInvariant()
  } catch {
    return ([Guid]::NewGuid().ToString("N"))
  }
}

function Get-CommandItemId($item) {
  if ($null -eq $item) { return $null }
  try {
    if ($item.Type -eq "Link" -and $item.Url) { return "link|" + [string]$item.Url }
    if ($item.Action) {
      $src = ""
      try { $src = [string]$item.Action.Source } catch { }
      $k = ([string]$item.Action.Command) + "|" + ([string]$item.Action.Args) + "|" + ([string]$item.Action.WorkDir) + "|" + $src
      return "action|" + (Get-HashString $k)
    }
  } catch { }
  return "item|" + (Get-HashString ($item.Title + "|" + $item.Category + "|" + $item.Hint))
}

function Get-RecentStorePath {
  try {
    $dir = Join-Path $env:LOCALAPPDATA "AtlasDevConsole"
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
    return (Join-Path $dir "recent.json")
  } catch {
    return (Join-Path $env:TEMP "AtlasDevConsole_recent.json")
  }
}

function Load-RecentCommands {
  $path = Get-RecentStorePath
  $global:RecentStorePath = $path
  $global:RecentCommands = @()
  if (Test-Path $path) {
    try {
      $raw = Get-Content -Raw -Path $path
      if ($raw) {
        $data = $raw | ConvertFrom-Json
        if ($data) { $global:RecentCommands = (To-Array $data) }
      }
    } catch { $global:RecentCommands = @() }
  }
  $seen = @{}
  $out = New-Object System.Collections.Generic.List[object]
  foreach ($r in $global:RecentCommands) {
    if (-not $r) { continue }
    $id = [string]$r.Id
    if (-not $id) { continue }
    if ($seen.ContainsKey($id)) { continue }
    $seen[$id] = $true
    $out.Add($r) | Out-Null
    if ($out.Count -ge 20) { break }
  }
  $global:RecentCommands = $out.ToArray()
}

function Save-RecentCommands {
  try {
    $path = $global:RecentStorePath
    if (-not $path) { $path = Get-RecentStorePath }
    ($global:RecentCommands | ConvertTo-Json -Depth 5) | Set-Content -Path $path -Encoding UTF8
  } catch { }
}

function Add-RecentCommand($item) {
  if (-not $item) { return }
  $id = Get-CommandItemId $item
  if (-not $id) { return }

  $entry = [PSCustomObject]@{
    Id       = $id
    Type     = [string]$item.Type
    Category = [string]$item.Category
    Title    = [string]$item.Title
    Hint     = [string]$item.Hint
    Url      = [string]$item.Url
    When     = (Get-Date).ToString("s")
  }

  $list = New-Object System.Collections.Generic.List[object]
  $list.Add($entry) | Out-Null
  foreach ($r in (To-Array $global:RecentCommands)) {
    if ($r -and [string]$r.Id -ne $id) { $list.Add($r) | Out-Null }
  }
  $global:RecentCommands = @($list.ToArray() | Select-Object -First 20)
  Save-RecentCommands
}

function Get-FuzzyScore([string]$Text, [string]$Query) {
  if (-not $Query) { return 0 }
  if ($null -eq $Text) { $Text = "" }
  $t = $Text.ToLowerInvariant()
  if ($null -eq $Query) { $Query = "" }
  $q = $Query.ToLowerInvariant()
  if (-not $t -or -not $q) { return -1 }

  if ($t.Contains($q)) { return 10000 - ($t.Length - $q.Length) }

  $ti = 0
  $score = 0
  foreach ($ch in $q.ToCharArray()) {
    $found = $false
    while ($ti -lt $t.Length) {
      if ($t[$ti] -eq $ch) { $score += 15; $ti++; $found = $true; break }
      $score -= 1
      $ti++
    }
    if (-not $found) { return -1 }
  }
  return $score
}

function Build-CommandCatalog {
  Load-RecentCommands

  $catalog = New-Object System.Collections.Generic.List[object]

  foreach ($a in ($global:AllActions | Where-Object { $_ -and $_.Title })) {
    $obj = [PSCustomObject]@{
      Id       = $null
      Type     = "Action"
      Category = [string]$a.Category
      Title    = [string]$a.Title
      Hint     = ("Kind: " + [string]$a.Kind)
      Shortcut = "Enter"
      Action   = $a
      Url      = $null
    }
    $obj.Id = Get-CommandItemId $obj
    $catalog.Add($obj) | Out-Null
  }

  foreach ($l in (To-Array $global:Links)) {
    if ($null -ne $l -and $l.PSObject.Properties.Match("Url").Count -gt 0) {
      $obj = [PSCustomObject]@{
        Id       = $null
        Type     = "Link"
        Category = "Link"
        Title    = [string]$l.Title
        Hint     = [string]$l.Url
        Shortcut = "Enter"
        Action   = $null
        Url      = [string]$l.Url
      }
      $obj.Id = Get-CommandItemId $obj
      $catalog.Add($obj) | Out-Null
    }
  }

  $profiles = @()
  try { $profiles = @(Discover-SpringProfiles $global:RepoRoot) } catch { $profiles = @() }
  if ($global:MavenInfo -and $global:MavenInfo.MavenCmd) {
    foreach ($p in $profiles) {
      if (-not $p) { continue }
      $args  = "spring-boot:run -Dspring-boot.run.profiles=$p -Dspring.profiles.active=$p"
      $title = "Run backend (profile=" + $p + ")"
      $act = New-Action "Backend" $title $global:MavenInfo.MavenCmd $args $global:MavenInfo.WorkDir $global:MavenInfo.Pom "Maven"
      $obj = [PSCustomObject]@{
        Id       = $null
        Type     = "Action"
        Category = "Backend"
        Title    = $title
        Hint     = "Spring profile shortcut"
        Shortcut = "Enter"
        Action   = $act
        Url      = $null
      }
      $obj.Id = Get-CommandItemId $obj
      $catalog.Add($obj) | Out-Null
    }
  }

  $pw = @()
  try { $pw = @(Discover-PlaywrightProjects $global:RepoRoot) } catch { $pw = @() }
  $base = $null
  try { $base = ($global:FrontendActions | Where-Object { $_.Title -match "npm run .*?(e2e|playwright)" } | Select-Object -First 1) } catch { $base = $null }

  if ($base -and $pw.Count -gt 0) {
    foreach ($proj in $pw) {
      if (-not $proj) { continue }
      $args = ($base.Args + " -- --project=" + $proj)
      $title = ($base.Title + " (project=" + $proj + ")")
      $act = New-Action "Frontend" $title $base.Command $args $base.WorkDir $base.Source "Npm"
      $obj = [PSCustomObject]@{
        Id       = $null
        Type     = "Action"
        Category = "Frontend"
        Title    = $title
        Hint     = "Playwright project shortcut"
        Shortcut = "Enter"
        Action   = $act
        Url      = $null
      }
      $obj.Id = Get-CommandItemId $obj
      $catalog.Add($obj) | Out-Null
    }
  }

  $global:CommandCatalog = $catalog.ToArray()

  $cats = @("All")
  try { $cats += @($global:CommandCatalog | Select-Object -ExpandProperty Category -Unique | Sort-Object) } catch { }
  $global:CommandCategories = $cats
  try { $CmbCmdCategory.ItemsSource = $cats; $CmbCmdCategory.SelectedIndex = 0 } catch { }

  $global:CatalogById = @{}
  foreach ($it in $global:CommandCatalog) { if ($it -and $it.Id) { $global:CatalogById[[string]$it.Id] = $it } }
}

function Get-RecentCatalogItems {
  $items = New-Object System.Collections.Generic.List[object]
  foreach ($r in (To-Array $global:RecentCommands)) {
    if (-not $r) { continue }
    $id = [string]$r.Id
    if (-not $id) { continue }
    if ($global:CatalogById.ContainsKey($id)) {
      $it = $global:CatalogById[$id]
      $items.Add([PSCustomObject]@{
        Id=$it.Id; Type=$it.Type; Category="Recent"; Title=$it.Title; Hint=$it.Hint; Shortcut=$it.Shortcut; Action=$it.Action; Url=$it.Url
      }) | Out-Null
    } elseif ($id.StartsWith("link|")) {
      $url = $id.Substring(5)
      $items.Add([PSCustomObject]@{ Id=$id; Type="Link"; Category="Recent"; Title=([string]$r.Title); Hint=$url; Shortcut="Enter"; Action=$null; Url=$url }) | Out-Null
    }
  }
  return @($items)
}

function Refresh-CommandPalette([string]$Query) {
  if (-not $global:CommandCatalog) { Build-CommandCatalog }

  $q = ([string]$Query).Trim()
  $cat = "All"
  try { $cat = [string]$CmbCmdCategory.SelectedItem } catch { }
  $recentOnly = $false
  try { $recentOnly = ($TglCmdRecent.IsChecked -eq $true) } catch { }

  $items = @()

  if (-not $q) {
    $items = Get-RecentCatalogItems
    if (-not $recentOnly) { $items += @($global:CommandCatalog | Select-Object -First 40) }
  } else {
    $base = $global:CommandCatalog

    if ($cat -and $cat -ne "All") { $base = @($base | Where-Object { $_.Category -eq $cat }) }

    if ($recentOnly) {
      $recentIds = @((To-Array $global:RecentCommands) | ForEach-Object { [string]$_.Id })
      $base = @($base | Where-Object { $recentIds -contains [string]$_.Id })
    }

    $scored = foreach ($it in $base) {
      $txt = ($it.Title + " " + $it.Category + " " + $it.Hint)
      $s = Get-FuzzyScore $txt $q
      if ($s -ge 0) { [PSCustomObject]@{ Score=$s; Item=$it } }
    }

    $items = @($scored | Sort-Object -Property Score -Descending | Select-Object -First 60 | ForEach-Object { $_.Item })
  }

  if ($cat -and $cat -ne "All" -and $items.Count -gt 0 -and $q -eq "") {
    $items = @($items | Where-Object { $_.Category -eq "Recent" -or $_.Category -eq $cat } | Select-Object -First 60)
  }

  $LstCmdResults.ItemsSource = $items
  if ($items.Count -gt 0) { $LstCmdResults.SelectedIndex = 0 }
  $TxtCmdHint.Text = ("Ctrl+K: open | Enter: run | Esc: close | Results: " + $items.Count)
}

function Show-CommandPalette {
  if (-not $global:CommandCatalog) { Build-CommandCatalog }
  try { $CmbCmdCategory.SelectedIndex = 0 } catch { }
  try { $TglCmdRecent.IsChecked = $false } catch { }
  $CmdOverlay.Visibility = "Visible"
  $TxtCmdSearch.Text = ""
  Refresh-CommandPalette ""
  $TxtCmdSearch.Focus() | Out-Null
}

function Hide-CommandPalette {
  $CmdOverlay.Visibility = "Collapsed"
  $TxtCmdSearch.Text = ""
}

function Clear-RecentCommands {
  $global:RecentCommands = @()
  Save-RecentCommands
}

function Run-CommandPaletteSelection {
  $sel = $LstCmdResults.SelectedItem
  if (-not $sel) { return }
  Hide-CommandPalette
  Add-RecentCommand $sel

  if ($sel.Type -eq "Link" -and $sel.Url) { Safe-InvokeItem $sel.Url; return }
  if ($sel.Action) { Start-Action $sel.Action; return }
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
      $global:ComposeActions = (To-Array $ca)
    }
    else {
      $global:ComposeActions = (To-Array $ca)
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
    elseif ($ba -is [System.Collections.IEnumerable] -and -not ($ba -is [string])) { $global:BackendActions = (To-Array $ba) }
    else { $global:BackendActions = (To-Array $ba) }
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

  Build-CommandCatalog

  Set-Status "Ready."
}

# ----------------------------
# Events
# ----------------------------
$BtnReload.Add_Click({ Reload-All })
$BtnClear.Add_Click({ $TxtOutput.Clear(); $TxtHints.Clear() })
$BtnStop.Add_Click({ Stop-Current })

# Title bar window controls
$BtnMin.Add_Click({ $window.WindowState = "Minimized" })
$BtnMax.Add_Click({
  if ($window.WindowState -eq "Maximized") { $window.WindowState = "Normal" }
  else { $window.WindowState = "Maximized" }
})
$BtnClose.Add_Click({ $window.Close() })

# Drag window from custom title bar (double click to maximize/restore)
$TitleBar.Add_MouseLeftButtonDown({
  param($s,$e)
  if ($e.ClickCount -eq 2) {
    if ($window.WindowState -eq "Maximized") { $window.WindowState = "Normal" }
    else { $window.WindowState = "Maximized" }
  } else {
    try { $window.DragMove() } catch { }
  }
})


# Command palette
$BtnCmdPalette.Add_Click({
  if ($CmdOverlay.Visibility -eq "Visible") { Hide-CommandPalette } else { Show-CommandPalette }
})
$BtnCmdRun.Add_Click({ Run-CommandPaletteSelection })
$BtnCmdClose.Add_Click({ Hide-CommandPalette })

$TxtCmdSearch.Add_TextChanged({ Refresh-CommandPalette $TxtCmdSearch.Text })

$CmbCmdCategory.Add_SelectionChanged({ Refresh-CommandPalette $TxtCmdSearch.Text })
$TglCmdRecent.Add_Click({ Refresh-CommandPalette $TxtCmdSearch.Text })
$BtnCmdClearRecent.Add_Click({ Clear-RecentCommands; Refresh-CommandPalette $TxtCmdSearch.Text })
$LstCmdResults.Add_MouseDoubleClick({ Run-CommandPaletteSelection })

$window.Add_PreviewKeyDown({
  param($s,$e)
  $mods = [System.Windows.Input.Keyboard]::Modifiers
  if (($mods -band [System.Windows.Input.ModifierKeys]::Control) -and $e.Key -eq "K") {
    if ($CmdOverlay.Visibility -eq "Visible") { Hide-CommandPalette } else { Show-CommandPalette }
    $e.Handled = $true
    return
  }
  if ($CmdOverlay.Visibility -eq "Visible") {
    if ($e.Key -eq "Escape") { Hide-CommandPalette; $e.Handled = $true; return }
    if ($e.Key -eq "Enter")  { Run-CommandPaletteSelection; $e.Handled = $true; return }
  }
})


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

$NavDashboard.Add_Click({ Set-NavChecked "Dashboard"; Show-View "Dashboard" })
$NavOperations.Add_Click({ Set-NavChecked "Operations"; Show-View "Operations" })
$NavToolkits.Add_Click({ Set-NavChecked "Toolkits"; Show-View "Toolkits" })
$NavBackend.Add_Click({ Set-NavChecked "Backend"; Show-View "Backend" })
$NavFrontend.Add_Click({ Set-NavChecked "Frontend"; Show-View "Frontend" })
$NavObservability.Add_Click({ Set-NavChecked "Observability"; Show-View "Observability" })
$NavGuide.Add_Click({ Set-NavChecked "Guide"; Show-View "Guide" })
$NavSettings.Add_Click({ Set-NavChecked "Settings"; Show-View "Settings" })

# Init
Set-NavChecked "Dashboard"
$TxtRepo.Text = $global:RepoRoot
Reload-All
Show-View "Dashboard"
$null = $window.ShowDialog()
