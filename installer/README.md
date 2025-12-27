\
# One-command install (Windows 11)

## Fastest path (run from your repo root)
```powershell
powershell -ExecutionPolicy Bypass -File .\installer\Install_NexCyte_Scheduler.ps1 -BundleZip "C:\Path\To\NexCyte_Scheduler_MasterBundle_2025-12-24.zip"
```

If the bundle zip is placed next to the installer (or you adjust the auto-detect), you can omit `-BundleZip`.

## What it copies
- supabase/migrations, supabase/functions, supabase/seed
- src, docs, scripts, claude
- installer

## What still needs wiring
You still need Claude Code to:
- place Next.js route handlers into your app/api structure
- connect tenant resolution + auth + role checks
- wire the dispatcher schedule (n8n/cron) and provider configs

Start: `claude/CLAUDE_EXECUTION_PROMPT_MASTER.md`
