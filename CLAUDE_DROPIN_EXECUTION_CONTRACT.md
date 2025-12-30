# Claude Code Drop-In Execution Contract (Zero-Touch)

## Goal
Produce a drop-in, zero-touch result (no manual file editing, prefer scripts).

## Required artifacts
- docs/_dropin/RUNBOOK.md
- docs/_dropin/OUTPUTS_REQUIRED.md
- docs/_dropin/VERIFY.md
- docs/_dropin/ROLLBACK.md
- tools/install_dropin.ps1
- tools/verify_dropin.ps1

## Rules
- Always log to C:\Temp\dropin_<timestamp>.log
- Never print or store secrets (env var NAMES only)
