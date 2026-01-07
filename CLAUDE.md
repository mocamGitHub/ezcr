# Claude Code Project Guide

**Note**: This project uses [bd (beads)](https://github.com/steveyegge/beads)
for issue tracking. Use `bd` commands instead of markdown TODOs.
See AGENTS.md for workflow details.

## Issue Tracking

This project uses Beads (bd) for issue tracking. Run `bd onboard` for workflow instructions.

## Project Overview

This is the EZCR (EZCycleramp) project - an e-commerce website for motorcycle ramps and accessories.

## Key Technologies

- Next.js (App Router)
- TypeScript
- Supabase (PostgreSQL database)
- Tailwind CSS

## Getting Started

1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
3. Run Beads onboarding: `bd onboard`

## Skills Reference

This project uses NexCyte skills for consistent patterns. **Read these before making changes:**

### Platform Skills (LOCKED - must follow)

- `.skills/platform/supabase-patterns/SKILL.md` - Database schema, RLS, migrations
- `.skills/platform/security-standards/SKILL.md` - Auth, roles, validation
- `.skills/platform/api-design/SKILL.md` - API route structure, error handling
- `.skills/platform/multi-tenant/SKILL.md` - Tenant isolation patterns

### Template Skills (EXTEND - can customize)

- `.skills/templates/tenant-template/SKILL.md` - E-commerce patterns

### Local Skills (EZCR-specific)

- `.skills/local/ezcr/configurator/SKILL.md` - UFE and wizard patterns
- `.skills/local/ezcr/premium-ux/SKILL.md` - High-value purchase UX

### Quick Reference

| Pattern | Skill | Policy |
|---------|-------|--------|
| New database table | supabase-patterns | LOCKED |
| Permission checks | security-standards | LOCKED |
| API endpoints | api-design | EXTEND |
| Tenant data | multi-tenant | LOCKED |
| Configurator changes | configurator | Local |

See `.skills/SKILL-REGISTRY.md` for full documentation.
