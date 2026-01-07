# NexCyte Documentation Index

> **Generated:** 2026-01-07
> **Purpose:** Cross-repository documentation reference

## Repository Documentation

| Repo | CLAUDE.md | PRD | Skills |
|------|-----------|-----|--------|
| nexcyte-platform | [View](../../nexcyte-platform/CLAUDE.md) | [View](../../nexcyte-platform/docs/PRD.md) | [Registry](../../nexcyte-platform/.skills/SKILL-REGISTRY.md) |
| ezcr | [View](../CLAUDE.md) | [View](./PRD.md) | [Registry](../.skills/SKILL-REGISTRY.md) |
| nexcyte-www | Not created | Not created | - |

---

## Quick Access by Topic

### Getting Started

| Topic | EZCR | Platform |
|-------|------|----------|
| Project Setup | [CLAUDE.md](../CLAUDE.md) | [CLAUDE.md](../../nexcyte-platform/CLAUDE.md) |
| Tech Stack | [PRD Section 11](./PRD.md#11-technical-specifications) | [PRD Section 11](../../nexcyte-platform/docs/PRD.md#11-technical-specifications) |

### Architecture

| Topic | EZCR | Platform |
|-------|------|----------|
| Multi-Tenant | Inherits from platform | [PRD Section 3](../../nexcyte-platform/docs/PRD.md#3-multi-tenant-architecture-locked) |
| Module Boundaries | N/A | [PRD Section 4](../../nexcyte-platform/docs/PRD.md#4-module-boundary-system-locked) |
| Database Schema | [PRD Section 7](./PRD.md#7-database-schema) | [PRD Section 6](../../nexcyte-platform/docs/PRD.md#6-supabase-patterns-locked) |

### Features

| Topic | EZCR | Platform |
|-------|------|----------|
| Configurator (UFE) | [PRD Section 3](./PRD.md#3-unified-fitment-engine-ufe) | N/A |
| Checkout | [PRD Section 4](./PRD.md#4-checkout--order-management) | N/A |
| Permissions | [PRD Section 5](./PRD.md#5-user-roles--permissions) | [PRD Section 7.2](../../nexcyte-platform/docs/PRD.md#72-authorization) |
| API Design | Extends platform | [PRD Section 8](../../nexcyte-platform/docs/PRD.md#8-api-design-patterns-extend) |

### Security

| Topic | Location |
|-------|----------|
| Security Standards | [Platform Skill](../../nexcyte-platform/.skills/platform/security-standards/SKILL.md) |
| Authentication | [Platform PRD Section 7.1](../../nexcyte-platform/docs/PRD.md#71-authentication) |
| RLS Policies | [Platform Skill](../../nexcyte-platform/.skills/platform/supabase-patterns/SKILL.md) |

---

## Skills Reference

### Platform Skills (LOCKED)

All tenants must follow these:

| Skill | Location | Description |
|-------|----------|-------------|
| multi-tenant | [View](../../nexcyte-platform/.skills/platform/multi-tenant/SKILL.md) | Tenant isolation |
| module-boundaries | [View](../../nexcyte-platform/.skills/platform/module-boundaries/SKILL.md) | Import rules |
| supabase-patterns | [View](../../nexcyte-platform/.skills/platform/supabase-patterns/SKILL.md) | Database patterns |
| security-standards | [View](../../nexcyte-platform/.skills/platform/security-standards/SKILL.md) | Auth & security |

### Template Skills (EXTEND)

| Skill | Location | Description |
|-------|----------|-------------|
| api-design | [Platform](../../nexcyte-platform/.skills/platform/api-design/SKILL.md) | API routes |
| tenant-template | [EZCR](../.skills/templates/tenant-template/SKILL.md) | E-commerce patterns |

### Local Skills (EZCR)

| Skill | Location | Description |
|-------|----------|-------------|
| configurator | [View](../.skills/local/ezcr/configurator/SKILL.md) | UFE patterns |
| premium-ux | [View](../.skills/local/ezcr/premium-ux/SKILL.md) | High-value UX |

---

## Audit Reports

| Repo | Report |
|------|--------|
| EZCR | [AUDIT-REPORT.md](../.skills/AUDIT-REPORT.md) |
| Platform | [AUDIT-REPORT.md](../../nexcyte-platform/.skills/AUDIT-REPORT.md) |
| Combined | [MASTER-AUDIT-REPORT.md](../.skills/MASTER-AUDIT-REPORT.md) |

---

## File Paths Reference

### EZCR (C:/Users/morri/Dropbox/Websites/ezcr)

```
CLAUDE.md                           # Project guide
docs/
├── PRD.md                          # Product requirements
└── NEXCYTE-DOCS-INDEX.md           # This file
.skills/
├── SKILL-REGISTRY.md               # Skills index
├── AUDIT-REPORT.md                 # Audit report
├── MASTER-AUDIT-REPORT.md          # Combined report
├── platform/                       # Platform skills
├── templates/tenant-template/      # E-commerce template
└── local/ezcr/                     # EZCR-specific skills
```

### nexcyte-platform (C:/Users/morri/Dropbox/Websites/nexcyte-platform)

```
CLAUDE.md                           # Project guide
docs/
├── PRD.md                          # Product requirements
├── ARCHITECTURE_OVERVIEW.md        # Architecture
└── REPO_OVERVIEW.md                # Repo structure
.skills/
├── SKILL-REGISTRY.md               # Skills index
├── AUDIT-REPORT.md                 # Audit report
└── platform/                       # Platform skills
```

---

## Maintenance

- **Last Updated:** 2026-01-07
- **Owner:** Platform Team
- **Update Frequency:** On significant changes
