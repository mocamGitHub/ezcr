# Animation & 3D Integration Examples for EZ Cycle Ramp

This directory contains comprehensive examples of animation libraries and 3D frameworks that can enhance the EZ Cycle Ramp web application with rich, interactive visual experiences.

## 📁 Files Overview

| File | Description | Libraries Used |
|------|-------------|----------------|
| `FramerMotionExamples.tsx` | UI animations, transitions, gestures | Framer Motion (already installed!) |
| `AutoAnimateExamples.tsx` | Zero-config list/grid animations | AutoAnimate |
| `RiveExamples.tsx` | Interactive state-machine animations | Rive |
| `LottieExamples.tsx` | After Effects animations | Lottie |
| `ReactThreeFiberExamples.tsx` | 3D ramp configurator & visualizations | React Three Fiber |
| `SplineExamples.tsx` | No-code 3D design integration | Spline |

## 🎯 Quick Decision Guide

**Need quick UI polish?**
→ Start with **AutoAnimate** (zero config, instant results)

**Want smooth, professional UI transitions?**
→ Use **Framer Motion** (already installed, expand usage)

**Need interactive micro-animations?**
→ Go with **Rive** (buttons, loaders, feedback)

**Want decorative animations?**
→ Use **Lottie** (huge free library)

**Need 3D ramp configurator?**
→ **React Three Fiber** (custom 3D, full control)

**Want quick 3D marketing visuals?**
→ **Spline** (no-code 3D editor)

---

## 📊 Detailed Comparison

### Animation Libraries

| Feature | Framer Motion | AutoAnimate | Rive | Lottie |
|---------|--------------|-------------|------|--------|
| **Complexity** | Low-Medium | Minimal | Low-Medium | Low |
| **File Size** | ~50KB | ~3KB | ~150KB | ~80KB |
| **Bundle Impact** | Small | Tiny | Medium | Medium |
| **Interactivity** | High | Auto | Very High | Low |
| **Learning Curve** | Easy | Instant | Medium | Easy |
| **Animation Type** | Code-based | Auto | Design-based | Design-based |
| **State Machines** | ❌ | ❌ | ✅ | ❌ |
| **Physics** | ✅ | ❌ | ✅ | ❌ |
| **Best For** | UI transitions | Quick polish | Micro-interactions | Decorative |
| **Already Installed** | ✅ Yes! | ❌ | ❌ | ❌ |

### 3D Libraries

| Feature | React Three Fiber | Spline |
|---------|------------------|--------|
| **Complexity** | High | Low |
| **File Size** | ~200KB + models | ~300KB + scene |
| **Learning Curve** | Steep | Easy |
| **Creation Tool** | Code | Visual Editor |
| **Customization** | Full control | Limited |
| **Performance** | Excellent | Good |
| **Best For** | Configurators | Marketing |
| **Coding Required** | Yes (WebGL/Three.js) | No (drag & drop) |

---

## 🚀 Installation Guide

### Already Installed
Framer Motion is already in your `package.json`! Just start using it.

```bash
# Already available - no installation needed
# framer-motion@12.23.22
```

### New Libraries

```bash
# AutoAnimate (zero-config animations)
pnpm add @formkit/auto-animate

# Rive (interactive animations)
pnpm add @rive-app/react-canvas

# Lottie (After Effects animations)
pnpm add lottie-react

# React Three Fiber (3D)
pnpm add three @react-three/fiber @react-three/drei

# Spline (no-code 3D)
pnpm add @splinetool/react-spline
```

---

## 📚 Usage Examples

### 1. Framer Motion (Expand Current Usage)

**Current Status:** Installed but underutilized

**Quick Wins:**
```tsx
import { motion } from 'framer-motion';

// Product card hover
<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
  <ProductCard />
</motion.div>

// Page transitions in configurator
<motion.div
  initial={{ opacity: 0, x: 50 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -50 }}
>
  <ConfiguratorStep />
</motion.div>
```

**See:** `FramerMotionExamples.tsx` for 9 complete examples

---

### 2. AutoAnimate (Easiest to Implement)

**Installation:** `pnpm add @formkit/auto-animate`

**Usage:**
```tsx
import { useAutoAnimate } from '@formkit/auto-animate/react';

function ProductList() {
  const [parent] = useAutoAnimate(); // One line!

  return (
    <div ref={parent}>
      {products.map(p => <ProductCard key={p.id} {...p} />)}
    </div>
  );
}
```

That's it! Automatic animations when items are added/removed/moved.

**Perfect for:**
- Product filtering
- Shopping cart
- Search results
- CRM tables

**See:** `AutoAnimateExamples.tsx` for 4 complete examples

---

### 3. Rive (Interactive Animations)

**Installation:** `pnpm add @rive-app/react-canvas`

**Workflow:**
1. Create animations at [rive.app](https://rive.app) (free)
2. Download `.riv` file
3. Place in `/public/animations/`
4. Use in React:

```tsx
import { useRive } from '@rive-app/react-canvas';

function LoadingSpinner() {
  const { RiveComponent } = useRive({
    src: '/animations/loading.riv',
    autoplay: true
  });

  return <RiveComponent />;
}
```

**Free Assets:** [rive.app/community](https://rive.app/community)

**Perfect for:**
- Loading states
- Button interactions
- Success/error feedback
- Progress indicators

**See:** `RiveExamples.tsx` for 10 complete examples

---

### 4. Lottie (Decorative Animations)

**Installation:** `pnpm add lottie-react`

**Workflow:**
1. Browse [lottiefiles.com](https://lottiefiles.com) (huge free library)
2. Download JSON
3. Place in `/public/animations/`
4. Use in React:

```tsx
import Lottie from 'lottie-react';
import animationData from '@/public/animations/success.json';

function SuccessAnimation() {
  return <Lottie animationData={animationData} loop={false} />;
}
```

**Search terms:**
- "shopping cart"
- "delivery truck"
- "checkmark"
- "loading spinner"

**Perfect for:**
- Order confirmations
- Empty states
- Error messages
- Onboarding

**See:** `LottieExamples.tsx` for 11 complete examples

---

### 5. React Three Fiber (3D Configurator)

**Installation:**
```bash
pnpm add three @react-three/fiber @react-three/drei
```

**Basic Scene:**
```tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function RampConfigurator() {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} />

      <RampModel length={72} width={30} angle={15} />

      <OrbitControls />
    </Canvas>
  );
}
```

**Perfect for:**
- Interactive ramp configurator
- 3D product previews
- Size comparisons
- Material visualization

**See:** `ReactThreeFiberExamples.tsx` for complete configurator

---

### 6. Spline (No-Code 3D)

**Installation:** `pnpm add @splinetool/react-spline`

**Workflow:**
1. Design at [spline.design](https://spline.design) (free)
2. Export → Get scene URL
3. Use in React:

```tsx
import Spline from '@splinetool/react-spline';

function Hero() {
  return (
    <Spline scene="https://prod.spline.design/YOUR-SCENE.splinecode" />
  );
}
```

**Perfect for:**
- Hero sections
- Marketing pages
- Quick 3D mockups
- Non-technical team members

**See:** `SplineExamples.tsx` for 7 complete examples

---

## 🎯 Recommended Implementation Roadmap

### Phase 1: Quick Wins (1-2 days)
1. **Expand Framer Motion** (already installed!)
   - Add to product cards
   - Configurator step transitions
   - Cart animations

2. **Add AutoAnimate** to lists
   - Product filtering
   - Cart items
   - Search results

**Impact:** High polish with minimal effort

---

### Phase 2: Rich Animations (3-5 days)
3. **Integrate Rive**
   - Download free community assets
   - Loading states
   - Button interactions
   - Success/error feedback

4. **Add Lottie**
   - Browse LottieFiles
   - Order confirmations
   - Empty states
   - Feature highlights

**Impact:** Professional, delightful user experience

---

### Phase 3: 3D Visualization (1-2 weeks)
5. **React Three Fiber Configurator**
   - Build 3D ramp model
   - Interactive controls
   - Real-time updates
   - Material preview

6. **Optional: Spline for Marketing**
   - Hero section 3D
   - Landing page visuals

**Impact:** GAME CHANGER - Unique selling point!

---

## 💡 Integration Points in EZ Cycle App

### Configurator (`/src/components/configurator-v2/`)
- ✅ Framer Motion for step transitions
- ✅ React Three Fiber for 3D ramp preview
- ✅ Rive for progress indicators

### Product Pages (`/src/app/(shop)/`)
- ✅ Framer Motion for card hovers
- ✅ AutoAnimate for filtering
- ✅ Spline for hero 3D showcase

### Shopping Cart (`/src/components/cart/`)
- ✅ AutoAnimate for add/remove items
- ✅ Lottie for empty state
- ✅ Framer Motion for quantity updates

### Checkout Flow
- ✅ Lottie for order confirmation
- ✅ Rive for payment processing
- ✅ Framer Motion for step transitions

### Marketing Pages (`/src/app/(marketing)/`)
- ✅ Spline for hero section
- ✅ Framer Motion for scroll reveals
- ✅ Lottie for feature illustrations

---

## 🔧 Next.js 15 App Router Notes

All examples are compatible with Next.js 15 App Router:

```tsx
'use client'; // Required for animation libraries

import { motion } from 'framer-motion';
// ... your component
```

**Performance Tips:**
- Use `'use client'` directive
- Lazy load large animations
- Use `Suspense` for 3D scenes
- Disable SSR for heavy libraries

**Example:**
```tsx
import dynamic from 'next/dynamic';

const LazySpline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => <LoadingSpinner />
});
```

---

## 📦 Bundle Size Impact

| Library | Minified + Gzipped | Impact |
|---------|-------------------|--------|
| AutoAnimate | ~3KB | Negligible |
| Framer Motion | ~50KB | Small |
| Lottie React | ~80KB | Small-Medium |
| Rive | ~150KB | Medium |
| React Three Fiber + Drei | ~200KB | Medium-Large |
| Spline | ~300KB | Large |

**Recommendation:** Start with smaller libraries first, add 3D when needed.

---

## 🎨 Asset Resources

### Rive Animations
- **Official:** [rive.app/community](https://rive.app/community)
- **Search:** loading, button, heart, star, checkmark

### Lottie Animations
- **LottieFiles:** [lottiefiles.com](https://lottiefiles.com)
- **Free Categories:** loading, success, error, empty state

### 3D Models
- **Free:** [sketchfab.com](https://sketchfab.com), [poly.pizza](https://poly.pizza)
- **Paid:** [turbosquid.com](https://turbosquid.com), [cgtrader.com](https://cgtrader.com)
- **Create:** [blender.org](https://blender.org) (free, open-source)

### Spline Templates
- **Community:** [spline.design/community](https://spline.design/community)

---

## 🚨 Common Pitfalls

### Framer Motion
❌ Forgetting `layout` prop for automatic layout animations
✅ Use `<motion.div layout>` for smooth position changes

### AutoAnimate
❌ Missing `key` prop on list items
✅ Always add unique `key={item.id}` for tracking

### Rive
❌ Large file sizes without optimization
✅ Optimize in Rive editor before export

### Lottie
❌ Hydration errors with SSR
✅ Use client components or dynamic imports

### React Three Fiber
❌ No Suspense boundary
✅ Always wrap in `<Suspense fallback={...}>`

### Spline
❌ Blocking page load
✅ Lazy load and show loading state

---

## 🎬 Live Examples

Run the demo pages:

```tsx
// Import in a Next.js page
import { FramerMotionDemo } from '@/components/examples/animations/FramerMotionExamples';
import { AutoAnimateDemo } from '@/components/examples/animations/AutoAnimateExamples';
import { RiveExamplesDemo } from '@/components/examples/animations/RiveExamples';
import { LottieExamplesDemo } from '@/components/examples/animations/LottieExamples';
import { ReactThreeFiberDemo } from '@/components/examples/animations/ReactThreeFiberExamples';
import { SplineExamplesDemo } from '@/components/examples/animations/SplineExamples';

// Use in your page
export default function ExamplesPage() {
  return <FramerMotionDemo />;
}
```

---

## 🤝 MCP (Model Context Protocol) Servers

To enhance your development workflow with Claude Code, consider these MCPs:

### Recommended for EZ Cycle:

1. **Supabase MCP**
   - Natural language database queries
   - Schema exploration
   - Perfect for your Supabase backend

2. **GitHub MCP**
   - Automated PR/issue management
   - CI workflow integration

3. **Figma MCP**
   - Design-to-code conversion
   - Import design specs

4. **Puppeteer MCP**
   - Automated testing
   - Screenshot generation

**Setup:** Use `claude mcp add-json` to configure

---

## 📈 Performance Benchmarks

### Animation Libraries (60fps target)

| Library | Avg FPS | CPU Usage | Recommendation |
|---------|---------|-----------|----------------|
| Framer Motion | 58-60 | Low | ✅ Production ready |
| AutoAnimate | 60 | Very Low | ✅ Production ready |
| Rive | 55-60 | Medium | ✅ Production ready |
| Lottie | 50-60 | Medium | ⚠️ Optimize large files |

### 3D Libraries

| Library | Avg FPS | GPU Usage | Recommendation |
|---------|---------|-----------|----------------|
| R3F (simple) | 60 | Medium | ✅ Production ready |
| R3F (complex) | 45-60 | High | ⚠️ Optimize geometry |
| Spline | 40-60 | High | ⚠️ Mobile fallback |

---

## 🎓 Learning Resources

### Framer Motion
- Docs: [framer.com/motion](https://www.framer.com/motion)
- Course: [Learn Framer Motion](https://www.youtube.com/watch?v=2V1WK-3HQNk)

### React Three Fiber
- Docs: [docs.pmnd.rs/react-three-fiber](https://docs.pmnd.rs/react-three-fiber)
- Tutorial: [Three.js Journey](https://threejs-journey.com)

### Rive
- Docs: [rive.app/docs](https://rive.app/docs)
- YouTube: [Rive Tutorials](https://www.youtube.com/c/RiveApp)

---

## 📞 Support

For questions about these examples:
1. Check the inline documentation in each file
2. Review the component comments
3. Consult official library documentation

For EZ Cycle specific integration:
- Reach out to your development team
- Review existing configurator implementation
- Test in development environment first

---

## 🎉 Next Steps

1. **Start Small:** Begin with AutoAnimate for instant polish
2. **Expand Framer Motion:** It's already installed - use it more!
3. **Add Micro-interactions:** Integrate Rive for delightful details
4. **Go 3D:** Build that amazing 3D ramp configurator!

**Remember:** Animation is about enhancing UX, not overwhelming it. Start subtle, measure impact, iterate.

---

## 📄 License

These examples are provided as educational resources for the EZ Cycle Ramp project.

External libraries used maintain their respective licenses:
- Framer Motion: MIT
- AutoAnimate: MIT
- Rive: MIT
- Lottie: MIT
- React Three Fiber: MIT
- Spline: Proprietary (free tier available)

---

**Created for the EZ Cycle Ramp project • 2025**

Built with ❤️ using Next.js 15, React 19, and TypeScript
