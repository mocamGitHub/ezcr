---
description: Complete session with git commit, push, handoff update, and restart instructions
---

You are finishing a development session. Follow these steps carefully:

## Step 1: Review Current Changes

First, check what files have been modified:
```bash
git status
```

## Step 2: Stage and Commit Changes

Stage all relevant changes (excluding temporary files like `nul`, `*.mjs` test files):
```bash
# Remove any temporary files first
rm -f nul run-migration*.mjs

# Stage all changes
git add -A
```

Create a descriptive commit with the standard format:
```bash
git commit -m "$(cat <<'EOF'
[TYPE]: [Brief description of changes]

[Detailed bullet points of what was changed/fixed/added]
- Change 1
- Change 2
- Change 3

🎉 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

Where [TYPE] is one of:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `test:` - Test additions/changes

## Step 3: Push to Remote

```bash
git push origin main
```

## Step 4: Update SESSION_HANDOFF.md

Update the handoff document with:

1. **Session summary** - What was accomplished this session
2. **Files modified** - List all changed files with brief descriptions
3. **Current status** - What's working, what's pending
4. **Next actions** - What should be done next session
5. **Known issues** - Any problems or blockers
6. **Dev server status** - Current port and status
7. **Latest commit** - Hash and message

Use this template structure:

```markdown
# Session Handoff - [Brief Title]

**Date**: YYYY-MM-DD
**Time**: [Morning/Afternoon/Evening] Session
**Previous Commit**: `[hash]` - [message]
**Current Commit**: `[hash]` - [message]
**Current Status**: [Brief status]
**Branch**: main
**Dev Server**: Running at http://localhost:[PORT] ✅

---

## What Was Accomplished This Session

### [Category 1]
- Accomplishment 1
- Accomplishment 2

### [Category 2]
- Accomplishment 1
- Accomplishment 2

### Files Modified This Session ([N] files)
1. `path/to/file1.ts` - What was changed
2. `path/to/file2.tsx` - What was changed

---

## Current State

### What's Working ✅
- ✅ Feature/component 1
- ✅ Feature/component 2

### What's NOT Working / Pending
- ⏳ Thing 1
- ⏳ Thing 2

---

## Next Immediate Actions

### 1. [Action 1] ([time estimate])
[Description and commands]

### 2. [Action 2] ([time estimate])
[Description and commands]

---

## How to Resume After /clear

Run the `/resume` command or:

```bash
# Check current state
git log --oneline -5
git status
npm run dev  # If server not running

# Read handoff document
cat SESSION_HANDOFF.md
```

---

## Known Issues / Blockers

[List any issues that need attention]

---

**Session Status**: ✅ [STATUS]
**Next Session**: [What to focus on]
**Handoff Complete**: YYYY-MM-DD

🎉 [Celebration message]
```

## Step 5: Verify Everything is Saved

Confirm all work is committed and pushed:
```bash
git status  # Should show "nothing to commit, working tree clean"
git log --oneline -1  # Verify latest commit
```

## Step 6: Provide Restart Instructions to User

Tell the user:

---

## ✅ Session Complete!

**Commit**: `[hash]` - "[message]"
**Pushed**: ✅ Yes, pushed to GitHub
**Handoff**: ✅ Updated SESSION_HANDOFF.md

### To Resume This Session Later:

**Option 1 - Quick Resume** (Recommended):
```bash
/resume
```

**Option 2 - Manual Resume**:
```bash
# Read the handoff document
cat SESSION_HANDOFF.md

# Check dev server
npm run dev  # If not already running
```

**Option 3 - Fresh Start**:
```bash
/startup
```

### To Clear Context:
```bash
/clear
```

---

All your work is safely committed and pushed to GitHub! 🚀

---

## Important Notes

- This command does NOT execute `/clear` or `/startup` automatically
- You must tell the user to run those commands themselves if desired
- Always verify the git push succeeded before declaring session complete
- Make sure SESSION_HANDOFF.md is comprehensive enough for seamless continuation
