# QBO Sync - Development Environment
# Usage: .\scripts\sync-dev.ps1 [full|cdc]
#
# Requires: .env.local file with QBO credentials OR environment variables set

param(
    [Parameter(Position=0)]
    [ValidateSet("full", "cdc")]
    [string]$Mode = "full"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "QBO Sync - Development Environment" -ForegroundColor Cyan
Write-Host "Mode: $Mode" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Load .env.local if it exists
$envFile = Join-Path $PSScriptRoot "../.env.local"
if (Test-Path $envFile) {
    Write-Host "Loading environment from .env.local..." -ForegroundColor Yellow
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

# Set development-specific defaults (override if not already set)
if (-not $env:EZCR_TENANT_ID) {
    $env:EZCR_TENANT_ID = "174bed32-89ff-4920-94d7-4527a3aba352"
    Write-Host "Using default dev tenant ID: $env:EZCR_TENANT_ID" -ForegroundColor Yellow
}

if (-not $env:APP_ENV) {
    $env:APP_ENV = "dev"
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
    Write-Host "Create a .env.local file or set these environment variables." -ForegroundColor Yellow
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
