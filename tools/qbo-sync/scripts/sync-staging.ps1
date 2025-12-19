# QBO Sync - Staging Environment
# Usage: .\scripts\sync-staging.ps1 [full|cdc]
#
# Requires: .env.staging file with QBO credentials OR environment variables set

param(
    [Parameter(Position=0)]
    [ValidateSet("full", "cdc")]
    [string]$Mode = "full"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "QBO Sync - Staging Environment" -ForegroundColor Magenta
Write-Host "Mode: $Mode" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

# Load .env.staging if it exists
$envFile = Join-Path $PSScriptRoot "../.env.staging"
if (Test-Path $envFile) {
    Write-Host "Loading environment from .env.staging..." -ForegroundColor Yellow
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

# Set staging-specific defaults
if (-not $env:APP_ENV) {
    $env:APP_ENV = "staging"
}

# Validate required environment variables
$required = @("QBO_CLIENT_ID", "QBO_CLIENT_SECRET", "QBO_REALM_ID", "QBO_REFRESH_TOKEN", "DATABASE_URL", "EZCR_TENANT_ID")
$missing = @()
foreach ($var in $required) {
    if (-not [Environment]::GetEnvironmentVariable($var)) {
        $missing += $var
    }
}

if ($missing.Count -gt 0) {
    Write-Host "ERROR: Missing required environment variables:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "Create a .env.staging file or set these environment variables." -ForegroundColor Yellow
    exit 1
}

# Change to tool directory
Push-Location (Join-Path $PSScriptRoot "..")

try {
    Write-Host ""
    Write-Host "Starting sync..." -ForegroundColor Green

    if ($Mode -eq "full") {
        npm run sync:full
    } else {
        npm run sync:cdc
    }

    Write-Host ""
    Write-Host "Sync completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Sync failed: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}
