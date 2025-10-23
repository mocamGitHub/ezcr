# MCP Quick Start Guide

**🚀 READY TO GO!** All MCP configs created for Windows + iPhone development.

---

## ✅ What's Installed (Linux/iPhone)

### Project MCPs (5) - Already Active
- ✅ ShadCN UI - Component documentation
- ✅ Ref Tools - Doc search
- ✅ Playwright - Browser automation
- ✅ Brave Search - Web search
- ✅ Chrome DevTools - Performance

### User MCPs (3) - Already Configured
- ✅ Firecrawl - Web scraping
- ⚠️ GitHub - **Needs your token**
- ✅ Serena - Code understanding

---

## ⚡ Quick Actions

### On Windows (Do This Next)

```bash
# 1. Copy user config
cp .claude/windows-user-config.json C:\Users\morri\.claude.json

# 2. Edit the file and replace GitHub token
# Change: "placeholder_generate_token"
# To: Your actual GitHub PAT from https://github.com/settings/tokens/new

# 3. Restart Claude Code

# 4. Verify
/mcp
# Should show 8 MCPs
```

### On iPhone (Already Done)

```bash
# User config is already installed at ~/.claude.json
# Just restart Claude Code app to activate

# Verify:
/mcp
# Should show 8 MCPs
```

---

## 📋 File Locations

```
Project (commit to Git):
✅ .claude.json                          # 5 portable MCPs

Templates (commit to Git):
✅ .claude/windows-user-config.json      # Windows copy-paste template
✅ .claude/linux-user-config.json        # Linux copy-paste template

User Configs (do NOT commit):
📁 C:\Users\morri\.claude.json           # Windows (copy template here)
✅ ~/.claude.json                         # Linux/iPhone (already installed)

Documentation:
📖 MCP_CROSS_PLATFORM_GUIDE.md          # Full 65-page guide
📖 MCP_SETUP_COMPLETE.md                # Summary
📖 .claude/MCP_QUICK_START.md           # This file
```

---

## 🎯 MCP Count

| Category | Count |
|----------|-------|
| Project-scoped | 5 |
| User-scoped | 3 |
| **Total Active** | **8** |
| Removed/Skipped | 2 |

---

## ⚠️ Action Required

### Update GitHub Token (Both Platforms)

**Why:** Default is `"placeholder_generate_token"` - won't work!

**Steps:**
1. Generate token: https://github.com/settings/tokens/new
2. Scopes needed: `repo`, `read:org`, `user:email`
3. Copy token
4. Edit config:
   - Windows: `C:\Users\morri\.claude.json`
   - Linux: `~/.claude.json`
5. Replace placeholder with actual token
6. Restart Claude Code

---

## 🔍 Verify Everything Works

After restart, run:

```bash
/mcp
```

**Expected output:**
```
Connected MCPs (8):
├─ shadcn (Connected)
├─ ref (Connected)
├─ playwright (Connected)
├─ brave-search (Connected)
├─ chrome-devtools (Connected)
├─ firecrawl (Connected)
├─ github (Connected)  ← Should show after token update
└─ serena (Connected)
```

---

## ❌ NOT Installed (By Design)

1. **Supabase MCP** - Incompatible with self-hosted Supabase
2. **ShadCN UI (old)** - Replaced with official version

---

## 📚 Need Help?

- **Quick questions:** See `MCP_SETUP_COMPLETE.md`
- **Full reference:** See `MCP_CROSS_PLATFORM_GUIDE.md`
- **Troubleshooting:** See guide section "Troubleshooting"

---

**Session:** claude/list-available-mcps-011CULRL348GMBihRrg4EWHG
**Date:** 2025-10-21
**Status:** ✅ COMPLETE - Ready to use on both platforms
