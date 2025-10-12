# MCP Configuration Documentation

**Date:** 2025-10-11
**Status:** Complete ✓

## Overview

Successfully configured 6 Model Context Protocol (MCP) servers for the EZCR project. All servers are connected and operational.

## Configured MCP Servers

### 1. Firecrawl
- **Purpose:** Web scraping and content extraction
- **Command:** `npx firecrawl-mcp`
- **Status:** ✓ Connected
- **Environment:**
  - `FIRECRAWL_API_URL`: https://firecrawl.nexcyte.com
  - `FIRECRAWL_API_KEY`: fc_d7e0f9d55a47fd4da5416c88adf0c3e12d14e3e59491a1972535b105da80faa7

### 2. GitHub
- **Purpose:** GitHub repository operations (issues, PRs, code, etc.)
- **Command:** `npx @modelcontextprotocol/server-github`
- **Status:** ✓ Connected
- **Environment:**
  - `GITHUB_PERSONAL_ACCESS_TOKEN`: placeholder_generate_token

### 3. Playwright
- **Purpose:** Modern browser automation for testing
- **Command:** `npx @executeautomation/playwright-mcp-server`
- **Status:** ✓ Connected
- **Note:** Replaced Puppeteer (chrome MCP) as Playwright is more modern

### 4. Brave Search
- **Purpose:** Web search API (2,000 free queries/month)
- **Command:** `npx -y @modelcontextprotocol/server-brave-search`
- **Status:** ✓ Connected
- **Environment:**
  - `BRAVE_API_KEY`: BSAFrISIwYmdVauteJUQM2ehuDz50Cb
- **Account:** https://api-dashboard.search.brave.com/

### 5. Serena
- **Purpose:** Semantic code understanding and search (reduces token usage)
- **Command:** `python -m uv tool run --from git+https://github.com/oraios/serena serena start-mcp-server --enable-web-dashboard false --project C:/Users/morri/Dropbox/Websites/ezcr`
- **Status:** ✓ Connected
- **Requirements:**
  - Python 3.8+ (installed: 3.13.7)
  - uv package manager (installed: 0.9.2)
- **Installation:** `pip install uv`
- **GitHub:** https://github.com/oraios/serena

### 6. Ref Tools
- **Purpose:** Documentation search to reduce hallucinations
- **Type:** HTTP endpoint (recommended method)
- **URL:** `https://api.ref.tools/mcp?apiKey=ref-d04a507c782207bfd34a`
- **Status:** ✓ Connected
- **Features:**
  - Searches 1000s of public repos and documentation sites
  - URL-to-markdown conversion
  - Web search fallback
- **GitHub:** https://github.com/ref-tools/ref-tools-mcp

## Configuration Location

MCP servers are configured in:
- **User config:** `C:\Users\morri\.claude.json` (firecrawl, github)
- **Project config:** `.claude.json` in project root (playwright, brave, serena, ref)

## Troubleshooting Notes

### Serena Configuration
- **Issue:** Initial connection failures
- **Solution:**
  - Use `python -m uv` instead of `uvx` (Windows compatibility)
  - Disable web dashboard with `--enable-web-dashboard false`
  - Specify project path explicitly

### Ref Tools Configuration
- **Issue:** stdio mode connection failures
- **Solution:** Use HTTP endpoint instead (recommended method)
- **Format:** `{"type":"http","url":"https://api.ref.tools/mcp?apiKey=YOUR_KEY"}`

### Removed MCPs
- **Supabase:** Removed due to persistent connection failures (was in user config)
- **Puppeteer (chrome):** Removed as redundant - Playwright is more modern and capable

## Commands Reference

```bash
# List all MCP servers
claude mcp list

# Get details about specific server
claude mcp get <name>

# Add stdio MCP server
claude mcp add <name> <command> [args...]

# Add HTTP MCP server or complex config
claude mcp add-json "<name>" '{"type":"http","url":"..."}'

# Remove MCP server
claude mcp remove "<name>"
claude mcp remove "<name>" -s user  # for user-scoped servers
```

## Token Optimization

The following MCPs specifically help reduce token usage:
- **Serena:** Semantic code understanding without loading full files
- **Ref Tools:** Efficient documentation search without embedding full docs

## Next Steps

1. Consider rotating API keys for security
2. Monitor Brave Search API usage (2,000 query limit)
3. Update GitHub token from placeholder to actual PAT if needed
4. Explore Serena's advanced features for code navigation

## References

- [Claude Code MCP Documentation](https://docs.claude.com/en/docs/claude-code)
- [Model Context Protocol Spec](https://modelcontextprotocol.io/)
- [Ref Tools GitHub](https://github.com/ref-tools/ref-tools-mcp)
- [Serena GitHub](https://github.com/oraios/serena)
