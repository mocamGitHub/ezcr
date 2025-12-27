\
<#
NexCyte Scheduler Master Bundle - One-command installer (Windows PowerShell)

Usage (run from repo root):
  powershell -ExecutionPolicy Bypass -File .\installer\Install_NexCyte_Scheduler.ps1

Optional:
  -BundleZip "C:\path\to\NexCyte_Scheduler_MasterBundle_2025-12-24.zip"
  -RepoRoot "C:\path\to\your\repo"
  -DryRun
  -Force

What it does:
- Extracts the bundle into a staging folder under <RepoRoot>\.nexcyte\_bundle_staging\
- Copies known-safe folders into the repo (with backups on conflicts):
    supabase\migrations\
    supabase\functions\
    supabase\seed\
    src\
    docs\
    scripts\
    claude\
    installer\ (kept)
- Writes an install log + manifest under <RepoRoot>\.nexcyte\_bundle_install_logs\

It does NOT:
- Attempt to guess your app/api route placement, tenant resolution, or auth wiring.
  Those must be completed by Claude Code following:
    claude\CLAUDE_EXECUTION_PROMPT_MASTER.md
#>

[CmdletBinding()]
param(
  [string]$BundleZip = "",
  [string]$RepoRoot = "",
  [switch]$DryRun,
  [switch]$Force
)

function Fail($msg) {
  Write-Host "ERROR: $msg" -ForegroundColor Red
  exit 1
}

function Info($msg) { Write-Host $msg -ForegroundColor Cyan }
function Ok($msg)   { Write-Host $msg -ForegroundColor Green }
function Warn($msg) { Write-Host $msg -ForegroundColor Yellow }

function Get-RepoRoot {
  param([string]$Start)
  $p = Resolve-Path -LiteralPath $Start
  while ($true) {
    if (Test-Path (Join-Path $p ".git") -PathType Container) { return $p }
    $parent = Split-Path $p -Parent
    if ($parent -eq $p -or [string]::IsNullOrEmpty($parent)) { break }
    $p = $parent
  }
  return ""
}

function Ensure-Dir($path) {
  if (-not (Test-Path $path)) { New-Item -ItemType Directory -Path $path | Out-Null }
}

function Timestamp { (Get-Date).ToString("yyyyMMdd_HHmmss") }

function Sha256File($path) {
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $bytes = [System.IO.File]::ReadAllBytes($path)
  $hash = $sha.ComputeHash($bytes)
  ($hash | ForEach-Object { $_.ToString("x2") }) -join ""
}

function Copy-WithBackup {
  param(
    [string]$Source,
    [string]$Dest,
    [string]$BackupRoot,
    [switch]$ForceOverwrite
  )

  if (-not (Test-Path $Source)) { return }

  $items = Get-ChildItem -LiteralPath $Source -Recurse -File
  foreach ($item in $items) {
    $rel = $item.FullName.Substring($Source.Length).TrimStart("\","/")
    $target = Join-Path $Dest $rel
    $targetDir = Split-Path $target -Parent
    if (-not (Test-Path $targetDir)) {
      if (-not $DryRun) { Ensure-Dir $targetDir }
    }

    if (Test-Path $target) {
      if (-not $ForceOverwrite -and -not $Force) {
        # backup existing
        $backupPath = Join-Path $BackupRoot $rel
        $backupDir = Split-Path $backupPath -Parent
        if (-not $DryRun) { Ensure-Dir $backupDir }
        if (-not $DryRun) { Copy-Item -LiteralPath $target -Destination $backupPath -Force }
        Warn "Backed up existing: $rel"
      }

      if (-not $ForceOverwrite -and -not $Force) {
        # do not overwrite unless Force
        Warn "Skipped existing (use -Force to overwrite): $rel"
        continue
      }
    }

    if ($DryRun) {
      Info "[DryRun] Would copy: $rel"
    } else {
      Copy-Item -LiteralPath $item.FullName -Destination $target -Force
    }
  }
}

# Resolve repo root
if ([string]::IsNullOrEmpty($RepoRoot)) {
  $RepoRoot = Get-RepoRoot -Start (Get-Location).Path
  if ([string]::IsNullOrEmpty($RepoRoot)) {
    $RepoRoot = (Get-Location).Path
    Warn "Could not find .git. Using current directory as RepoRoot: $RepoRoot"
  }
} else {
  $RepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path
}

# Resolve bundle zip
if ([string]::IsNullOrEmpty($BundleZip)) {
  # Try adjacent to this script (repo may contain installer folder copied from bundle)
  $scriptDir = Split-Path $MyInvocation.MyCommand.Path -Parent
  $candidates = @(
    Join-Path $scriptDir "..\NexCyte_Scheduler_MasterBundle_2025-12-24.zip"
  ) | ForEach-Object { Resolve-Path -LiteralPath $_ -ErrorAction SilentlyContinue } | Where-Object { $_ }
  if ($candidates.Count -gt 0) {
    $BundleZip = $candidates[0].Path
  } else {
    Fail "BundleZip not provided and could not auto-detect. Re-run with -BundleZip <path-to-zip>."
  }
} else {
  $BundleZip = (Resolve-Path -LiteralPath $BundleZip).Path
}

if (-not (Test-Path $BundleZip -PathType Leaf)) { Fail "Bundle zip not found: $BundleZip" }

$runId = Timestamp
$staging = Join-Path $RepoRoot ".nexcyte\_bundle_staging\$runId"
$logsDir = Join-Path $RepoRoot ".nexcyte\_bundle_install_logs\$runId"
$backupDir = Join-Path $RepoRoot ".nexcyte\_bundle_backups\$runId"

if (-not $DryRun) {
  Ensure-Dir $staging
  Ensure-Dir $logsDir
  Ensure-Dir $backupDir
}

Info "RepoRoot:  $RepoRoot"
Info "BundleZip: $BundleZip"
Info "RunId:     $runId"
if ($DryRun) { Warn "DryRun enabled: no files will be written." }

# Extract bundle
Info "Extracting bundle into staging…"
if (-not $DryRun) {
  Expand-Archive -LiteralPath $BundleZip -DestinationPath $staging -Force
}

# Locate extracted root folder (should be single folder)
$extractedRoot = Get-ChildItem -LiteralPath $staging | Where-Object { $_.PSIsContainer } | Select-Object -First 1
if (-not $extractedRoot) { Fail "Could not locate extracted root folder in staging." }

$bundleRoot = $extractedRoot.FullName
Ok "Bundle root: $bundleRoot"

# Log manifest
$hash = Sha256File $BundleZip
$manifest = @()
$manifest += "RunId=$runId"
$manifest += "RepoRoot=$RepoRoot"
$manifest += "BundleZip=$BundleZip"
$manifest += "BundleZipSHA256=$hash"
$manifest += "DryRun=$($DryRun.IsPresent)"
$manifest += "Force=$($Force.IsPresent)"
$manifestPath = Join-Path $logsDir "install_manifest.txt"
if (-not $DryRun) { $manifest | Out-File -FilePath $manifestPath -Encoding utf8 }

# Copy safe folders from bundle root into repo root
# We copy from *within the bundle root*, not from packs.
$copyMap = @(
  @{ src="supabase\migrations"; dst="supabase\migrations" },
  @{ src="supabase\functions";  dst="supabase\functions"  },
  @{ src="supabase\seed";       dst="supabase\seed"       },
  @{ src="src";                 dst="src"                 },
  @{ src="docs";                dst="docs"                },
  @{ src="scripts";             dst="scripts"             },
  @{ src="claude";              dst="claude"              },
  @{ src="installer";           dst="installer"           }
)

Info "Copying files into repo (with backups on conflicts)…"
foreach ($m in $copyMap) {
  $srcPath = Join-Path $bundleRoot $m.src
  $dstPath = Join-Path $RepoRoot  $m.dst
  if (-not (Test-Path $srcPath)) { continue }
  if ($DryRun) {
    Info "[DryRun] Would copy folder: $($m.src) -> $($m.dst)"
    continue
  }
  Ensure-Dir $dstPath
  Copy-WithBackup -Source $srcPath -Dest $dstPath -BackupRoot $backupDir -ForceOverwrite:$false
}

# Always drop a pointer to the master prompt
$pointer = Join-Path $logsDir "NEXT_STEPS.txt"
$next = @()
$next += "NEXT STEPS"
$next += "1) Open: $RepoRoot\claude\CLAUDE_EXECUTION_PROMPT_MASTER.md"
$next += "2) In Claude Code, run that prompt against this repo."
$next += "3) Then apply Supabase migrations (if not already) and configure env vars."
$next += ""
$next += "Backups (if any): $backupDir"
if (-not $DryRun) { $next | Out-File -FilePath $pointer -Encoding utf8 }

Ok "Installer completed."
Ok "Log folder: $logsDir"
Warn "Note: Route placement/auth/tenant wiring must still be completed by Claude Code per the master prompt."
