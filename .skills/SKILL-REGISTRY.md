# NexCyte Skill Registry

> Auto-generated from skill audit on 2026-01-07
> Environment: Windows (EZCR repo)

## Quick Reference

| Skill | Tier | Location | Override Policy |
|-------|------|----------|-----------------|
| supabase-patterns | Platform | platform/supabase-patterns | LOCKED/EXTEND |
| security-standards | Platform | platform/security-standards | LOCKED |
| api-design | Platform | platform/api-design | EXTEND |
| multi-tenant | Platform | platform/multi-tenant | LOCKED |
| tenant-template | Template | templates/tenant-template | EXTEND |
| configurator | Local | local/ezcr/configurator | N/A |
| premium-ux | Local | local/ezcr/premium-ux | N/A |

## Inheritance Map

```
platform/supabase-patterns [LOCKED]
├── ALL repos must follow
└── Defines: UUID keys, JSONB, RLS, timestamps

platform/security-standards [LOCKED]
├── ALL repos must follow
└── Defines: Roles, auth, validation

platform/api-design [EXTEND]
├── templates/tenant-template (extends)
│   └── local/ezcr/* (extends)
└── Defines: Route structure, errors

platform/multi-tenant [LOCKED]
├── ALL repos must follow
└── Defines: Tenant isolation

templates/tenant-template [EXTEND]
└── local/ezcr/
    ├── configurator (extends)
    └── premium-ux (extends)
```

## Repo Coverage Matrix

| Pattern Area | Platform Skill | Template | EZCR Local |
|--------------|----------------|----------|------------|
| Database | supabase-patterns | - | - |
| Security | security-standards | - | - |
| API | api-design | - | - |
| Tenant | multi-tenant | - | - |
| E-commerce | - | tenant-template | - |
| Configurator | - | - | configurator |
| Premium UX | - | - | premium-ux |

## How to Use

### In ezcr (and future tenants):

Read skills in order:
1. `.skills/platform/*` (all platform skills)
2. `.skills/templates/tenant-template/`
3. `.skills/local/ezcr/*`

### Adding to CLAUDE.md:

```markdown
## Skills

This project uses NexCyte skills. Read these before making changes:

- `.skills/platform/supabase-patterns/SKILL.md` - Database patterns
- `.skills/platform/security-standards/SKILL.md` - Security (LOCKED)
- `.skills/platform/api-design/SKILL.md` - API routes
- `.skills/platform/multi-tenant/SKILL.md` - Tenant isolation
- `.skills/templates/tenant-template/SKILL.md` - E-commerce patterns
- `.skills/local/ezcr/configurator/SKILL.md` - UFE patterns
- `.skills/local/ezcr/premium-ux/SKILL.md` - High-value UX
```

## Graduation Queue

Skills that may be promoted to templates:

| Skill | Current Location | Target | Blocker |
|-------|------------------|--------|---------|
| configurator | local/ezcr | tenant-template | Needs second use case |
| premium-ux | local/ezcr | tenant-template | Ready to promote |

## Maintenance

- **Last Updated:** 2026-01-07
- **Next Review:** When adding new tenant
- **Owner:** Platform Team
