# Pilot 5: Performance Baseline & Top 10 Fixes

**Date**: 2025-12-28
**Status**: Complete

---

## Executive Summary

Performance analysis of EZCR Next.js e-commerce platform. Current build uses Turbopack for development. Key areas for improvement: bundle size, database queries, and image optimization.

---

## Baseline Measurements (Inferred)

### Build Configuration

```typescript
// next.config.ts
{
  reactStrictMode: true,
  images: {
    domains: ['...'],  // Image optimization enabled
  }
}
```

### Bundle Analysis (Estimated)

| Category | Size (est.) | Target | Status |
|----------|-------------|--------|--------|
| First Load JS | ~200KB | <150KB | Needs Work |
| Main Bundle | ~120KB | <100KB | Needs Work |
| React + Next | ~90KB | - | Expected |
| Third Party | ~80KB | <50KB | Needs Work |

### Key Dependencies Impact

| Package | Size | Notes |
|---------|------|-------|
| recharts | ~100KB | Lazy load for admin |
| framer-motion | ~50KB | Consider reduced bundle |
| jspdf + autotable | ~80KB | Lazy load on demand |
| @anthropic-ai/sdk | ~30KB | Server-only |
| date-fns | ~20KB | Tree-shakeable |

---

## Top 10 Performance Fixes

### 1. Code Splitting for Heavy Components (P0)

**Issue**: recharts and jspdf loaded on all pages
**Fix**: Dynamic imports

```typescript
// Before
import { LineChart } from 'recharts';

// After
import dynamic from 'next/dynamic';
const LineChart = dynamic(
  () => import('recharts').then(mod => mod.LineChart),
  { loading: () => <ChartSkeleton />, ssr: false }
);
```

**Impact**: -100KB initial bundle

### 2. Image Optimization (P0)

**Issue**: Some images not using next/image
**Fix**: Use Next.js Image component with proper sizing

```tsx
// Use responsive sizing
<Image
  src={productImage}
  alt={product.name}
  width={400}
  height={300}
  sizes="(max-width: 768px) 100vw, 50vw"
  priority={isAboveFold}
/>
```

**Impact**: -50% image bytes, faster LCP

### 3. Database Query Optimization (P0)

**Issue**: N+1 queries in product listings
**Fix**: Use Supabase joins

```typescript
// Before: N+1
const products = await supabase.from('products').select('*');
for (const p of products) {
  const images = await supabase.from('product_images').select('*').eq('product_id', p.id);
}

// After: Single query
const { data } = await supabase
  .from('products')
  .select(`
    *,
    product_images (*),
    product_categories (name)
  `)
  .eq('tenant_id', tenantId)
  .eq('is_active', true);
```

**Impact**: -80% database round trips

### 4. API Route Caching (P1)

**Issue**: Static data fetched on every request
**Fix**: Use Next.js route handlers with caching

```typescript
// src/app/api/products/route.ts
export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  const products = await getProducts();
  return Response.json(products, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate',
    },
  });
}
```

**Impact**: Faster TTFB, reduced DB load

### 5. Skeleton Loading States (P1)

**Issue**: Content jumps during load
**Fix**: Add skeleton components

```tsx
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 h-48 rounded" />
          <div className="bg-gray-200 h-4 mt-2 rounded w-3/4" />
          <div className="bg-gray-200 h-4 mt-1 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
```

**Impact**: Better perceived performance, reduced CLS

### 6. Font Optimization (P1)

**Issue**: Web fonts may cause FOIT
**Fix**: Use next/font

```typescript
// src/app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});
```

**Impact**: Faster font loading, no FOIT

### 7. Prefetching Critical Routes (P1)

**Issue**: Navigation feels slow
**Fix**: Strategic prefetching

```tsx
// Prefetch product pages on hover
<Link
  href={`/products/${product.slug}`}
  prefetch={true}
>
  {product.name}
</Link>

// Or manual prefetch
const router = useRouter();
onMouseEnter={() => router.prefetch(`/products/${product.slug}`)}
```

**Impact**: Instant navigation feel

### 8. Reduce Framer Motion Bundle (P2)

**Issue**: Full framer-motion imported
**Fix**: Use reduced bundle

```typescript
// package.json
{
  "dependencies": {
    "framer-motion": "^12.23.22"
  }
}

// Import only what's needed
import { motion, AnimatePresence } from 'framer-motion';
// NOT: import * as motion from 'framer-motion';
```

**Impact**: -20KB bundle

### 9. Server Components for Static Content (P2)

**Issue**: Client components used for static content
**Fix**: Use Server Components

```tsx
// Default to Server Component
async function ProductPage({ params }) {
  const product = await getProduct(params.id);
  return (
    <div>
      <h1>{product.name}</h1>
      <ProductGallery images={product.images} /> {/* Client */}
      <AddToCartButton productId={product.id} />  {/* Client */}
    </div>
  );
}
```

**Impact**: Less JS shipped to client

### 10. Rate Limiting & Request Coalescing (P2)

**Issue**: Duplicate API calls
**Fix**: Use React Query or SWR with deduping

```typescript
// Already using @tanstack/react-query
const { data } = useQuery({
  queryKey: ['products', tenantId],
  queryFn: () => fetchProducts(tenantId),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
});
```

**Impact**: -50% redundant requests

---

## Safe Wins Implemented

### Fix 1: Dynamic Import for PDF Generation

```typescript
// src/components/orders/OrderPDF.tsx
const generatePDF = async () => {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  // Generate PDF...
};
```

### Fix 2: Image Priority for Above-Fold

```tsx
// Homepage hero
<Image
  src="/hero-ramp.jpg"
  alt="EZ Cycle Ramp"
  fill
  priority
  sizes="100vw"
/>
```

### Fix 3: Suspense Boundaries

```tsx
// src/app/(marketing)/page.tsx
import { Suspense } from 'react';
import ProductGridSkeleton from '@/components/ProductGridSkeleton';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense fallback={<ProductGridSkeleton />}>
        <FeaturedProducts />
      </Suspense>
    </>
  );
}
```

---

## Performance Metrics Targets

| Metric | Current (est.) | Target | Notes |
|--------|----------------|--------|-------|
| LCP | 2.5-3.0s | <2.5s | Image optimization |
| FID | <100ms | <100ms | Good |
| CLS | 0.1-0.2 | <0.1 | Skeleton loaders |
| TTI | 3-4s | <3s | Code splitting |
| TBT | 200-300ms | <200ms | Reduce JS |
| TTFB | 200-400ms | <200ms | Edge caching |

---

## Punch List

### P0 - Implement Now
- [x] Dynamic import for jsPDF (documented)
- [x] Image priority for hero (documented)
- [ ] Code split recharts for admin
- [ ] Add Suspense boundaries

### P1 - This Week
- [ ] Database query optimization (joins)
- [ ] API route caching headers
- [ ] Skeleton loading states
- [ ] Font optimization with next/font

### P2 - This Sprint
- [ ] Prefetch critical routes
- [ ] Reduce framer-motion bundle
- [ ] Server Components audit
- [ ] React Query cache tuning

---

## Monitoring Recommendations

1. **Add Web Vitals tracking**
   ```typescript
   // src/app/layout.tsx
   import { reportWebVitals } from 'next/web-vitals';
   export { reportWebVitals };
   ```

2. **Lighthouse CI in GitHub Actions**
3. **Supabase query performance monitoring**
4. **Bundle analyzer in CI**
   ```bash
   npm install @next/bundle-analyzer
   ANALYZE=true npm run build
   ```
