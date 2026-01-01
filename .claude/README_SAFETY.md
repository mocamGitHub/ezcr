# Claude Code Safety Configuration

This project uses Claude Code with project-scoped permissions defined in `.claude/settings.json`.

## Denied Access (Secrets Protection)

The following paths are **blocked** from being read:

- `.env` and `.env.*` files (environment variables with secrets)
- `secrets/` directories anywhere in the project
- `config/credentials.json`

## Ask-Gated Commands

These commands require explicit user approval:

- `git push`, `git pull`, `git merge` (remote operations)
- `curl`, `wget`, `Invoke-WebRequest` (network requests)
- `docker` (container operations)

## Allowed Operations

- All file read/edit operations (except denied paths)
- Local git operations (status, diff, log, branch, checkout, add, commit)
- Node.js/npm/npx/pnpm/yarn/bun commands
- Supabase CLI commands
- PowerShell commands

## Local Overrides

To override these settings locally (not committed to repo):

1. Create `.claude/settings.local.json`
2. Add your overrides in the same format
3. Local settings take precedence

**Note:** Do NOT create `.claude/settings.local.json` in version control.
