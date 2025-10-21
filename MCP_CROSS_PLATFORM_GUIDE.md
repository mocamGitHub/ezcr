# MCP Cross-Platform Management Guide

**Project:** EZCR
**Date:** 2025-10-21
**Environments:** Windows Desktop + iPhone 16 Pro Max (Claude Code)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [MCP Architecture](#mcp-architecture)
3. [Installed MCPs](#installed-mcps)
4. [Configuration Files](#configuration-files)
5. [Installation Instructions](#installation-instructions)
6. [Troubleshooting](#troubleshooting)
7. [Security Considerations](#security-considerations)
8. [Maintenance](#maintenance)

---

## Overview

This project uses **10 MCP servers** split across two configuration scopes:

- **5 Project-Scoped MCPs** - Shared via Git, work on all platforms
- **3 User-Scoped MCPs** - Platform-specific, stored in user home directory
- **2 Removed MCPs** - Not recommended for this setup

### Why Cross-Platform?

You work on this project from:
- **Windows Desktop** - Primary development (Git Bash/PowerShell)
- **iPhone 16 Pro Max** - Remote development via Claude Code mobile app

The MCP configuration is designed to work seamlessly on both platforms.

---

## MCP Architecture

### Two-Tier Configuration System

```
┌─────────────────────────────────────────────────┐
│  PROJECT-SCOPED (Shared via Git)                │
│  File: /home/user/ezcr/.claude.json             │
│                                                  │
│  ✓ ShadCN UI (official)                         │
│  ✓ Ref Tools (HTTP)                             │
│  ✓ Playwright                                   │
│  ✓ Brave Search                                 │
│  ✓ Chrome DevTools                              │
└─────────────────────────────────────────────────┘
                      ↓
                 Works on all
                 environments
                      ↓
┌─────────────────────────────────────────────────┐
│  USER-SCOPED (Platform-Specific)                │
│                                                  │
│  Windows: C:\Users\morri\.claude.json           │
│  Linux:   ~/.claude.json                        │
│                                                  │
│  ✓ Firecrawl (API keys)                         │
│  ✓ GitHub (personal token)                      │
│  ✓ Serena (platform-specific paths)             │
└─────────────────────────────────────────────────┘
```

### Why This Split?

| Criteria | Project-Scoped | User-Scoped |
|----------|---------------|-------------|
| **Contains secrets** | No | Yes (API keys) |
| **Platform-specific paths** | No | Yes (Serena) |
| **Shared via Git** | Yes | No |
| **Portable across environments** | Yes | No |

---

## Installed MCPs

### ✅ Project-Scoped MCPs (5)

#### 1. **ShadCN UI** (Official)
- **Purpose:** Browse ShadCN components, props, installation patterns
- **Type:** HTTP Remote MCP
- **Command:** `npx -y mcp-remote https://www.shadcn.io/api/mcp`
- **Why Essential:** Your project heavily uses ShadCN UI components
- **Platform Issues:** None ✅

#### 2. **Ref Tools**
- **Purpose:** Documentation search to reduce hallucinations
- **Type:** HTTP Endpoint
- **URL:** `https://api.ref.tools/mcp?apiKey=ref-d04a507c782207bfd34a`
- **Features:** Searches 1000s of public repos, URL-to-markdown conversion
- **Platform Issues:** None ✅

#### 3. **Playwright**
- **Purpose:** Browser automation and testing
- **Type:** NPX Package
- **Command:** `npx -y @executeautomation/playwright-mcp-server`
- **Use Cases:** E2E testing, form automation, cross-browser testing
- **Platform Issues:** None ✅

#### 4. **Brave Search**
- **Purpose:** Web search API
- **Type:** NPX Package
- **Command:** `npx -y @modelcontextprotocol/server-brave-search`
- **Quota:** 2,000 free queries/month
- **Account:** https://api-dashboard.search.brave.com/
- **Platform Issues:** None ✅
- **⚠️ Note:** API key is in config (consider moving to user scope for security)

#### 5. **Chrome DevTools**
- **Purpose:** Performance profiling, debugging, console inspection
- **Type:** NPX Package
- **Command:** `npx -y chrome-devtools-mcp`
- **Use Cases:** Network analysis, performance optimization
- **Platform Issues:** None ✅

---

### ✅ User-Scoped MCPs (3)

#### 6. **Firecrawl**
- **Purpose:** Web scraping and content extraction
- **Type:** NPX Package
- **Command:** `npx firecrawl-mcp`
- **API URL:** https://firecrawl.nexcyte.com
- **API Key:** `fc_d7e0f9d55a47fd4da5416c88adf0c3e12d14e3e59491a1972535b105da80faa7`
- **Platform Issues:** None ✅
- **Why User-Scoped:** Contains API credentials

#### 7. **GitHub**
- **Purpose:** GitHub repository operations (issues, PRs, code)
- **Type:** NPX Package
- **Command:** `npx @modelcontextprotocol/server-github`
- **Token:** `placeholder_generate_token` ⚠️ **UPDATE THIS!**
- **Platform Issues:** None ✅
- **Why User-Scoped:** Contains personal access token

#### 8. **Serena**
- **Purpose:** Semantic code understanding (reduces token usage)
- **Type:** Python/UV Package
- **Command:** `python -m uv tool run --from git+https://github.com/oraios/serena serena start-mcp-server`
- **Requirements:** Python 3.8+, uv package manager
- **Platform Issues:** ⚠️ **Platform-specific project paths**
  - Windows: `--project C:/Users/morri/Dropbox/Websites/ezcr`
  - Linux: `--project /home/user/ezcr`
- **Why User-Scoped:** Hardcoded paths differ per platform

---

### ❌ Removed/Skipped MCPs (2)

#### 9. **Supabase MCP** - REMOVED
- **Status:** Not installed
- **Reason 1:** Persistent connection failures
- **Reason 2:** Designed for Supabase Cloud, not self-hosted instances
- **Your Setup:** Self-hosted Supabase instance
- **Alternative:** Direct database access via connection strings
- **Recommendation:** ❌ **Do not install** - incompatible with self-hosted setup

#### 10. **ShadCN UI (Community/Old)** - REMOVED
- **Status:** Installation failed
- **Reason:** Unknown (docs don't specify)
- **Replacement:** Official ShadCN MCP (now installed as #1)
- **Recommendation:** ❌ **Do not install** - use official version instead

---

## Configuration Files

### File Locations

```
ezcr/
├── .claude.json                          # ✅ PROJECT-SCOPED (commit to Git)
├── .claude/
│   ├── windows-user-config.json          # 📋 TEMPLATE for Windows
│   └── linux-user-config.json            # 📋 TEMPLATE for Linux/iPhone
│
Windows:
└── C:\Users\morri\.claude.json           # ✅ USER-SCOPED (do NOT commit)

Linux/iPhone:
└── ~/.claude.json                        # ✅ USER-SCOPED (do NOT commit)
```

### Project-Scoped Config

**File:** `/home/user/ezcr/.claude.json`

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://www.shadcn.io/api/mcp"],
      "description": "Official ShadCN UI MCP - Browse components, props, and installation"
    },
    "ref": {
      "type": "http",
      "url": "https://api.ref.tools/mcp?apiKey=ref-d04a507c782207bfd34a",
      "description": "Documentation search to reduce hallucinations"
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"],
      "description": "Browser automation and testing"
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "BSAFrISIwYmdVauteJUQM2ehuDz50Cb"
      },
      "description": "Web search API (2,000 free queries/month)"
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp"],
      "description": "Performance profiling, debugging, console inspection"
    }
  }
}
```

**Should you commit this?** ✅ **YES** - Share across all environments

**⚠️ Security Note:** Brave API key is exposed. Consider moving to user config if sensitive.

---

### User-Scoped Config (Windows)

**File:** `C:\Users\morri\.claude.json`

```json
{
  "mcpServers": {
    "firecrawl": {
      "command": "npx",
      "args": ["firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_URL": "https://firecrawl.nexcyte.com",
        "FIRECRAWL_API_KEY": "fc_d7e0f9d55a47fd4da5416c88adf0c3e12d14e3e59491a1972535b105da80faa7"
      },
      "description": "Web scraping and content extraction"
    },
    "github": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_ACTUAL_TOKEN_HERE"
      },
      "description": "GitHub repository operations"
    },
    "serena": {
      "command": "python",
      "args": [
        "-m", "uv", "tool", "run",
        "--from", "git+https://github.com/oraios/serena",
        "serena", "start-mcp-server",
        "--enable-web-dashboard", "false",
        "--project", "C:/Users/morri/Dropbox/Websites/ezcr"
      ],
      "description": "Semantic code understanding (reduces token usage)"
    }
  }
}
```

**Should you commit this?** ❌ **NO** - Contains API keys and personal tokens

---

### User-Scoped Config (Linux/iPhone)

**File:** `~/.claude.json`

```json
{
  "mcpServers": {
    "firecrawl": {
      "command": "npx",
      "args": ["firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_URL": "https://firecrawl.nexcyte.com",
        "FIRECRAWL_API_KEY": "fc_d7e0f9d55a47fd4da5416c88adf0c3e12d14e3e59491a1972535b105da80faa7"
      },
      "description": "Web scraping and content extraction"
    },
    "github": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_ACTUAL_TOKEN_HERE"
      },
      "description": "GitHub repository operations"
    },
    "serena": {
      "command": "python",
      "args": [
        "-m", "uv", "tool", "run",
        "--from", "git+https://github.com/oraios/serena",
        "serena", "start-mcp-server",
        "--enable-web-dashboard", "false",
        "--project", "/home/user/ezcr"
      ],
      "description": "Semantic code understanding (reduces token usage)"
    }
  }
}
```

**Should you commit this?** ❌ **NO** - Contains API keys and personal tokens

**Key Difference from Windows:** `--project` path is `/home/user/ezcr` instead of `C:/Users/morri/Dropbox/Websites/ezcr`

---

## Installation Instructions

### Step 1: Windows Desktop Setup

#### Option A: Manual Installation

1. **Copy project config template:**
   ```bash
   # Project config is already in the repo at .claude.json
   # This will be picked up automatically by Claude Code
   ```

2. **Create user config:**
   ```bash
   # Copy the template
   cp .claude/windows-user-config.json C:\Users\morri\.claude.json

   # OR create manually using the JSON above
   ```

3. **Update GitHub token:**
   ```bash
   # Edit C:\Users\morri\.claude.json
   # Replace "placeholder_generate_token" with your actual GitHub PAT
   ```

4. **Restart Claude Code:**
   ```bash
   # Close and reopen Claude Code for MCPs to load
   ```

5. **Verify MCPs loaded:**
   ```bash
   # In Claude Code, type:
   /mcp

   # You should see all 8 MCPs listed
   ```

#### Option B: Using Claude Code Commands

```bash
# Add project-scoped MCPs (if not using .claude.json)
claude mcp add shadcn npx -y mcp-remote https://www.shadcn.io/api/mcp
claude mcp add ref --type http --url "https://api.ref.tools/mcp?apiKey=ref-d04a507c782207bfd34a"
claude mcp add playwright npx -y @executeautomation/playwright-mcp-server
claude mcp add brave-search npx -y @modelcontextprotocol/server-brave-search
claude mcp add chrome-devtools npx -y chrome-devtools-mcp

# Add user-scoped MCPs
claude mcp add firecrawl npx firecrawl-mcp -s user
claude mcp add github npx @modelcontextprotocol/server-github -s user
claude mcp add serena "python -m uv tool run --from git+https://github.com/oraios/serena serena start-mcp-server --enable-web-dashboard false --project C:/Users/morri/Dropbox/Websites/ezcr" -s user

# List all MCPs
claude mcp list
```

---

### Step 2: Linux/iPhone Setup

#### On iPhone 16 Pro Max (Claude Code Mobile)

1. **Project config is automatic:**
   - The `.claude.json` in the project root will be loaded automatically
   - No action needed for project-scoped MCPs

2. **User config is already installed:**
   - Linux user config was copied to `~/.claude.json`
   - This happened during this session

3. **Update GitHub token:**
   - Edit `~/.claude.json` and replace the placeholder token
   - You may need to do this from a desktop/SSH session

4. **Restart Claude Code:**
   - Close and reopen the Claude Code app on iPhone
   - Or start a new session

5. **Verify MCPs:**
   - Type `/mcp` in Claude Code
   - You should see all 8 MCPs listed

---

### Step 3: Verify Cross-Platform Setup

Run this checklist on **both** Windows and iPhone:

- [ ] `/mcp` shows 8 MCPs total
- [ ] ShadCN MCP shows "Connected"
- [ ] Ref Tools MCP shows "Connected"
- [ ] Playwright MCP shows "Connected"
- [ ] Brave Search MCP shows "Connected"
- [ ] Chrome DevTools MCP shows "Connected"
- [ ] Firecrawl MCP shows "Connected"
- [ ] GitHub MCP shows "Connected" (after updating token)
- [ ] Serena MCP shows "Connected"

---

## Troubleshooting

### Common Issues

#### 1. MCPs Not Showing Up

**Symptoms:** `/mcp` returns empty or incomplete list

**Solutions:**
```bash
# Check config file exists
ls -la .claude.json
cat .claude.json

# Check user config
cat ~/.claude.json  # Linux
type C:\Users\morri\.claude.json  # Windows

# Validate JSON syntax
python -c "import json; json.load(open('.claude.json'))"

# Restart Claude Code completely
```

#### 2. MCP Shows "Connection Failed"

**Symptoms:** MCP listed but shows error status

**For NPX-based MCPs (most of them):**
```bash
# Verify npx is available
which npx  # Linux
where npx  # Windows

# Test the command manually
npx -y @executeautomation/playwright-mcp-server --version
```

**For HTTP MCPs (Ref Tools, ShadCN):**
```bash
# Test URL accessibility
curl -I https://api.ref.tools/mcp?apiKey=ref-d04a507c782207bfd34a
curl -I https://www.shadcn.io/api/mcp
```

**For Serena:**
```bash
# Verify dependencies
python --version  # Should be 3.8+
uv --version      # Should be installed

# Test Serena installation
python -m uv tool run --from git+https://github.com/oraios/serena serena --version
```

#### 3. GitHub MCP Authentication Fails

**Symptoms:** GitHub MCP shows "Auth Error" or "Invalid Token"

**Solution:**
```bash
# Generate a new GitHub Personal Access Token
# Go to: https://github.com/settings/tokens/new

# Required scopes:
# - repo (full control)
# - read:org
# - user:email

# Update your config:
# Edit ~/.claude.json (Linux) or C:\Users\morri\.claude.json (Windows)
# Replace "placeholder_generate_token" with your new token

# Restart Claude Code
```

#### 4. Serena Path Issues

**Symptoms:** Serena shows "Project Not Found" or path errors

**Windows:**
```bash
# Verify path exists
dir "C:\Users\morri\Dropbox\Websites\ezcr"

# If different, update ~/.claude.json with correct path
```

**Linux/iPhone:**
```bash
# Verify path exists
ls -la /home/user/ezcr

# If different, update ~/.claude.json with correct path
```

#### 5. Platform-Specific Issues

**iPhone/Mobile:**
- **OAuth redirects:** May open Safari for authentication
- **Network timeouts:** Remote container may have higher latency
- **App backgrounding:** May disconnect MCPs when app is backgrounded

**Windows:**
- **Path separators:** Use forward slashes `/` even on Windows (e.g., `C:/Users/...`)
- **Git Bash vs PowerShell:** Both should work, but Git Bash recommended
- **Antivirus:** May block npx downloads (whitelist Node.js)

---

### MCP-Specific Troubleshooting

#### ShadCN UI MCP

**If connection fails:**
```bash
# Try the community version instead
# Edit .claude.json and replace:
"shadcn": {
  "command": "npx",
  "args": ["-y", "@jpisnice/shadcn-ui-mcp-server"]
}
```

#### Brave Search MCP

**If rate limited:**
- Check usage: https://api-dashboard.search.brave.com/
- 2,000 queries/month limit
- Consider rotating API keys if multiple developers

#### Firecrawl MCP

**If API errors:**
- Verify API URL is accessible
- Check API key is valid
- Test with curl: `curl -H "Authorization: Bearer YOUR_KEY" https://firecrawl.nexcyte.com`

---

## Security Considerations

### API Keys in Config Files

**Current Exposure:**

| Secret | Location | Risk Level | Recommendation |
|--------|----------|-----------|----------------|
| Ref Tools API Key | Project config | 🟡 Medium | Move to user config |
| Brave API Key | Project config | 🟡 Medium | Move to user config |
| Firecrawl API Key | User config | 🟢 Low | Current setup OK |
| GitHub PAT | User config | 🟢 Low | Current setup OK |

### Recommendations

1. **Move API keys to user config:**
   ```json
   // .claude.json (project) - Remove API keys
   "ref": {
     "type": "http",
     "url": "https://api.ref.tools/mcp?apiKey=${REF_API_KEY}"
   }

   // ~/.claude.json (user) - Add API keys
   "env": {
     "REF_API_KEY": "ref-d04a507c782207bfd34a"
   }
   ```

2. **Add to .gitignore:**
   ```bash
   # Already done, but verify:
   echo ".claude.json" >> .gitignore  # If needed

   # Verify user configs are NOT committed
   git status
   ```

3. **Rotate keys periodically:**
   - Brave API: https://api-dashboard.search.brave.com/
   - Ref Tools: Check their dashboard
   - Firecrawl: Contact admin
   - GitHub PAT: https://github.com/settings/tokens

4. **Use read-only tokens when possible:**
   - GitHub PAT should use minimal scopes
   - Brave Search is already read-only

---

## Maintenance

### Updating MCPs

**NPX-based MCPs auto-update:**
- The `-y` flag ensures latest version is always fetched
- No manual updates needed

**HTTP-based MCPs:**
- Managed by the service provider
- No updates needed on your end

**Serena:**
```bash
# Force update Serena
uv cache clean
python -m uv tool run --from git+https://github.com/oraios/serena serena --version
```

### Adding New MCPs

**To add a new project-scoped MCP:**
1. Edit `.claude.json`
2. Add the new MCP configuration
3. Commit to Git
4. Pull on other environments
5. Restart Claude Code

**To add a new user-scoped MCP:**
1. Edit `~/.claude.json` (Linux) or `C:\Users\morri\.claude.json` (Windows)
2. Add the new MCP configuration
3. Repeat on other environment manually
4. Restart Claude Code

### Removing MCPs

**Using config files:**
```bash
# Edit the appropriate .claude.json file
# Remove the MCP entry
# Restart Claude Code
```

**Using CLI:**
```bash
# Remove project-scoped MCP
claude mcp remove <name>

# Remove user-scoped MCP
claude mcp remove <name> -s user
```

### Monitoring Usage

**Brave Search:**
- Dashboard: https://api-dashboard.search.brave.com/
- Limit: 2,000 queries/month
- Alerts: Set up email notifications

**Firecrawl:**
- Check with your admin for usage stats

**GitHub:**
- Rate limits: 5,000 requests/hour (authenticated)
- Check headers: `X-RateLimit-Remaining`

---

## Quick Reference

### File Locations Summary

```
Project Config:  /home/user/ezcr/.claude.json          (commit to Git)
Windows User:    C:\Users\morri\.claude.json            (do NOT commit)
Linux User:      ~/.claude.json                         (do NOT commit)
Templates:       .claude/windows-user-config.json       (commit to Git)
                 .claude/linux-user-config.json         (commit to Git)
```

### Command Cheat Sheet

```bash
# List all MCPs
/mcp

# View MCP details
claude mcp get <name>

# Add MCP (project scope)
claude mcp add <name> <command> [args...]

# Add MCP (user scope)
claude mcp add <name> <command> [args...] -s user

# Remove MCP
claude mcp remove <name>
claude mcp remove <name> -s user

# Test MCP manually
npx -y <package-name>
```

### MCP Count by Scope

- **Project-Scoped:** 5 MCPs (ShadCN, Ref, Playwright, Brave, Chrome DevTools)
- **User-Scoped:** 3 MCPs (Firecrawl, GitHub, Serena)
- **Total Active:** 8 MCPs
- **Removed:** 2 MCPs (Supabase, ShadCN-old)

---

## Appendix: MCP Server Versions

As of 2025-10-21:

| MCP | Version | Last Checked |
|-----|---------|-------------|
| ShadCN UI (Official) | Latest | Via HTTP endpoint |
| Ref Tools | Latest | Via HTTP endpoint |
| Playwright | Latest | Via npx -y |
| Brave Search | Latest | Via npx -y |
| Chrome DevTools | Latest | Via npx -y |
| Firecrawl | Latest | Via npx |
| GitHub | Latest | Via npx |
| Serena | Latest | Via git clone |

**Auto-update:** All NPX packages use `-y` flag for automatic latest version.

---

## Support & Resources

### Official Documentation

- **Claude Code MCP Docs:** https://docs.claude.com/en/docs/claude-code/mcp
- **Model Context Protocol:** https://modelcontextprotocol.io/
- **ShadCN UI MCP:** https://ui.shadcn.com/docs/mcp
- **Ref Tools:** https://github.com/ref-tools/ref-tools-mcp
- **Serena:** https://github.com/oraios/serena

### Project-Specific Docs

- `MCP_CONFIGURATION.md` - Original Windows setup (2025-10-11)
- `MCP_SETUP_STATUS.md` - Installation progress (2025-10-11)
- `MCP_CROSS_PLATFORM_GUIDE.md` - This document

---

**Last Updated:** 2025-10-21
**Maintained By:** Claude Code Assistant
**Project:** EZCR Multi-Tenant E-Commerce Platform
