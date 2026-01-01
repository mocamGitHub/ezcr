# Ralph Loop Configuration

## Recommended Ralph Command (Conservative)

```bash
ralph --calls 50 --timeout 60 --verbose
```

With tmux monitoring (if available):
```bash
ralph --monitor --calls 50 --timeout 60 --verbose
```

Check status:
```bash
ralph --status
```

## Thrash-Prevention Rules (NON-NEGOTIABLE)

### 1. Migration Discipline

- Create **exactly TWO migrations total**:
  - `<timestamp>_tasks_mvp.sql`
  - `<timestamp>_dashboards_system.sql`
- After those exist, ONLY edit those same migration files if fixes are needed
- Do NOT create additional migrations unless a migration is irreparably broken

### 2. Phase Gating

- Do NOT start Dashboards until Tasks is green:
  - Routes render correctly
  - Webhook responds 200
  - Migration/RLS compiles without errors

### 3. Green Checks Before Proceeding

Every loop must re-run these checks before proceeding:

1. Build/lint passes (if configured)
2. Finance RPC returns required keys
3. Tasks routes respond without errors

## Gate Checklist

See `@fix_plan.md` for the complete checklist of gates that must pass.

## Ralph Installation

If ralph is not installed, see `docs/combined/RALPH_INSTALL.md` for manual installation steps.
