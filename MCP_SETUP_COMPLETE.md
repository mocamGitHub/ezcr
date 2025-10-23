# MCP Cross-Platform Setup - COMPLETE ✅

**Date:** 2025-10-21
**Session:** claude/list-available-mcps-011CULRL348GMBihRrg4EWHG

---

## 🎉 Setup Complete!

All MCP configurations have been created for **cross-platform use** between:
- **Windows Desktop** (C:\Users\morri\Dropbox\Websites\ezcr)
- **iPhone 16 Pro Max** (Claude Code mobile → Linux container)

---

## 📦 What Was Created

### 1. Project-Scoped Config (Shared via Git)
**File:** `.claude.json` (in project root)

Contains **5 portable MCPs:**
- ✅ ShadCN UI (official) - Component browsing
- ✅ Ref Tools - Documentation search
- ✅ Playwright - Browser automation
- ✅ Brave Search - Web search API
- ✅ Chrome DevTools - Performance profiling

**Status:** ✅ Installed and ready to use

---

### 2. User Config Templates

#### Windows Template
**File:** `.claude/windows-user-config.json`

**Copy to:** `C:\Users\morri\.claude.json`

Contains **3 platform-specific MCPs:**
- ✅ Firecrawl (with API key)
- ✅ GitHub (needs your PAT token)
- ✅ Serena (Windows path: `C:/Users/morri/Dropbox/Websites/ezcr`)

#### Linux/iPhone Template
**File:** `.claude/linux-user-config.json`

**Already installed to:** `~/.claude.json`

Contains **3 platform-specific MCPs:**
- ✅ Firecrawl (with API key)
- ✅ GitHub (needs your PAT token)
- ✅ Serena (Linux path: `/home/user/ezcr`)

**Status:** ✅ Installed in Linux environment

---

### 3. Comprehensive Documentation
**File:** `MCP_CROSS_PLATFORM_GUIDE.md`

**65+ page guide** covering:
- Complete MCP inventory (10 MCPs total)
- Installation instructions for both platforms
- Troubleshooting guide
- Security best practices
- Maintenance procedures
- Quick reference commands

---

## 🚀 Next Steps

### On Windows Desktop

1. **Copy user config:**
   ```bash
   cp .claude/windows-user-config.json C:\Users\morri\.claude.json
   ```

2. **Update GitHub token:**
   - Edit `C:\Users\morri\.claude.json`
   - Replace `"placeholder_generate_token"` with your actual GitHub PAT
   - Generate token: https://github.com/settings/tokens/new

3. **Restart Claude Code**

4. **Verify MCPs loaded:**
   ```bash
   /mcp
   # Should show 8 MCPs total (5 project + 3 user)
   ```

---

### On iPhone 16 Pro Max

1. **User config already installed** ✅

2. **Update GitHub token:**
   - Will need to edit `~/.claude.json` (may require desktop/SSH access)
   - Or wait until you can access the environment to update

3. **Restart Claude Code app**

4. **Verify MCPs:**
   ```bash
   /mcp
   # Should show 8 MCPs total
   ```

---

## 📊 MCP Summary

| MCP | Scope | Platform | Status |
|-----|-------|----------|--------|
| **ShadCN UI** | Project | All | ✅ Installed |
| **Ref Tools** | Project | All | ✅ Installed |
| **Playwright** | Project | All | ✅ Installed |
| **Brave Search** | Project | All | ✅ Installed |
| **Chrome DevTools** | Project | All | ✅ Installed |
| **Firecrawl** | User | All | ✅ Ready |
| **GitHub** | User | All | ⚠️ Needs token |
| **Serena** | User | All | ✅ Ready |
| ~~Supabase~~ | — | — | ❌ Not compatible |
| ~~ShadCN (old)~~ | — | — | ❌ Replaced |

**Total Active MCPs:** 8
**Ready to Use:** 7
**Needs Configuration:** 1 (GitHub token)

---

## ⚠️ Important Notes

### GitHub Personal Access Token

The GitHub MCP **requires a valid token** to work. Current value is a placeholder.

**Generate a token:**
1. Go to: https://github.com/settings/tokens/new
2. Required scopes:
   - `repo` (full control)
   - `read:org`
   - `user:email`
3. Copy token
4. Update both configs:
   - Windows: `C:\Users\morri\.claude.json`
   - Linux: `~/.claude.json`
5. Restart Claude Code

### Supabase MCP - NOT Recommended

**We decided NOT to install Supabase MCP because:**
- Designed for Supabase Cloud (you use self-hosted)
- Previous connection failures
- Direct database access works better for your setup

### ShadCN UI MCP - Using Official Version

**We're using the NEW official ShadCN MCP:**
- URL: `https://www.shadcn.io/api/mcp`
- Replaces the old community version that failed
- HTTP-based (more reliable than stdio)

---

## 🔍 Verification Checklist

After restarting Claude Code, verify:

- [ ] `/mcp` shows 8 MCPs
- [ ] ShadCN MCP shows "Connected"
- [ ] Ref Tools shows "Connected"
- [ ] Playwright shows "Connected"
- [ ] Brave Search shows "Connected"
- [ ] Chrome DevTools shows "Connected"
- [ ] Firecrawl shows "Connected"
- [ ] GitHub shows "Connected" (after adding token)
- [ ] Serena shows "Connected"

---

## 📚 Documentation Files

All documentation is in the project root:

| File | Purpose |
|------|---------|
| `MCP_CROSS_PLATFORM_GUIDE.md` | **Main reference** - Complete guide |
| `MCP_SETUP_COMPLETE.md` | This file - Quick summary |
| `MCP_CONFIGURATION.md` | Original Windows setup (2025-10-11) |
| `MCP_SETUP_STATUS.md` | Installation progress (2025-10-11) |
| `.claude/windows-user-config.json` | Template for Windows |
| `.claude/linux-user-config.json` | Template for Linux |

---

## 🎯 Why This Architecture?

### Two-Tier Config System

**Project-Scoped** (`.claude.json` in repo):
- ✅ Shared via Git
- ✅ Works on all platforms
- ✅ No secrets
- ✅ No platform-specific paths

**User-Scoped** (`~/.claude.json` in home dir):
- ✅ Platform-specific paths (Serena)
- ✅ API keys and tokens
- ✅ NOT committed to Git
- ✅ Set up once per environment

This ensures:
- **Security:** Secrets not in Git
- **Portability:** Project config works everywhere
- **Flexibility:** User config adapts to platform

---

## 🛠️ Troubleshooting

If MCPs don't show up:

1. **Verify config files exist:**
   ```bash
   ls -la .claude.json          # Project config
   ls -la ~/.claude.json         # User config
   ```

2. **Check JSON syntax:**
   ```bash
   python -c "import json; json.load(open('.claude.json'))"
   ```

3. **Restart Claude Code completely**

4. **Check MCP status:**
   ```bash
   /mcp
   ```

5. **See full troubleshooting guide:**
   - `MCP_CROSS_PLATFORM_GUIDE.md` → Troubleshooting section

---

## ✨ Benefits

With these 8 MCPs, Claude Code gains:

1. **ShadCN UI:** Direct access to component documentation and patterns
2. **Ref Tools:** Accurate documentation search (reduces hallucinations)
3. **Playwright:** Browser automation for E2E testing
4. **Brave Search:** Web search without leaving Claude
5. **Chrome DevTools:** Performance profiling and debugging
6. **Firecrawl:** Advanced web scraping
7. **GitHub:** Repository operations (issues, PRs, code)
8. **Serena:** Semantic code search (reduces token usage)

---

## 🎊 You're All Set!

The MCP infrastructure is now configured for seamless cross-platform development between Windows and iPhone.

**Next:** Install the Windows user config and restart Claude Code to activate all MCPs.

---

**Questions?** See `MCP_CROSS_PLATFORM_GUIDE.md` for comprehensive documentation.

**Session ID:** claude/list-available-mcps-011CULRL348GMBihRrg4EWHG
**Generated:** 2025-10-21
**Environment:** Linux (iPhone 16 Pro Max via Claude Code)
