# Claude Code Prompt — Zero Touch Scheduler Install + Test

You have full access to this repo and the server environments. Goal: deliver a completed, tested scheduling module with no human back-and-forth.

## Rules
- Do NOT ask the user questions.
- If something is missing (env var, API key, URL), fail fast with a single actionable error summary.
- Prefer best-effort auto-detection and safe defaults.

## Steps

### 1) Install bundle files into repo
- Ensure the repo contains:
  - the MASTER bundle with installer
  - this ZeroTouch pack
- Run:
  - `powershell -ExecutionPolicy Bypass -File .\installer\ZeroTouch_Install.ps1 -N8nImport:$true`

### 2) Wire missing integration points
If the bundle’s files are present but not yet wired:
- Place Next.js route handlers into the repo’s real App Router structure.
- Wire session auth + tenant resolution + tenant admin checks.
- Ensure the dispatcher endpoint exists:
  - `POST /api/internal/comms/dispatch`

### 3) Enable “DRY RUN” mode for notifications (for testing)
Add support in dispatcher so if `NEXCYTE_COMMS_DRY_RUN=1` then:
- do NOT call Mailgun/Twilio
- mark outbox rows as sent with a note in payload

This makes tests deterministic even without provider keys.

### 4) Run smoke tests
- Run the SQL smoke tests (provided) against Supabase.
- Insert a synthetic `nx_scheduler_booking` row (service role) and verify the trigger enqueues outbox rows.
- Call dispatcher once and verify outbox rows transition appropriately.

### 5) Report
Output:
- What changed (files)
- Tests run (pass/fail)
- Any missing prerequisites (only if blocking)
