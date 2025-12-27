\
[CmdletBinding()]
param(
  [string]$WorkflowJsonPath = ".\n8n\workflow_dispatcher_every_2m.json"
)

function Fail($msg) { Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }
function Warn($msg) { Write-Host "WARN: $msg" -ForegroundColor Yellow }
function Ok($msg)   { Write-Host $msg -ForegroundColor Green }
function Info($msg) { Write-Host $msg -ForegroundColor Cyan }

if (-not $env:N8N_API_URL -or -not $env:N8N_API_KEY) {
  Warn "N8N_API_URL or N8N_API_KEY missing. Skipping n8n import."
  exit 0
}
if (-not (Test-Path $WorkflowJsonPath)) { Fail "Workflow file not found: $WorkflowJsonPath" }

$headerName = $env:N8N_API_KEY_HEADER
if (-not $headerName) { $headerName = "X-N8N-API-KEY" }

$body = Get-Content -LiteralPath $WorkflowJsonPath -Raw

# n8n REST API paths can vary by version/config. We try a common pattern:
# POST /api/v1/workflows
# If your instance uses a different route, adjust once and then it remains automated.
$endpoint = ($env:N8N_API_URL.TrimEnd("/")) + "/api/v1/workflows"

Info "Importing workflow to $endpoint"
try {
  $res = Invoke-RestMethod -Method Post -Uri $endpoint -Headers @{ $headerName = $env:N8N_API_KEY; "Content-Type"="application/json" } -Body $body
  Ok "Imported workflow (response received)."
} catch {
  Warn ("n8n import failed: " + $_.Exception.Message)
  Warn "If your n8n API path differs, update endpoint in this script once."
}
