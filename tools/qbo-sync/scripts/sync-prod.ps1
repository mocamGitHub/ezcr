# QBO Sync - Production Environment
# Usage: .\scripts\sync-prod.ps1 [full|cdc]
#
# WARNING: This runs against production data!
# Requires: .env.production file with QBO credentials OR environment variables set

param(
    [Parameter(Position=0)]
    [ValidateSet("full", "cdc")]
    [string]$Mode = "cdc",

    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Red
Write-Host "QBO Sync - PRODUCTION Environment" -ForegroundColor Red
Write-Host "Mode: $Mode" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red

# Safety confirmation for production
if (-not $Force) {
    Write-Host ""
    Write-Host "WARNING: You are about to run sync against PRODUCTION!" -ForegroundColor Yellow
    $confirm = Read-Host "Type 'yes' to continue"
    if ($confirm -ne "yes") {
        Write-Host "Aborted." -ForegroundColor Yellow
        exit 0
    }
}

# Load .env.production if it exists
$envFile = Join-Path $PSScriptRoot "../.env.production"
if (Test-Path $envFile) {
    Write-Host "Loading environment from .env.production..." -ForegroundColor Yellow
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

# Set production-specific defaults
if (-not $env:APP_ENV) {
    $env:APP_ENV = "prod"
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
    Write-Host "Create a .env.production file or set these environment variables." -ForegroundColor Yellow
    exit 1
}

# Change to tool directory
Push-Location (Join-Path $PSScriptRoot "..")

try {
    Write-Host ""
    Write-Host "Starting production sync..." -ForegroundColor Green

    if ($Mode -eq "full") {
        npm run sync:full
    } else {
        npm run sync:cdc
    }

    Write-Host ""
    Write-Host "Production sync completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Sync failed: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}
