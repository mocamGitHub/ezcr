# Session Handoff - Dropbox Issues / Claude Code Crashes

**Date**: 2026-01-07
**Session Name**: dropbox-issues
**Status**: INTERRUPTED - Need laptop reboot due to repeated Claude Code crashes
**Branch**: main (both repos)

---

## CRITICAL: Immediate Actions After Reboot

### 1. Fix Plugin Hook Error

Claude Code v2.0.76 is throwing this error on session start:

```
Plugin hook error: Processing -File 'C:\Users\morri\.claude\plugins\cache\
claude-plugins-official\explanatory-output-style\b97f6eadd929\hooks-handlers\
session-start.sh' failed because the file does not have a '.ps1' extension.
```

**Fix**: The plugin is trying to run a `.sh` file on Windows. Either:
- Disable the `explanatory-output-style` plugin temporarily
- Or rename/convert the hook to `.ps1`

### 2. Run Claude Doctor

```bash
claude /doctor
```

Claude Code reported "Found 2 invalid settings files" - diagnose and fix.

### 3. Kill Orphaned Node Processes

Multiple Claude Code crashes may have left zombie node processes:

```bash
taskkill //F //IM node.exe
```

### 4. Clean Up Backup Files (Optional)

Delete these files in EZCR:
- `.claude/settings.json.bak.20260104_233314`
- `.claude/settings.local.json.bak.20260104_233314`
- `nul` (Windows artifact)

---

## What Was Happening Before Crashes

The session was attempting to:
1. Kill hanging node processes from previous crashed sessions
2. Restart the dev server (either EZCR or NexCyte dashboard)

Both attempts got stuck with `taskkill //F //IM node.exe` running indefinitely until crash.

**Possible causes:**
- Dropbox sync conflicts (files locked during sync)
- Process management commands hanging on Windows
- Plugin hook error creating instability

---

## Permission Settings Added This Session

Added to `.claude/settings.local.json`:

```json
"Bash(pnpm dev:*)",
"Bash(npm run dev:*)",
"Bash(tasklist:*)",
"Bash(taskkill:*)",
"Bash(start:*)"
```

These allow Claude Code to:
- Start dev servers (`pnpm dev`, `npm run dev`)
- List running processes (`tasklist`)
- Kill processes (`taskkill`)
- Open URLs in browser (`start`)

**Current mode**: `dontAsk` (auto-approve allowed commands)

---

## Repository States

### EZCR (C:/Users/morri/Dropbox/Websites/ezcr)

```
Branch: main (up to date with origin)
Modified (uncommitted):
  - .claude/settings.local.json (permission additions)
  - SESSION_HANDOFF.md (this file)

Recent commits:
5303ddd feat(rls): Add DELETE policy for contact_submissions
1f54ce2 docs: Add NexCyte skills documentation system
9226212 feat(admin): Add Tasks, Scheduler, and Shortcuts navigation items
```

**Untracked files:**
- `screenshots/ezcr-admin/` - Admin screenshots
- `tools/ezcr-migration-toolkit/` - Migration toolkit
- `tools/setup-claude-yolo-safe.ps1` - Setup script
- `.claude/*.bak.*` - Old settings backups
- `nul` - Windows artifact (delete this)

### NexCyte Platform (C:/Users/morri/Dropbox/Websites/nexcyte-platform)

```
Branch: main (up to date with origin)
Status: Clean

Recent commits:
f26f9fd docs: Add NexCyte skills documentation system
ab73319 fix(rls): Add DELETE policy for contact_submissions table
a1fc815 feat: Add Mailgun email utility
```

---

## Crash Pattern Analysis

### Symptoms

1. Claude Code hangs on `taskkill //F //IM node.exe` command
2. Shows "Running..." indefinitely with no output
3. Eventually crashes without completing
4. Multiple sessions crashed in same pattern

### Likely Causes

1. **Dropbox Sync Conflicts**: Files being written while Dropbox syncs
2. **Process Lock**: Node processes may be locked by another process (Dropbox?)
3. **Plugin Hook Error**: The `.sh` extension error may cause instability
4. **Windows Process Management**: `taskkill` may hang if processes are in limbo state

### Recommendations for Next Session

1. **Pause Dropbox before intensive operations**
   - Right-click Dropbox tray icon > Pause syncing

2. **Kill node processes manually before starting Claude Code**
   ```bash
   taskkill //F //IM node.exe
   ```

3. **Disable problematic plugin temporarily**
   - Check `~/.claude/plugins/` for explanatory-output-style
   - Or run `claude /doctor` to diagnose

4. **Use shorter sessions**
   - Run `/clear` between major tasks
   - Consider `/compact` to reduce context

---

## Dev Server Quick Start

```bash
# After reboot, manual cleanup first:
taskkill //F //IM node.exe

# EZCR (port 3000)
cd C:/Users/morri/Dropbox/Websites/ezcr
npm run dev

# NexCyte Dashboard (port 3001)
cd C:/Users/morri/Dropbox/Websites/nexcyte-platform/apps/nexcyte-dashboard
pnpm dev

# View dashboards
start http://localhost:3000/admin/dashboard/executive  # EZCR
start http://localhost:3001/dashboard/executive        # NexCyte
```

---

## Recent Feature Context (For Reference)

### Skills Documentation System

Both projects have skills in `.skills/` directory:
- **LOCKED skills**: Must follow exactly (multi-tenant, supabase-patterns, security-standards)
- **EXTEND skills**: Can customize (api-design)
- **Local skills**: Project-specific patterns

### Configurable Dashboard

Both projects have dashboards with:
- KPI, Trend, Table, Bar, Donut, Timeseries widgets
- Date range picker with localStorage persistence
- Dashboard switcher dropdown
- Grid-based responsive layout

**Seeded dashboards:** Executive, Finance, Operations, Support

---

## Key Reference Files

| Purpose | EZCR | NexCyte |
|---------|------|---------|
| Project Guide | `CLAUDE.md` | `CLAUDE.md` |
| Skills Registry | `.skills/SKILL-REGISTRY.md` | `.skills/SKILL-REGISTRY.md` |
| Settings | `.claude/settings.local.json` | (uses EZCR's) |

---

## How to Resume

```bash
# 1. After reboot, kill any zombie processes
taskkill //F //IM node.exe

# 2. Check Claude Code health
claude /doctor

# 3. (Optional) Pause Dropbox sync before intensive work
# Right-click tray icon > Pause syncing

# 4. Start Claude Code
cd C:/Users/morri/Dropbox/Websites/ezcr
claude

# 5. In new session, type:
# "Check SESSION_HANDOFF.md and help me get the dev server running"
```

---

**Session Status**: Ready for reboot
**Root Cause**: Claude Code v2.0.76 crashes on process management commands
**Plugin Error**: explanatory-output-style hook has .sh extension (needs .ps1 on Windows)
**Handoff Created**: 2026-01-07

---

## Final State Summary

| Item | Status |
|------|--------|
| EZCR commits | All pushed (`5303ddd` on origin/main) |
| NexCyte commits | All pushed (`f26f9fd` on origin/main) |
| Dev server | Not running (will need restart after reboot) |
| Outstanding work | None - all complete |
| Uncommitted changes | `settings.local.json` (permission additions), this file |

**All code work is committed and pushed. Safe to reboot.**
