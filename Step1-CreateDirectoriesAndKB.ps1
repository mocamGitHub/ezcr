# EZCR Step 1: Create Directories and Knowledge Base Files
# Phase 3: SOLUTIONS
# Encoding: UTF-8

$ErrorActionPreference = "Stop"

function Log($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Success($msg) { Write-Host "[SUCCESS] $msg" -ForegroundColor Green }
function Error($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

Log "Step 1: Creating Directories and Knowledge Base Placeholders"
Write-Host "=============================================="
Write-Host ""

$PROJECT_ROOT = "C:\Users\morri\Dropbox\Websites\ezcr"
Set-Location $PROJECT_ROOT

# Create missing directories
Log "Creating missing directories..."
$dirs = @(
    "docs\decisions",
    "email-templates\orders",
    "email-templates\cart",
    "email-templates\support"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Success "Created: $dir"
    } else {
        Write-Host "  Already exists: $dir" -ForegroundColor Yellow
    }
}

Write-Host ""
Log "Knowledge Base Documents Status:"
Write-Host ""
Write-Host "The three main knowledge base documents should be saved from the artifacts"
Write-Host "you uploaded. Please save them as:"
Write-Host ""
Write-Host "  1. EZCR Complete Knowledge Base - Master Document.md"
Write-Host "  2. EZCR - Complete Step-by-Step Project Instructions.md"
Write-Host "  3. EZCR - Complete Agent Specification Files.md"
Write-Host ""
Write-Host "These files are already provided in your uploaded documents."
Write-Host "Copy them to: $PROJECT_ROOT"
Write-Host ""

Success "Step 1 Complete! Directories created."
Write-Host ""
Write-Host "Next: Run Step2-CreateAgentFiles.ps1"
