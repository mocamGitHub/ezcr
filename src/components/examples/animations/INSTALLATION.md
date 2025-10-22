# Installation Guide for Animation & 3D Libraries

This guide provides step-by-step installation instructions for all animation and 3D libraries demonstrated in the examples.

## 📋 Prerequisites

- Node.js 18+ installed
- pnpm package manager (already in use)
- Next.js 15 project (already set up)

---

## ✅ Already Installed

### Framer Motion
**Status:** ✅ Already in package.json (v12.23.22)

**No installation needed!** Just start using it:

```tsx
import { motion } from 'framer-motion';
```

**Check version:**
```bash
pnpm list framer-motion
```

---

## 🆕 New Library Installations

### Option 1: Install All Libraries (Complete Package)

Install everything at once:

```bash
pnpm add @formkit/auto-animate @rive-app/react-canvas lottie-react three @react-three/fiber @react-three/drei @splinetool/react-spline
```

**Estimated total bundle size:** ~800KB (minified + gzipped)

---

### Option 2: Install Incrementally (Recommended)

Install only what you need, when you need it.

#### Phase 1: Quick Wins (Recommended Start)

```bash
# AutoAnimate - Zero-config animations (3KB)
pnpm add @formkit/auto-animate
```

**Use for:**
- Product filtering
- Shopping cart
- Search results
- Any dynamic lists

---

#### Phase 2: Rich Animations

```bash
# Rive - Interactive animations (150KB)
pnpm add @rive-app/react-canvas

# Lottie - Decorative animations (80KB)
pnpm add lottie-react
```

**Use for:**
- Loading states (Rive)
- Button interactions (Rive)
- Order confirmations (Lottie)
- Empty states (Lottie)

---

#### Phase 3: 3D Visualization

```bash
# React Three Fiber - 3D scenes (200KB + models)
pnpm add three @react-three/fiber @react-three/drei

# TypeScript types for Three.js (dev dependency)
pnpm add -D @types/three
```

**Use for:**
- Interactive ramp configurator
- 3D product previews
- Material visualization

**Optional: Spline (if you prefer no-code 3D)**
```bash
# Spline - No-code 3D (300KB)
pnpm add @splinetool/react-spline
```

---

## 🔍 Verify Installations

Check all installed animation libraries:

```bash
pnpm list framer-motion @formkit/auto-animate @rive-app/react-canvas lottie-react three @react-three/fiber @react-three/drei @splinetool/react-spline
```

---

## 📦 Expected package.json Additions

After installation, your `package.json` dependencies should include:

```json
{
  "dependencies": {
    // Already installed
    "framer-motion": "^12.23.22",

    // New additions
    "@formkit/auto-animate": "^1.0.0",
    "@rive-app/react-canvas": "^4.0.0",
    "lottie-react": "^2.4.0",
    "three": "^0.170.0",
    "@react-three/fiber": "^8.18.0",
    "@react-three/drei": "^9.122.0",
    "@splinetool/react-spline": "^4.0.0"
  },
  "devDependencies": {
    "@types/three": "^0.170.0"
  }
}
```

*(Version numbers may vary - these are current as of 2025)*

---

## 🧪 Test Installation

Create a test page to verify everything works:

```tsx
// src/app/test-animations/page.tsx
'use client';

import { motion } from 'framer-motion';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useRive } from '@rive-app/react-canvas';
import Lottie from 'lottie-react';
import { Canvas } from '@react-three/fiber';
import Spline from '@splinetool/react-spline';

export default function TestPage() {
  const [parent] = useAutoAnimate();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Animation Libraries Test</h1>

      {/* Framer Motion */}
      <motion.div
        className="mb-4 p-4 bg-blue-100 rounded"
        whileHover={{ scale: 1.05 }}
      >
        ✅ Framer Motion Working
      </motion.div>

      {/* AutoAnimate */}
      <div ref={parent} className="mb-4 space-y-2">
        <div className="p-4 bg-green-100 rounded">
          ✅ AutoAnimate Working
        </div>
      </div>

      {/* Test other libraries as needed */}
    </div>
  );
}
```

Visit `/test-animations` in your browser to verify.

---

## 🚨 Troubleshooting

### Issue: Module not found

**Error:**
```
Module not found: Can't resolve '@formkit/auto-animate/react'
```

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

---

### Issue: Type errors with Three.js

**Error:**
```
Cannot find type definition file for 'three'
```

**Solution:**
```bash
pnpm add -D @types/three
```

---

### Issue: Hydration errors with Lottie

**Error:**
```
Hydration failed because the initial UI does not match what was rendered on the server
```

**Solution:**
Always use `'use client'` directive:
```tsx
'use client';

import Lottie from 'lottie-react';
```

Or use dynamic import with `ssr: false`:
```tsx
import dynamic from 'next/dynamic';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
```

---

### Issue: Canvas not rendering (React Three Fiber)

**Error:**
Blank screen where 3D scene should be

**Solution:**
1. Ensure Canvas has explicit height:
```tsx
<div className="h-96">
  <Canvas>...</Canvas>
</div>
```

2. Wrap in Suspense:
```tsx
<Suspense fallback={<div>Loading...</div>}>
  <Canvas>...</Canvas>
</Suspense>
```

---

## 📊 Bundle Size Impact

After installation, check bundle size:

```bash
pnpm run build
```

Look for the output showing page sizes. Animation libraries will add:
- AutoAnimate: +3KB
- Framer Motion: +50KB (already included)
- Rive: +150KB
- Lottie: +80KB
- Three.js + R3F: +200KB
- Spline: +300KB

**Total potential increase:** ~800KB

**Recommendation:** Use code splitting and lazy loading for 3D libraries.

---

## 🎯 Recommended Installation Order

### Week 1: Quick Wins
```bash
pnpm add @formkit/auto-animate
```

Test with product lists, cart, search results.

### Week 2: Rich Animations
```bash
pnpm add @rive-app/react-canvas lottie-react
```

Add interactive elements and loading states.

### Week 3-4: 3D Configurator
```bash
pnpm add three @react-three/fiber @react-three/drei
pnpm add -D @types/three
```

Build the 3D ramp configurator.

### Optional: Marketing Enhancement
```bash
pnpm add @splinetool/react-spline
```

Add 3D hero sections.

---

## 🔧 Development vs Production

### Development
Install all libraries to test examples:
```bash
pnpm add --dev @formkit/auto-animate @rive-app/react-canvas lottie-react three @react-three/fiber @react-three/drei @splinetool/react-spline
```

### Production
Move only the libraries you're actually using to dependencies:
```bash
pnpm add @formkit/auto-animate
# Add others as needed
```

---

## 📝 Post-Installation Checklist

- [ ] Run `pnpm install` successfully
- [ ] No TypeScript errors
- [ ] Create test page to verify imports
- [ ] Check bundle size with `pnpm run build`
- [ ] Test in development mode
- [ ] Test production build
- [ ] Verify no hydration errors

---

## 🎓 Next Steps After Installation

1. **Read the README.md** - Understand which library to use when
2. **Review Example Files** - See practical implementations
3. **Start with AutoAnimate** - Easiest quick win
4. **Expand Framer Motion** - It's already installed!
5. **Build 3D Configurator** - The game-changer feature

---

## 💡 Pro Tips

### Lazy Loading for Performance

```tsx
// For large libraries (3D), use dynamic imports
import dynamic from 'next/dynamic';

const Scene3D = dynamic(
  () => import('@/components/Scene3D'),
  {
    ssr: false,
    loading: () => <LoadingSpinner />
  }
);
```

### Tree Shaking

Import only what you need:
```tsx
// ❌ Bad - imports entire library
import * as THREE from 'three';

// ✅ Good - imports only what's needed
import { Vector3, BoxGeometry } from 'three';
```

### Code Splitting by Route

```tsx
// src/app/configurator/page.tsx - Load 3D only here
import { Canvas } from '@react-three/fiber';

// src/app/products/page.tsx - Skip 3D, use lighter animations
import { motion } from 'framer-motion';
```

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review official documentation:
   - Framer Motion: https://www.framer.com/motion
   - AutoAnimate: https://auto-animate.formkit.com
   - Rive: https://rive.app/docs
   - Lottie: https://lottiefiles.com/docs
   - React Three Fiber: https://docs.pmnd.rs/react-three-fiber
   - Spline: https://docs.spline.design

3. Check the examples in this directory
4. Search GitHub issues for specific libraries

---

**Ready to enhance EZ Cycle Ramp with amazing animations and 3D!** 🚀

Start with AutoAnimate today for instant results, then progressively enhance.
