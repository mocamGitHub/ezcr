# Wave 1 Baseline

**Date**: 2025-12-28
**Branch**: chore/wave1-agents-plugins

## Repository Info

- **Repo Root**: C:/Users/morri/Dropbox/Websites/ezcr
- **Baseline Commit**: 2d2d60d8c14cdb8a1ef8a7e16e5f3f33f786be9d
- **Sibling Repo (nexcyte-platform)**: Not present

## Package Manager

- **Primary**: npm (package-lock.json - most recent)
- **Secondary**: pnpm (pnpm-lock.yaml present but older)

## Workspace Layout

```
ezcr/
├── src/           # Next.js App Router source
├── supabase/      # Supabase migrations, functions, seeds
├── scripts/       # Utility scripts
├── tests/         # Test files
├── docs/          # Documentation
├── public/        # Static assets
├── n8n/           # n8n workflow definitions
├── sql/           # SQL scripts
├── db/            # Database utilities
├── tools/         # Build/deploy tools
├── installer/     # Installer scripts
└── claude/        # Claude-related configs
```

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Testing**: Vitest + Playwright
- **CI**: GitHub Actions

## Key Config Files

- next.config.ts
- tailwind.config.ts
- tsconfig.json
- vitest.config.ts
- eslint.config.mjs
- playwright.config.ts
