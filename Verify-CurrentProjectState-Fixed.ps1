# EZCR Current State Verification
# Checks what's actually implemented vs what documentation says

$ErrorActionPreference = "Stop"

function Log($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Success($msg) { Write-Host "[SUCCESS] $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "[WARNING] $msg" -ForegroundColor Yellow }
function Error($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

Log "EZCR Project Status Verification"
Write-Host "=============================================="
Write-Host ""

$PROJECT_ROOT = "C:\Users\morri\Dropbox\Websites\ezcr"
Set-Location $PROJECT_ROOT

# Check 1: Next.js Project
Log "Checking Next.js project..."
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    Success "Next.js project exists"
    Write-Host "  Next.js version: $($packageJson.dependencies.next)"
    Write-Host "  React version: $($packageJson.dependencies.react)"
} else {
    Error "package.json not found - Next.js not initialized"
}
Write-Host ""

# Check 2: Dependencies installed
Log "Checking dependencies..."
if (Test-Path "node_modules") {
    Success "node_modules exists"
} else {
    Warn "node_modules not found - run 'pnpm install'"
}
Write-Host ""

# Check 3: Environment variables
Log "Checking environment configuration..."
if (Test-Path ".env.local") {
    Success ".env.local exists"
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "NEXT_PUBLIC_SUPABASE_URL") {
        Success "  Supabase URL configured"
    } else {
        Warn "  Supabase URL not configured"
    }
    if ($envContent -match "STRIPE") {
        Success "  Stripe keys configured"
    } else {
        Warn "  Stripe keys not configured"
    }
} else {
    Warn ".env.local not found"
}
Write-Host ""

# Check 4: ShadCN UI
Log "Checking ShadCN UI..."
if (Test-Path "components.json") {
    Success "ShadCN UI configured"
} else {
    Warn "components.json not found - ShadCN not initialized"
}

if (Test-Path "src\components\ui") {
    $uiComponents = (Get-ChildItem "src\components\ui" -Filter "*.tsx").Count
    Success "UI components exist - Count: $uiComponents"
} else {
    Warn "UI components directory not found"
}
Write-Host ""

# Check 5: Database migrations
Log "Checking database setup..."
if (Test-Path "supabase\migrations") {
    $migrations = Get-ChildItem "supabase\migrations" -Filter "*.sql" -ErrorAction SilentlyContinue
    if ($migrations -and $migrations.Count -gt 0) {
        Success "Database migrations exist - Count: $($migrations.Count)"
        foreach ($migration in $migrations) {
            Write-Host "  - $($migration.Name)"
        }
    } else {
        Warn "No migration files found"
    }
} else {
    Warn "supabase/migrations directory not found"
}
Write-Host ""

# Check 6: Core source files
Log "Checking application structure..."
$coreFiles = @{
    "src\app\layout.tsx" = "Root layout"
    "src\app\page.tsx" = "Homepage"
    "src\lib\supabase\client.ts" = "Supabase client"
    "src\lib\supabase\server.ts" = "Supabase server"
    "src\components\layout\Header.tsx" = "Header component"
    "src\components\layout\Footer.tsx" = "Footer component"
}

foreach ($file in $coreFiles.Keys) {
    if (Test-Path $file) {
        Success "$($coreFiles[$file]) EXISTS"
    } else {
        Warn "$($coreFiles[$file]) MISSING: $file"
    }
}
Write-Host ""

# Check 7: Git repository
Log "Checking Git repository..."
if (Test-Path ".git") {
    Success "Git repository initialized"
    $gitRemote = git remote get-url origin 2>$null
    if ($gitRemote) {
        Success "  Remote configured: $gitRemote"
    } else {
        Warn "  No remote repository configured"
    }
} else {
    Warn "Git not initialized"
}
Write-Host ""

# Check 8: Documentation files
Log "Checking documentation..."
$docFiles = @(
    ".claude\coordinator.md",
    ".claude\project.md",
    ".claude\tasks.md",
    "PHASE-1-HANDOFF.md"
)

$docExists = 0
foreach ($doc in $docFiles) {
    if (Test-Path $doc) {
        $docExists++
    }
}

if ($docExists -eq $docFiles.Count) {
    Success "All documentation files exist"
} else {
    Warn "Some documentation files missing - Found: $docExists of $($docFiles.Count)"
}
Write-Host ""

# Summary
Write-Host "=============================================="
Log "SUMMARY & RECOMMENDATIONS"
Write-Host "=============================================="
Write-Host ""

# Generate recommendations
$recommendations = @()

if (-not (Test-Path "package.json")) {
    $recommendations += "CRITICAL: Next.js project needs to be initialized"
}

if (-not (Test-Path "node_modules")) {
    $recommendations += "WARNING: Run 'pnpm install'"
}

if (-not (Test-Path ".env.local")) {
    $recommendations += "WARNING: Create .env.local with Supabase credentials"
}

if (-not (Test-Path "components.json")) {
    $recommendations += "WARNING: Initialize ShadCN UI: pnpm dlx shadcn@latest init"
}

if (-not (Test-Path "supabase\migrations")) {
    $recommendations += "WARNING: Create database migrations"
}

if (-not (Test-Path "src\lib\supabase\client.ts")) {
    $recommendations += "WARNING: Create Supabase client utilities"
}

if ($recommendations.Count -eq 0) {
    Success "SUCCESS: Project is fully set up and ready for development!"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Start dev server: pnpm dev"
    Write-Host "  2. Open http://localhost:3000"
    Write-Host "  3. Review .claude/coordinator.md for current tasks"
} else {
    Warn "ATTENTION: The following items need attention:"
    Write-Host ""
    foreach ($rec in $recommendations) {
        Write-Host "  - $rec"
    }
    Write-Host ""
    Write-Host "Refer to Week 0 setup instructions for detailed steps."
}

Write-Host ""
Write-Host "=============================================="
Write-Host ""
Write-Host "Report saved to: ezcr-status-report.txt"

# Save report to file
$reportPath = "ezcr-status-report.txt"
$report = @"
EZCR Project Status Report
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
================================================

PROJECT CHECKS:
$(if (Test-Path "package.json") { "[OK] Next.js project" } else { "[MISSING] Next.js project" })
$(if (Test-Path "node_modules") { "[OK] Dependencies installed" } else { "[MISSING] Dependencies" })
$(if (Test-Path ".env.local") { "[OK] Environment variables" } else { "[MISSING] Environment variables" })
$(if (Test-Path "components.json") { "[OK] ShadCN UI" } else { "[MISSING] ShadCN UI" })
$(if (Test-Path "supabase\migrations") { "[OK] Database migrations" } else { "[MISSING] Database migrations" })
$(if (Test-Path ".git") { "[OK] Git repository" } else { "[MISSING] Git repository" })

RECOMMENDATIONS:
$($recommendations -join "`n")

================================================
"@

$report | Out-File -FilePath $reportPath -Encoding UTF8
