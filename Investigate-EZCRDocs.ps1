# EZCR Documentation Structure Investigation
# Phase 1: INVESTIGATION ONLY - NO CHANGES
# Purpose: Verify current directory structure and identify what needs to be created
# Environment: Windows 11

$ErrorActionPreference = "Stop"

# Color output functions
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Log($message) {
    Write-ColorOutput Cyan "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $message"
}

function Success($message) {
    Write-ColorOutput Green "[SUCCESS] $message"
}

function Warn($message) {
    Write-ColorOutput Yellow "[WARNING] $message"
}

function Error($message) {
    Write-ColorOutput Red "[ERROR] $message"
}

# Start investigation
Log "Starting EZCR Documentation Structure Investigation"
Write-Output "=============================================="
Write-Output ""

# Project root
$PROJECT_ROOT = "C:\Users\morri\Dropbox\Websites\ezcr"

if (-not (Test-Path $PROJECT_ROOT)) {
    Error "Project root does not exist: $PROJECT_ROOT"
    exit 1
}

Log "Project root: $PROJECT_ROOT"
Set-Location $PROJECT_ROOT
Write-Output ""

# Required directory structure
$REQUIRED_DIRS = @(
    ".claude",
    ".claude\agents",
    ".claude\context",
    ".notebooklm",
    "docs",
    "docs\architecture",
    "docs\api",
    "docs\guides",
    "docs\decisions",
    "email-templates",
    "email-templates\orders",
    "email-templates\cart",
    "email-templates\support",
    "n8n",
    "n8n\workflows",
    "scripts",
    "supabase",
    "supabase\migrations",
    "supabase\functions"
)

# Required files
$REQUIRED_FILES = @(
    ".claude\coordinator.md",
    ".claude\project.md",
    ".claude\tasks.md",
    ".claude\agents\01-database-agent.md",
    ".claude\agents\02-ui-component-agent.md",
    ".claude\agents\03-ecommerce-agent.md",
    ".claude\agents\04-ai-rag-agent.md",
    ".claude\agents\05-automation-agent.md",
    ".claude\agents\06-testing-agent.md",
    ".claude\agents\07-devops-agent.md",
    ".claude\agents\08-documentation-agent.md",
    ".claude\agents\09-security-agent.md",
    ".claude\agents\10-notebooklm-agent.md",
    ".claude\agents\11-customer-success-agent.md",
    ".claude\agents\12-configurator-agent.md",
    ".claude\context\database-schema.md",
    ".claude\context\api-routes.md",
    ".claude\context\business-rules.md",
    ".claude\context\component-library.md"
)

# Investigation results
$MISSING_DIRS = @()
$EXISTING_DIRS = @()
$MISSING_FILES = @()
$EXISTING_FILES = @()

Log "Checking directory structure..."
Write-Output ""

# Check directories
foreach ($dir in $REQUIRED_DIRS) {
    $fullPath = Join-Path $PROJECT_ROOT $dir
    if (Test-Path -PathType Container $fullPath) {
        Success "✓ Directory exists: $dir"
        $EXISTING_DIRS += $dir
    } else {
        Warn "✗ Directory missing: $dir"
        $MISSING_DIRS += $dir
    }
}

Write-Output ""
Log "Checking required files..."
Write-Output ""

# Check files
foreach ($file in $REQUIRED_FILES) {
    $fullPath = Join-Path $PROJECT_ROOT $file
    if (Test-Path -PathType Leaf $fullPath) {
        Success "✓ File exists: $file"
        $EXISTING_FILES += $file
    } else {
        Warn "✗ File missing: $file"
        $MISSING_FILES += $file
    }
}

Write-Output ""
Write-Output "=============================================="
Log "Investigation Summary"
Write-Output "=============================================="
Write-Output ""

# Summary
Write-ColorOutput Cyan "Directories:"
Write-Output "  Total Required: $($REQUIRED_DIRS.Count)"
Write-ColorOutput Green "  Existing: $($EXISTING_DIRS.Count)"
Write-ColorOutput Yellow "  Missing: $($MISSING_DIRS.Count)"
Write-Output ""

Write-ColorOutput Cyan "Files:"
Write-Output "  Total Required: $($REQUIRED_FILES.Count)"
Write-ColorOutput Green "  Existing: $($EXISTING_FILES.Count)"
Write-ColorOutput Yellow "  Missing: $($MISSING_FILES.Count)"
Write-Output ""

# List missing items
if ($MISSING_DIRS.Count -gt 0) {
    Write-ColorOutput Yellow "Missing Directories:"
    foreach ($dir in $MISSING_DIRS) {
        Write-Output "  - $dir"
    }
    Write-Output ""
}

if ($MISSING_FILES.Count -gt 0) {
    Write-ColorOutput Yellow "Missing Files:"
    foreach ($file in $MISSING_FILES) {
        Write-Output "  - $file"
    }
    Write-Output ""
}

# Check for existing knowledge base files
Log "Checking for existing knowledge base documents..."
Write-Output ""

$KB_FILES = @(
    "EZCR Complete Knowledge Base - Master Document.md",
    "EZCR - Complete Step-by-Step Project Instructions.md",
    "EZCR - Complete Agent Specification Files.md"
)

foreach ($kb_file in $KB_FILES) {
    $fullPath = Join-Path $PROJECT_ROOT $kb_file
    if (Test-Path -PathType Leaf $fullPath) {
        Success "✓ Knowledge base exists: $kb_file"
    } else {
        Warn "✗ Knowledge base missing: $kb_file"
    }
}

Write-Output ""
Write-Output "=============================================="
Log "Next Steps"
Write-Output "=============================================="
Write-Output ""

if ($MISSING_DIRS.Count -gt 0 -or $MISSING_FILES.Count -gt 0) {
    Write-Output "Phase 2 will analyze the structure and determine creation strategy."
    Write-Output "Phase 3 will create all missing directories and files."
} else {
    Success "All required directories and files already exist!"
    Write-Output "No action needed."
}

Write-Output ""
Log "Investigation complete. Review findings and confirm to proceed to Phase 2."
Write-Output "=============================================="

# Generate JSON report
$report = @{
    timestamp = Get-Date -Format "o"
    project_root = $PROJECT_ROOT
    directories = @{
        total = $REQUIRED_DIRS.Count
        existing = $EXISTING_DIRS.Count
        missing = $MISSING_DIRS.Count
        missing_list = $MISSING_DIRS
    }
    files = @{
        total = $REQUIRED_FILES.Count
        existing = $EXISTING_FILES.Count
        missing = $MISSING_FILES.Count
        missing_list = $MISSING_FILES
    }
} | ConvertTo-Json -Depth 10

$reportPath = Join-Path $PROJECT_ROOT "ezcr-docs-investigation-report.json"
$report | Out-File -FilePath $reportPath -Encoding UTF8

Success "Investigation report saved to: ezcr-docs-investigation-report.json"
Write-Output ""
Write-Output "To view the JSON report, run:"
Write-Output "  Get-Content ezcr-docs-investigation-report.json | ConvertFrom-Json"
