<# tools\verify_dropin.ps1 #>
[CmdletBinding()]
param([Parameter(Mandatory = $true)][string]$RepoRoot)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Section([string]$Title) { Write-Host "`n==================== $Title ====================" -ForegroundColor Cyan }
function Ensure([bool]$Condition, [string]$Message) { if (-not $Condition) { throw $Message } }

function Test-Command([string]$Name) { return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue) }

function Find-EnvFiles([string]$Root) {
  $candidates = @((Join-Path $Root ".env"), (Join-Path $Root ".env.local"))
  $apps = Join-Path $Root "apps"
  if (Test-Path $apps) {
    $candidates += (Get-ChildItem $apps -Recurse -File -Filter ".env.local" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName)
    $candidates += (Get-ChildItem $apps -Recurse -File -Filter ".env" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName)
  }
  return $candidates | Where-Object { Test-Path $_ } | Select-Object -Unique
}

function EnvKey-PresentInFiles([string]$Key, [string[]]$Files) {
  foreach ($f in $Files) {
    try {
      foreach ($line in (Get-Content -LiteralPath $f -ErrorAction Stop)) {
        if ($line -match "^\s*#") { continue }
        if ($line -match "^\s*$([Regex]::Escape($Key))\s*=") { return $true }
      }
    } catch {}
  }
  return $false
}

Write-Section "VERIFY_DROPIN (START)"
Ensure (Test-Path -LiteralPath $RepoRoot) "RepoRoot not found: $RepoRoot"
Ensure (Test-Path -LiteralPath (Join-Path $RepoRoot ".git")) "Not a git repo: $RepoRoot"
Set-Location $RepoRoot

Write-Section "GIT"
Ensure (Test-Command "git") "git not found in PATH"
git status | Out-Host

Write-Section "ENV VAR PRESENCE"
$stateFile = Join-Path $RepoRoot ".dropin\outputs_required.json"
$envFiles = Find-EnvFiles $RepoRoot
Write-Host "Env files found:"; $envFiles | ForEach-Object { Write-Host " - $_" }

$missing = New-Object System.Collections.Generic.List[string]
if (Test-Path $stateFile) {
  $req = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
  $requiredEnv = @(); if ($req -and $req.env) { $requiredEnv = @($req.env) }
  foreach ($k in $requiredEnv) {
    if ([string]::IsNullOrWhiteSpace($k)) { continue }
    $present = ($null -ne (Get-Item -Path "Env:$k" -ErrorAction SilentlyContinue)) -or (EnvKey-PresentInFiles -Key $k -Files $envFiles)
    if (-not $present) { $missing.Add($k) }
  }
} else {
  Write-Host "No .dropin/outputs_required.json found; skipping env checks." -ForegroundColor Yellow
}

if ($missing.Count -gt 0) {
  Write-Host "Missing required env vars (names only):" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host " - $_" }
  throw "Verification failed."
} else { Write-Host "Env var presence check: OK" }

Write-Section "VERIFY_DROPIN (DONE)"
Write-Host "OK"
exit 0
