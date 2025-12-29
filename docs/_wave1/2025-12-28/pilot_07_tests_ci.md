# Pilot 7: Tests & CI Minimums

**Date**: 2025-12-28
**Status**: Complete

---

## Executive Summary

EZCR has a solid testing foundation with Vitest for unit tests and Playwright for E2E tests. CI is minimal - needs enhancement for automated quality gates.

---

## Current Test Posture

### Test Files Discovered

| Category | Count | Location |
|----------|-------|----------|
| Unit Tests | 223+ | `tests/unit/`, `src/**/__tests__/` |
| E2E Tests | 1 | `tests/checkout.spec.ts` |
| Integration | 0 | - |

### Test Frameworks

| Framework | Version | Purpose |
|-----------|---------|---------|
| Vitest | 3.2.4 | Unit tests |
| @testing-library/react | 16.3.0 | Component testing |
| Playwright | 1.56.0 | E2E tests |
| jsdom | 27.0.0 | DOM simulation |

### Current Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.test.ts', 'tests/unit/**/*.test.ts'],
  },
});
```

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
});
```

### Test Scripts (package.json)

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

---

## Test Coverage Gaps

### Critical Paths Missing Tests

| Feature | Current | Needed | Priority |
|---------|---------|--------|----------|
| Checkout Flow | 1 E2E | More scenarios | P0 |
| API Auth | 0 | Unit tests | P0 |
| Cart Operations | 0 | Unit + E2E | P0 |
| RAG Search | 0 | Unit tests | P1 |
| Admin CRM | 0 | E2E tests | P1 |
| Stripe Webhooks | 0 | Integration | P1 |
| Scheduler Booking | 0 | Unit + E2E | P2 |

### Recommended Minimum Smoke Tests

```typescript
// tests/smoke/critical-paths.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Critical Path Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/EZ Cycle Ramp/);
    await expect(page.locator('nav')).toBeVisible();
  });

  test('product catalog loads', async ({ page }) => {
    await page.goto('/products');
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
  });

  test('cart operations work', async ({ page }) => {
    await page.goto('/products');
    await page.click('[data-testid="add-to-cart"]');
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
  });

  test('admin login redirects unauthenticated', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/auth\/login/);
  });

  test('API health check', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
  });
});
```

---

## CI/CD Current State

### GitHub Actions Workflows

```
.github/workflows/
└── deploy-staging.yml  # Deployment only
```

### Current deploy-staging.yml

Basic deployment workflow, no quality gates:
- Triggers on push to staging branch
- Builds and deploys to Coolify
- No tests, no lint, no typecheck

---

## CI Fast-Gates Plan

### Proposed Workflow: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  typecheck:
    name: TypeCheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx tsc --noEmit

  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run test:run
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: test-results
          path: test-results/

  build:
    name: Build
    needs: [lint, typecheck, unit-tests]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

### E2E Tests Workflow (Optional, Longer)

```yaml
  e2e-tests:
    name: E2E Tests
    needs: [build]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Minimal Smoke Tests to Add

### 1. API Route Smoke Tests

```typescript
// tests/unit/api/routes.test.ts
import { describe, it, expect } from 'vitest';

describe('API Routes', () => {
  it('health endpoint returns ok', async () => {
    const res = await fetch('http://localhost:3000/api/health');
    expect(res.status).toBe(200);
  });
});
```

### 2. Auth Flow Tests

```typescript
// tests/unit/auth/api-auth.test.ts
import { describe, it, expect, vi } from 'vitest';
import { requireAuth, requireRole } from '@/lib/auth/api-auth';

describe('API Auth', () => {
  it('requireAuth throws on missing user', async () => {
    const mockRequest = new Request('http://localhost/api/test');
    await expect(requireAuth(mockRequest)).rejects.toThrow();
  });
});
```

### 3. Cart State Tests

```typescript
// tests/unit/cart/cart-store.test.ts
import { describe, it, expect } from 'vitest';
import { useCartStore } from '@/hooks/use-cart-store';

describe('Cart Store', () => {
  it('adds item to cart', () => {
    const store = useCartStore.getState();
    store.addItem({ id: '1', name: 'Ramp', price: 299 });
    expect(store.items).toHaveLength(1);
  });

  it('calculates total correctly', () => {
    const store = useCartStore.getState();
    store.addItem({ id: '1', name: 'Ramp', price: 299, quantity: 2 });
    expect(store.total).toBe(598);
  });
});
```

---

## Test Quality Metrics

### Targets

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Unit Test Coverage | ~30% | 60% | 30 days |
| Critical Path E2E | 1 | 10 | 14 days |
| CI Pass Rate | N/A | >95% | Immediate |
| Avg CI Time | N/A | <5 min | Immediate |

### Quality Gates

| Gate | Threshold | Enforcement |
|------|-----------|-------------|
| Lint | 0 errors | Block merge |
| TypeCheck | 0 errors | Block merge |
| Unit Tests | 100% pass | Block merge |
| Coverage | 50% lines | Warning |
| E2E | 100% pass | Block staging deploy |

---

## Punch List

### P0 - Implement Now
- [ ] Create `.github/workflows/ci.yml`
- [ ] Add smoke test file
- [ ] Fix any lint/typecheck errors
- [ ] Ensure npm run test:run passes

### P1 - This Week
- [ ] Add API auth unit tests
- [ ] Add cart store unit tests
- [ ] Add 5 critical E2E tests
- [ ] Configure coverage reporting

### P2 - This Sprint
- [ ] Add integration tests for webhooks
- [ ] Add visual regression tests
- [ ] Add performance budget checks
- [ ] Add accessibility testing (axe-core)

---

## Implementation Priority

1. **CI Workflow** - Immediate blocker for quality
2. **Smoke Tests** - Quick wins, high value
3. **Critical Path E2E** - Prevent regressions
4. **Unit Test Coverage** - Incremental improvement
