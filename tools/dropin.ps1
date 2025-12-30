[CmdletBinding()]
param(
  [Parameter(Mandatory=$false)]
  [switch]$SkipGitCheckpoint,
  [Parameter(Mandatory=$false)]
  [switch]$SkipVerify
)

$pwsh = (Get-Command pwsh -ErrorAction SilentlyContinue).Source
if (-not $pwsh) { throw "pwsh not found in PATH." }

$runner = Join-Path $PSScriptRoot "run_dropin.ps1"
if (-not (Test-Path -LiteralPath $runner)) { throw "Missing runner: $runner" }

& $pwsh -NoProfile -ExecutionPolicy Bypass -File $runner @PSBoundParameters
exit $LASTEXITCODE
