\
<#
ZeroTouch_Install.ps1

One-command orchestration for:
- Installing the NexCyte Scheduler Master Bundle files into the repo
- Applying Supabase migrations
- Seeding safe defaults (profiles + notification templates)
- Optional: importing n8n dispatcher workflow
- Running DB smoke tests

Run from repo root.

Example:
  powershell -ExecutionPolicy Bypass -File .\installer\ZeroTouch_Install.ps1 -MasterBundleZip "C:\...\NexCyte_Scheduler_MasterBundle_2025-12-24_WITH_INSTALLER.zip" -N8nImport:$true
#>

[CmdletBinding()]
param(
  [string]$MasterBundleZip = "",
  [switch]$N8nImport,
  [switch]$DryRun,
  [switch]$Force
)

function Fail($msg) { Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }
function Warn($msg) { Write-Host "WARN: $msg" -ForegroundColor Yellow }
function Ok($msg)   { Write-Host $msg -ForegroundColor Green }
function Info($msg) { Write-Host $msg -ForegroundColor Cyan }

$repoRoot = (Get-Location).Path

# 1) Config check (non-strict, but will warn)
Info "Step 1/5: Config check"
& powershell -ExecutionPolicy Bypass -File .\installer\ZeroTouch_Config_Check.ps1

# 2) Install master bundle files into repo
Info "Step 2/5: Installing master bundle files into repo"
if ([string]::IsNullOrEmpty($MasterBundleZip)) {
  Fail "MasterBundleZip is required for zero-touch. Provide -MasterBundleZip <path-to-master-zip>."
}
if (-not (Test-Path $MasterBundleZip -PathType Leaf)) {
  Fail "Master bundle zip not found: $MasterBundleZip"
}

# Call the master bundle installer script (copied into repo by the WITH_INSTALLER bundle)
# If it doesn't exist yet, we still can extract and copy from zip.
if (Test-Path .\installer\Install_NexCyte_Scheduler.ps1) {
  & powershell -ExecutionPolicy Bypass -File .\installer\Install_NexCyte_Scheduler.ps1 -BundleZip $MasterBundleZip @(
    $(if ($DryRun) { "-DryRun" } else { $null }),
    $(if ($Force) { "-Force" } else { $null })
  ) | Out-Host
} else {
  Warn "Install_NexCyte_Scheduler.ps1 not found in repo. Extracting master bundle directly into repo is not supported by this script."
  Fail "Run the WITH_INSTALLER master bundle at least once, or ensure installer exists."
}

# 3) Apply migrations
Info "Step 3/5: Applying Supabase migrations"

$databaseUrl = $env:DATABASE_URL
if (-not $databaseUrl) { $databaseUrl = $env:SUPABASE_DB_URL }

$hasSupabase = $false
try { & supabase --version | Out-Null; $hasSupabase = $true } catch {}

$hasPsql = $false
try { & psql --version | Out-Null; $hasPsql = $true } catch {}

if ($hasSupabase) {
  if ($DryRun) {
    Info "[DryRun] Would run: supabase db push"
  } else {
    & supabase db push
    if ($LASTEXITCODE -ne 0) { Fail "supabase db push failed" }
    Ok "Migrations applied via Supabase CLI."
  }
} elseif ($hasPsql -and $databaseUrl) {
  # fallback: apply SQL files manually in order (best-effort)
  $migs = Get-ChildItem -LiteralPath ".\supabase\migrations" -Filter "*.sql" | Sort-Object Name
  if ($migs.Count -eq 0) { Warn "No migrations found under supabase/migrations" } else {
    foreach ($m in $migs) {
      if ($DryRun) {
        Info "[DryRun] Would apply migration via psql: $($m.Name)"
      } else {
        & psql $databaseUrl -v ON_ERROR_STOP=1 -f $m.FullName
        if ($LASTEXITCODE -ne 0) { Fail "psql migration failed: $($m.Name)" }
      }
    }
    Ok "Migrations applied via psql."
  }
} else {
  Fail "No way to apply migrations. Install Supabase CLI OR set DATABASE_URL and install psql."
}

# 4) Seed safe defaults + run smoke tests
Info "Step 4/5: Seeding safe defaults + running DB smoke tests"

if (-not ($hasPsql -and $databaseUrl)) {
  Warn "DB seed/tests require psql + DATABASE_URL. Skipping DB seed/tests."
} else {
  if ($DryRun) {
    Info "[DryRun] Would run seed: sql/zerotouch_seed_safe.sql"
    Info "[DryRun] Would run tests: sql/zerotouch_smoke_tests.sql"
  } else {
    & psql $databaseUrl -v ON_ERROR_STOP=1 -f ".\sql\zerotouch_seed_safe.sql"
    if ($LASTEXITCODE -ne 0) { Fail "Seed failed" }
    $out = & psql $databaseUrl -v ON_ERROR_STOP=1 -f ".\sql\zerotouch_smoke_tests.sql"
    $out | Out-Host
    if ($out -match "\bFAIL\b") { Fail "Smoke tests reported FAIL" }
    Ok "DB seed + smoke tests passed."
  }
}

# 5) Optional: import n8n workflow
Info "Step 5/5: Optional n8n import"
if ($N8nImport) {
  & powershell -ExecutionPolicy Bypass -File .\installer\Import_n8n_Workflow.ps1 -WorkflowJsonPath ".\n8n\workflow_dispatcher_every_2m.json" | Out-Host
} else {
  Warn "n8n import skipped (pass -N8nImport)."
}

Ok "ZeroTouch install completed."
Warn "Next: run Claude Code with claude/CLAUDE_EXECUTION_PROMPT_MASTER.md to wire auth/tenant routing + finalize."
