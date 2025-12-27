\
[CmdletBinding()]
param(
  [switch]$Strict
)

function Fail($msg) { Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }
function Warn($msg) { Write-Host "WARN: $msg" -ForegroundColor Yellow }
function Ok($msg)   { Write-Host $msg -ForegroundColor Green }
function Info($msg) { Write-Host $msg -ForegroundColor Cyan }

$missing = @()

# Cal.com
if (-not $env:CALCOM_API_KEY) { $missing += "CALCOM_API_KEY" }

# Dispatcher
if (-not $env:NEXCYTE_INTERNAL_DISPATCH_SECRET) { $missing += "NEXCYTE_INTERNAL_DISPATCH_SECRET" }

# DB connection (one of)
if (-not $env:DATABASE_URL -and -not $env:SUPABASE_DB_URL) {
  Warn "No DATABASE_URL / SUPABASE_DB_URL found. Will try `supabase db push` if CLI is available."
}

if ($missing.Count -gt 0) {
  if ($Strict) {
    Fail ("Missing required env vars: " + ($missing -join ", "))
  } else {
    Warn ("Missing required env vars (this may block full automation): " + ($missing -join ", "))
  }
} else {
  Ok "Required env vars present (Cal.com + internal dispatch secret)."
}

# Tools
$hasSupabase = $false
try { & supabase --version | Out-Null; $hasSupabase = $true } catch {}
if ($hasSupabase) { Ok "Supabase CLI detected." } else { Warn "Supabase CLI not detected." }

$hasPsql = $false
try { & psql --version | Out-Null; $hasPsql = $true } catch {}
if ($hasPsql) { Ok "psql detected." } else { Warn "psql not detected." }

# n8n (optional)
if ($env:N8N_API_URL -and $env:N8N_API_KEY) { Ok "n8n import env vars present." } else { Warn "n8n import env vars missing (optional)." }

Info "Config check complete."
