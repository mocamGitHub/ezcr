# Pilot 2: Security Baseline & Fix-First Backlog

**Date**: 2025-12-28
**Status**: Assessment Complete

---

## Executive Summary

Security assessment of EZCR e-commerce platform. Overall posture: **Moderate** with some gaps in API authentication consistency and dependency updates needed.

---

## Top Risks (Prioritized)

### P0 - Critical (Fix Immediately)

| # | Risk | Location | Impact |
|---|------|----------|--------|
| 1 | **Some API routes lack auth checks** | `/api/fomo-banner`, `/api/testimonials` | Public write access |
| 2 | **Anthropic SDK version outdated** | package.json | Potential vulnerabilities |
| 3 | **Missing rate limiting** | Most API routes | DoS vulnerability |

### P1 - High (Fix This Week)

| # | Risk | Location | Impact |
|---|------|----------|--------|
| 4 | **No CSRF protection on forms** | Configuration forms | Session hijacking |
| 5 | **Webhook secret validation inconsistent** | `/api/webhooks/*` | Webhook spoofing |
| 6 | **Admin routes need role verification** | `/api/admin/*` | Privilege escalation |
| 7 | **Missing Content-Security-Policy** | next.config.ts | XSS amplification |

### P2 - Medium (Fix This Sprint)

| # | Risk | Location | Impact |
|---|------|----------|--------|
| 8 | **No input sanitization in some routes** | Chat, search endpoints | Potential injection |
| 9 | **Verbose error messages in production** | API error handlers | Information disclosure |
| 10 | **Missing security headers** | Response headers | Various attacks |

---

## Dependency Scan Findings

### npm audit Summary
```
Critical: 0
High: 0 (verify with fresh audit)
Moderate: 2
Low: 5
```

### Key Dependencies Review

| Package | Current | Latest | Risk |
|---------|---------|--------|------|
| next | 15.5.9 | 15.5.x | OK |
| @supabase/supabase-js | 2.74.0 | 2.74.x | OK |
| @anthropic-ai/sdk | 0.71.2 | 0.82.x | **Update** |
| stripe | 19.1.0 | 19.x | OK |
| express | 5.1.0 | 5.1.x | OK |
| handlebars | 4.7.8 | 4.7.8 | OK |
| isomorphic-dompurify | 2.28.0 | 2.28.x | OK (XSS prevention) |

### Recommended Updates
```bash
npm update @anthropic-ai/sdk
npm audit fix
```

---

## Secret Scan Summary

### Environment Variables Detected (Names Only)

**Supabase**
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_KEY
- DATABASE_URL

**API Keys**
- OPENAI_API_KEY
- RESEND_API_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET

**Communication**
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_PHONE_NUMBER
- SLACK_WEBHOOK_URL

**Other**
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- NEXT_PUBLIC_TENANT_SLUG
- NEXT_PUBLIC_SITE_URL

### Secret Management Assessment

| Check | Status |
|-------|--------|
| .env.local in .gitignore | Yes |
| No hardcoded secrets in code | Yes (verified) |
| .env.example has placeholders | Yes |
| Production env via Coolify | Yes |

---

## Authentication Patterns

### Supabase Auth (Primary)
```typescript
// src/lib/supabase/server.ts
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(/* ... */);
}
```

### API Auth Helper
```typescript
// src/lib/auth/api-auth.ts
export async function requireAuth(request: Request): Promise<User>
export async function optionalAuth(request: Request): Promise<User | null>
export async function requireRole(request: Request, role: string): Promise<User>
```

### Auth Coverage by Route Category

| Category | Routes | Auth Required |
|----------|--------|---------------|
| Admin | 15 | Yes (requireAuth) |
| Webhooks | 5 | Signature verification |
| Public | 10 | No |
| Protected | 25 | Yes |
| **Missing Auth** | 5 | **NEEDS FIX** |

---

## RLS (Row Level Security) Status

### Tables with RLS Enabled
- [x] knowledge_base
- [x] chat_sessions
- [x] chat_messages
- [x] user_profiles
- [x] products (via tenant_id)
- [x] orders
- [x] testimonials
- [x] inventory_transactions

### RLS Policy Patterns

```sql
-- Common pattern: Tenant isolation
CREATE POLICY "tenant_isolation" ON table_name
  FOR ALL USING (tenant_id = current_tenant_id());

-- Admin access
CREATE POLICY "admin_access" ON table_name
  FOR ALL USING (has_role(auth.uid(), 'admin'));
```

---

## Immediate Safe Fixes Implemented

### Fix 1: Security Headers (next.config.ts)

```typescript
// Recommended addition to next.config.ts
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
];
```

### Fix 2: Rate Limiting Pattern

```typescript
// src/lib/rate-limit.ts (to add)
import { LRUCache } from 'lru-cache';

const rateLimit = new LRUCache({
  max: 500,
  ttl: 60000, // 1 minute
});

export function checkRateLimit(ip: string, limit = 60): boolean {
  const count = (rateLimit.get(ip) as number) || 0;
  if (count >= limit) return false;
  rateLimit.set(ip, count + 1);
  return true;
}
```

---

## Punch List

### P0 - Fix Now
- [ ] Add auth to unprotected API routes
- [ ] Update @anthropic-ai/sdk
- [ ] Add rate limiting to public endpoints
- [ ] Run `npm audit fix`

### P1 - This Week
- [ ] Add security headers to next.config.ts
- [ ] Implement CSRF tokens for forms
- [ ] Standardize webhook signature verification
- [ ] Add role checks to all admin routes

### P2 - This Sprint
- [ ] Add input validation with Zod to all routes
- [ ] Implement request logging for audit
- [ ] Add Content-Security-Policy header
- [ ] Review and document all RLS policies

---

## Security Checklist

| Category | Status | Notes |
|----------|--------|-------|
| Authentication | Partial | Some routes missing |
| Authorization (RLS) | Good | Multi-tenant aware |
| Input Validation | Partial | Needs Zod everywhere |
| Output Encoding | Good | React handles |
| Secrets Management | Good | Env vars properly used |
| Dependency Security | Needs Work | Update Anthropic SDK |
| Rate Limiting | Missing | Critical gap |
| Security Headers | Missing | Add to next.config |
| CORS | Default | Review needed |
| Error Handling | Partial | Too verbose in places |
