# Session Handoff - UX/UI Improvements

**Date**: 2025-11-30
**Time**: Evening Session
**Previous Commit**: `094cdb2` - feat: Hide chatbot floating button on FAQ page, fix Featured Ramps
**Branch**: main
**Staging URL**: https://staging.ezcycleramp.com
**VPS**: 5.161.187.109 (SSH as root)

---

## What Was Accomplished This Session

### 1. Chatbot UX Improvements
- **High contrast floating button**: Orange (#F78309) with white border, positioned bottom-right
- **Blue header** (#0B5394) with navigation buttons (Save/Download, Print, Close)
- **Guiding prompts**: 4 clickable suggestions appear at start and after each response
- **Voice input**: Web Speech API SpeechRecognition for voice-to-text
- **Text-to-speech**: speechSynthesis for reading bot responses aloud
- **Embedded mode**: For inline rendering on FAQ page

### 2. FAQ Page Created
- New page at `/faq` with embedded chatbot in sidebar
- 5 FAQ categories with accordion-style collapsible items
- Added FAQ link to main navigation header
- Chatbot floating button hidden on FAQ page (uses embedded version)

### 3. Header Logo Improvements
- Reduced logo size: `max-w-[110px] sm:max-w-[140px]` (was 180px)
- Added padding (p-2) around logo

### 4. Scroll-to-Top Button
- New component at `src/components/ui/ScrollToTop.tsx`
- Appears after scrolling 400px down
- Fixed position bottom-left, blue button with white border
- Smooth scroll animation to top

### 5. Hero Slider Enhancements
- Ken Burns zoom effect on images (scale 1.0 → 1.1 over 9s)
- Crossfade transitions between slides (1.5s transition)
- 9-second display time per slide

### 6. Featured Ramps Section Fixed
- Added product images from live ezcycleramp.com
- Fixed 404 errors by correcting product slugs:
  - `/products/aun-250-folding-ramp`
  - `/products/aun-210-standard-ramp`
  - `/products/aun-200-basic-ramp`

---

## Files Created/Modified

### New Files
- `src/app/(marketing)/faq/page.tsx` - FAQ page with embedded chatbot
- `src/components/ui/ScrollToTop.tsx` - Scroll-to-top button component
- `src/components/chat/ChatWidgetWrapper.tsx` - Wrapper to hide floating button on FAQ

### Modified Files
- `src/components/chat/UniversalChatWidget.tsx` - Complete rewrite with new features
- `src/components/layout/Header.tsx` - Added FAQ nav link, reduced logo size
- `src/app/(marketing)/page.tsx` - Hero slider enhancements, Featured Ramps fixes
- `src/app/layout.tsx` - Added ScrollToTop, uses ChatWidgetWrapper

---

## Current State

### What's Working ✓
- Site loads at https://staging.ezcycleramp.com
- Chatbot with voice input/output, guiding prompts, save/print buttons
- FAQ page with embedded chatbot and FAQ accordion
- Scroll-to-top button appears on all pages
- Hero slider with Ken Burns effect and crossfade transitions
- Featured Ramps section displays images and links work
- Build passes with 0 errors

### Known Considerations
- Hero slider timing may differ slightly from original ezcycleramp.com
- Voice recognition requires browser permission
- SpeechRecognition uses `any` type due to TypeScript limitations

---

## Technical Details

### Web Speech API Usage
```typescript
// Voice input (SpeechRecognition)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
recognitionRef.current = new SpeechRecognition()
recognitionRef.current.continuous = false
recognitionRef.current.interimResults = false
recognitionRef.current.lang = 'en-US'

// Text-to-speech (speechSynthesis)
const utterance = new SpeechSynthesisUtterance(text)
window.speechSynthesis.speak(utterance)
```

### Conditional Chatbot Rendering
```typescript
// ChatWidgetWrapper.tsx
const pathname = usePathname()
const hideFloatingButton = pathname === '/faq'
return <UniversalChatWidget hideFloatingButton={hideFloatingButton} />
```

---

## Deployment Commands

```bash
# SSH to VPS
ssh root@5.161.187.109

# Auto-deploy should trigger on git push
# Manual deploy if needed:
cd /opt/ezcr-staging
git fetch origin && git reset --hard origin/main
docker build -t ezcr-nextjs-prod:latest --build-arg CACHEBUST=$(date +%s) .
docker stop ezcr-nextjs && docker rm ezcr-nextjs
docker run -d --name ezcr-nextjs --restart unless-stopped --network coolify \
  -p 3001:3000 -e NODE_ENV=production -e PORT=3000 -e HOSTNAME=0.0.0.0 \
  --env-file /opt/ezcr-staging/.env.production ezcr-nextjs-prod:latest
```

---

## Next Actions

### 1. Further UX/UI Improvements
- Review overall design consistency
- Mobile responsiveness testing
- Product card layouts
- Consider adjusting hero slider timing to better match ezcycleramp.com

### 2. Chatbot Enhancements
- Improve voice recognition accuracy
- Add more guiding prompts based on user feedback
- Consider storing chat history in localStorage

### 3. Content Updates
- Add more FAQ items as needed
- Update product descriptions/images

---

## How to Resume After /clear

```bash
# Quick resume
/resume

# Check staging site
curl -s -o /dev/null -w '%{http_code}' https://staging.ezcycleramp.com

# Build locally
npm run build

# Test FAQ page
# Visit: https://staging.ezcycleramp.com/faq
```

---

**Session Status**: COMPLETE
**Build Status**: Passing
**Deploy Status**: Pushed to main, auto-deploying via Coolify
**Next Session**: Continue UX/UI improvements, testing chatbot features
