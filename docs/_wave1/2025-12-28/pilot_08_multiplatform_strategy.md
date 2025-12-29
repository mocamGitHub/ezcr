# Pilot 8: Web/iOS/Android Multi-Platform Strategy

**Date**: 2025-12-28
**Status**: Complete

---

## Executive Summary

Strategy for expanding EZCR from web-only to iOS and Android. Recommendation: **PWA-first with Capacitor fallback** for native store presence.

---

## Current State

- **Web**: Next.js 15 (App Router) - Production ready
- **Mobile**: None - Web responsive only
- **Native Apps**: None

---

## Options Comparison

### Option 1: Progressive Web App (PWA)

**Approach**: Enhance existing Next.js with PWA capabilities

| Pros | Cons |
|------|------|
| Minimal code changes | No App Store presence |
| Single codebase | Limited native APIs |
| Instant updates | iOS limitations (no push) |
| No app store review | Perceived as "not real app" |
| Works offline | |

**Implementation Effort**: 1-2 weeks

### Option 2: React Native (New Codebase)

**Approach**: Build native apps from scratch using React Native

| Pros | Cons |
|------|------|
| Full native access | Separate codebase |
| Best performance | Longer development |
| App Store presence | Different styling system |
| Push notifications | Double maintenance |

**Implementation Effort**: 8-12 weeks

### Option 3: Capacitor (Wrap Existing Web)

**Approach**: Wrap Next.js app in Capacitor for native deployment

| Pros | Cons |
|------|------|
| Use existing web code | Web-view based |
| Native plugin access | Slightly slower than native |
| Single codebase | Some platform-specific code |
| App Store presence | |
| Push notifications | |

**Implementation Effort**: 2-4 weeks

### Option 4: Tauri (Desktop + Mobile)

**Approach**: Native wrapper using Rust

| Pros | Cons |
|------|------|
| Smallest bundle | Mobile support is new |
| Best security | Smaller ecosystem |
| Desktop support | Less React integration |

**Implementation Effort**: 4-6 weeks

---

## Recommendation: PWA + Capacitor Hybrid

### Phase 1: PWA (Weeks 1-2)
Deploy PWA for immediate mobile improvement

### Phase 2: Capacitor (Weeks 3-4)
Wrap PWA in Capacitor for App Store presence

### Phase 3: Native Features (Weeks 5-8)
Add native plugins for push, camera, etc.

---

## Shared UI Strategy

### Current Stack (Keep)
- **Tailwind CSS** - Mobile-first responsive
- **shadcn/ui** - Accessible components
- **Framer Motion** - Animations

### Mobile Enhancements

```tsx
// Responsive patterns already in use
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Add touch-optimized variants
<Button className="min-h-[44px] min-w-[44px]">
  {/* 44px minimum touch target */}
</Button>

// Safe area handling for notched devices
<div className="pb-safe">
  {/* Content avoids home indicator */}
</div>
```

### Component Adjustments Needed

| Component | Web | Mobile | Change Needed |
|-----------|-----|--------|---------------|
| Navigation | Horizontal | Bottom nav | Add mobile nav |
| Tables | Full width | Card view | Add responsive view |
| Modals | Center | Bottom sheet | Add Vaul drawer |
| Touch targets | Variable | 44px min | Increase sizes |

---

## Auth/Session Approach

### Current (Web)
- Supabase Auth with cookies
- JWT in HTTP-only cookie
- Server-side session validation

### Mobile Strategy

```typescript
// Capacitor secure storage for tokens
import { SecureStoragePlugin } from '@agenthealth/capacitor-secure-storage-plugin';

async function storeSession(session: Session) {
  await SecureStoragePlugin.set({
    key: 'supabase_session',
    value: JSON.stringify(session),
  });
}

async function getSession(): Promise<Session | null> {
  const { value } = await SecureStoragePlugin.get({
    key: 'supabase_session',
  });
  return value ? JSON.parse(value) : null;
}
```

### OAuth Flow (Mobile)
```typescript
// Use in-app browser for OAuth
import { Browser } from '@capacitor/browser';

async function signInWithGoogle() {
  const { data } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'ezcr://auth/callback',
    },
  });
  await Browser.open({ url: data.url });
}
```

---

## Release Sequencing

### Phase 1: PWA Enhancement (Week 1-2)

```
Day 1-2: Add PWA configuration
- next-pwa setup
- Service worker
- Web manifest
- Offline page

Day 3-4: Mobile UX polish
- Touch targets
- Bottom navigation
- Drawer menus
- Gesture handling

Day 5-7: Testing & deployment
- Mobile testing
- Lighthouse audit
- Deploy to production
```

**Deliverables:**
- [ ] next-pwa installed and configured
- [ ] manifest.json with icons
- [ ] Offline fallback page
- [ ] Mobile-optimized navigation

### Phase 2: Capacitor Setup (Week 3-4)

```
Day 1-2: Capacitor initialization
- Install Capacitor
- iOS project setup
- Android project setup
- Configure deep links

Day 3-4: Native plugins
- Secure storage
- Push notifications
- Camera (for receipt scanning)
- App icon & splash

Day 5-7: Build & test
- iOS simulator testing
- Android emulator testing
- Fix platform-specific bugs
```

**Deliverables:**
- [ ] iOS app building
- [ ] Android app building
- [ ] Push notifications working
- [ ] Deep links configured

### Phase 3: App Store Submission (Week 5-6)

```
Day 1-2: Store preparation
- App Store assets
- Play Store assets
- Privacy policy
- App descriptions

Day 3-4: Beta testing
- TestFlight deployment
- Play Store internal testing
- Bug fixes

Day 5-7: Submission
- App Store review
- Play Store review
- Address feedback
```

**Deliverables:**
- [ ] Apps in TestFlight / Internal Testing
- [ ] Store listings complete
- [ ] Apps submitted for review

### Phase 4: Launch & Iterate (Week 7-8)

```
Day 1-3: Launch
- Public release
- Announcement
- Monitor analytics

Day 4-7: Iterate
- User feedback
- Bug fixes
- Performance optimization
```

---

## Technical Implementation

### PWA Configuration

```typescript
// next.config.ts
import withPWA from 'next-pwa';

const config = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})({
  // existing config
});
```

### Web Manifest

```json
// public/manifest.json
{
  "name": "EZ Cycle Ramp",
  "short_name": "EZCR",
  "description": "Motorcycle ramps and accessories",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1e40af",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Capacitor Configuration

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ezcycleramp.app',
  appName: 'EZ Cycle Ramp',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchAutoHide: false,
    },
  },
};

export default config;
```

---

## Resource Requirements

### Development

| Role | PWA | Capacitor | Total |
|------|-----|-----------|-------|
| Frontend Dev | 1 week | 2 weeks | 3 weeks |
| Mobile Dev | - | 1 week | 1 week |
| QA | 0.5 week | 1 week | 1.5 weeks |
| Design | 0.5 week | 0.5 week | 1 week |

### Ongoing Maintenance

| Platform | Effort/Month |
|----------|--------------|
| Web (existing) | Baseline |
| PWA | +2 hours |
| iOS/Android | +4 hours |

---

## Punch List

### P0 - Phase 1 (PWA)
- [ ] Install next-pwa
- [ ] Create manifest.json
- [ ] Add app icons (192, 512)
- [ ] Create offline page
- [ ] Add mobile navigation

### P1 - Phase 2 (Capacitor)
- [ ] Install Capacitor
- [ ] Generate iOS project
- [ ] Generate Android project
- [ ] Configure deep links
- [ ] Add push notifications

### P2 - Phase 3 (App Stores)
- [ ] Create App Store Connect account
- [ ] Create Google Play Console account
- [ ] Prepare store assets
- [ ] Submit for review

---

## Decision Matrix

| Factor | PWA Only | PWA + Capacitor | React Native |
|--------|----------|-----------------|--------------|
| Time to market | Fastest | Fast | Slow |
| Native feel | Good | Great | Best |
| Maintenance | Easiest | Easy | Hard |
| Store presence | No | Yes | Yes |
| Push notifications | Limited | Full | Full |
| Offline support | Yes | Yes | Yes |
| Cost | Low | Medium | High |

**Recommendation**: PWA + Capacitor provides the best balance of speed, functionality, and maintainability for EZCR's needs.
