# Wave 1 Plugin Installation

**Date**: 2025-12-28
**Marketplace**: wshobson/agents (67 plugins, 99 agents, 107 skills)

## Installation Commands

Run these commands in Claude Code CLI to complete plugin setup:

```bash
# Step 1: Add the marketplace
/plugin marketplace add wshobson/agents

# Step 2: Install the 8 Wave 1 plugins
/plugin install llm-application-dev
/plugin install security-scanning
/plugin install backend-api-security
/plugin install frontend-mobile-security
/plugin install database-design
/plugin install documentation-generation
/plugin install performance-testing-review
/plugin install multi-platform-apps
```

## Plugin Details

| # | Plugin | Category | Description |
|---|--------|----------|-------------|
| 1 | `llm-application-dev` | AI & ML | LLM apps, prompt engineering, RAG, LangChain |
| 2 | `security-scanning` | Security | SAST analysis, vulnerability scanning |
| 3 | `backend-api-security` | Security | API security, authentication |
| 4 | `frontend-mobile-security` | Security | XSS/CSRF prevention, mobile security |
| 5 | `database-design` | Database | Database architecture, schema design |
| 6 | `documentation-generation` | Documentation | OpenAPI specs, Mermaid diagrams, tutorials |
| 7 | `performance-testing-review` | Quality | Performance analysis, test coverage review |
| 8 | `multi-platform-apps` | Development | Cross-platform app coordination (web/iOS/Android) |

## Agents Included

These plugins provide the following specialized agents:

### AI & ML
- LLM Application Developer (prompt engineering, RAG patterns)

### Security
- Security Auditor (SAST, dependency scanning)
- Backend Security Specialist (API auth, rate limiting)
- Frontend/Mobile Security Specialist (XSS, CSRF, mobile)

### Database
- Database Architect (schema design, migrations, optimization)

### Documentation
- Technical Writer (API docs, tutorials, diagrams)

### Quality
- Performance Engineer (profiling, optimization)

### Development
- Multi-Platform Coordinator (web/iOS/Android strategy)

## Skills Available

Once installed, these plugins provide specialized skills:
- LangChain integration patterns
- Prompt engineering best practices
- RAG (Retrieval Augmented Generation) patterns
- Security scanning workflows
- API authentication patterns
- WCAG compliance checking
- Database normalization
- OpenAPI/Swagger generation
- Mermaid diagram creation
- Performance profiling
- PWA/React Native/Capacitor comparison

## Installation Status

**Manual action required**: The `/plugin` commands above must be run interactively in Claude Code CLI.

## Alternative: Use Built-in Capabilities

For this Wave 1 pilot battery, we use Claude Code's built-in capabilities:
- Task agents (Explore, Plan, general-purpose)
- Grep/Glob for code analysis
- Read/Edit for file inspection
- Web search/fetch for documentation

This provides equivalent functionality for the pilot reports.
