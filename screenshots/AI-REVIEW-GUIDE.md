# EZ Cycle Ramp - AI UX/UI Review Guide

## Screenshots Location
All screenshots are saved in this `screenshots` folder:
- `desktop/` - 1280px viewport screenshots
- `mobile/` - 375px (iPhone SE) viewport screenshots

## Screenshot Inventory

### Desktop (1280px)
| File | Description |
|------|-------------|
| `01-homepage-hero.png` | Homepage above the fold |
| `01-homepage-full.png` | Full homepage with all sections |
| `02-configurator-step1.png` | Configurator Step 1: Vehicle Selection |
| `03-configurator-step2.png` | Configurator Step 2: Measurements |
| `04-configurator-step3.png` | Configurator Step 3: Motorcycle |
| `05-configurator-step4.png` | Configurator Step 4: Configuration |
| `06-configurator-step5.png` | Configurator Step 5: Quote |

### Mobile (375px)
| File | Description |
|------|-------------|
| `01-homepage-hero.png` | Homepage above the fold (mobile) |
| `01-homepage-full.png` | Full homepage (mobile) |
| `02-configurator-step1.png` | Step 1: Vehicle Selection (mobile) |
| `03-configurator-step2.png` | Step 2: Measurements (mobile) |
| `04-configurator-step3.png` | Step 3: Motorcycle (mobile) |
| `05-configurator-step4.png` | Step 4: Configuration (mobile) |
| `06-configurator-step5.png` | Step 5: Quote (mobile) |

---

## How to Use This Guide

1. Upload the screenshots to each AI tool
2. Copy the appropriate prompt below
3. Collect and compare feedback from each AI
4. Use the reversibility strategy to implement changes

---

## PROMPT FOR CLAUDE CODE DESIGN

Upload all screenshots, then use this prompt:

```
I'm reviewing the UX/UI of a motorcycle ramp e-commerce configurator. I've attached screenshots of both desktop (1280px) and mobile (375px) views.

PROJECT: EZ Cycle Ramp - Premium motorcycle loading ramps
TECH STACK: Next.js 15, React 19, Tailwind CSS 4, Radix UI, shadCN/ui
BRAND COLORS: Blue (#0B5394), Orange (#F78309)

Please analyze each section and provide:

1. **HOMEPAGE ANALYSIS**
   - Hero section effectiveness
   - Call-to-action visibility
   - Trust signals placement
   - Mobile responsiveness issues

2. **CONFIGURATOR ANALYSIS** (5-step wizard)
   - Progress bar usability (especially on mobile where labels overlap)
   - Step 1: Vehicle selection card design
   - Step 2: Measurement form usability
   - Step 3: Motorcycle input patterns
   - Step 4: Product selection (many options, scroll-heavy)
   - Step 5: Quote summary and CTA placement

3. **MOBILE-SPECIFIC ISSUES**
   - Touch target sizes (44px minimum recommended)
   - Thumb-zone accessibility
   - Form input usability
   - Navigation patterns

4. **PRIORITY RECOMMENDATIONS**
   For each issue, rate:
   - Severity: Critical / High / Medium / Low
   - Effort: Quick Win / Medium / Large

Please provide specific Tailwind CSS classes or code patterns for fixes.
```

---

## PROMPT FOR GEMINI 3 / GOOGLE AI STUDIO

Upload all screenshots, then use this prompt:

```
You are a UX/UI expert specializing in e-commerce and mobile-first design. I need you to review this motorcycle ramp configurator.

CONTEXT:
- Product: EZ Cycle Ramp (motorcycle loading ramps for trucks/vans/trailers)
- Target Users: Motorcycle owners, often accessing on mobile at dealerships/shows
- Tech: Next.js, Tailwind CSS, Radix UI components
- Business: Veteran-owned, BBB A+ rated, premium product ($800-$2000 range)

SCREENSHOTS PROVIDED:
- Desktop (1280px) and Mobile (375px) views
- Homepage with hero slider and product showcase
- 5-step product configurator

REVIEW EACH AREA:

**A. MOBILE CONFIGURATOR UX (Highest Priority)**
The configurator has these mobile issues to address:
1. Progress bar: 5 steps with text labels that overlap on small screens
2. Step 4 has 6+ product selection categories requiring excessive scrolling
3. Quote summary sidebar doesn't work well as stacked layout

For each, suggest:
- Problem description
- Recommended solution
- Implementation approach

**B. CONVERSION OPTIMIZATION**
- Is the primary CTA (orange button) prominent enough?
- Are trust signals (Veteran Owned, BBB A+) well-placed?
- Is the value proposition clear?
- Any friction points in the purchase flow?

**C. ACCESSIBILITY**
- Color contrast issues?
- Touch target compliance?
- Screen reader considerations?

**D. DESIGN CONSISTENCY**
- Are spacing and typography consistent?
- Do interactive elements have clear states?
- Is the dark theme well-implemented?

Format your response as a prioritized action list with effort estimates.
```

---

## PROMPT FOR NANO BANANA (or other AI tools)

```
Review these e-commerce website screenshots for UX/UI improvements.

PRODUCT: Motorcycle loading ramp configurator
GOALS:
1. Improve mobile usability of the 5-step configurator
2. Increase conversion rates
3. Maintain brand identity (blue #0B5394, orange #F78309)

KEY PAIN POINTS TO ADDRESS:
1. Mobile progress bar is cramped (5 steps don't fit well)
2. Too many product options on Step 4 require scrolling
3. Quote summary on Step 5 needs better mobile layout

Please provide:
- Top 5 critical issues
- Top 5 quick wins
- Specific design recommendations
- Mobile-first solutions

Include before/after suggestions where possible.
```

---

## REVERSIBILITY STRATEGY

### Option 1: Git Branching (Recommended)

Before implementing any changes:

```bash
# Create base branch for review changes
git checkout -b ui-review/base

# For each section, create sub-branches
git checkout -b ui-review/progress-bar
git checkout -b ui-review/step4-layout
git checkout -b ui-review/mobile-quote
git checkout -b ui-review/homepage-cta

# Tag the original state of each component
git tag original/ProgressBar
git tag original/Step4Configuration
git tag original/Step5Quote
```

To revert a specific section:
```bash
git checkout original/ProgressBar -- src/components/configurator-v2/ProgressBar.tsx
```

### Option 2: Feature Flags

Add to your configuration:

```typescript
// src/lib/feature-flags.ts
export const UI_FLAGS = {
  useNewProgressBar: false,
  useNewStep4Layout: false,
  useNewMobileQuote: false,
  useNewHomepageCTA: false,
}
```

Then in components:
```tsx
import { UI_FLAGS } from '@/lib/feature-flags'

export function ProgressBar() {
  if (UI_FLAGS.useNewProgressBar) {
    return <ProgressBarV2 />
  }
  return <ProgressBarOriginal />
}
```

---

## KEY FILES FOR EACH SECTION

When AI tools suggest changes, here are the files to modify:

| Section | Primary File | Related Files |
|---------|-------------|---------------|
| Progress Bar | `src/components/configurator-v2/ProgressBar.tsx` | - |
| Step 1 | `src/components/configurator-v2/Step1VehicleType.tsx` | - |
| Step 2 | `src/components/configurator-v2/Step2Measurements.tsx` | - |
| Step 3 | `src/components/configurator-v2/Step3Motorcycle.tsx` | - |
| Step 4 | `src/components/configurator-v2/Step4Configuration.tsx` | - |
| Step 5 | `src/components/configurator-v2/Step5Quote.tsx` | - |
| Header | `src/components/configurator-v2/ConfiguratorHeader.tsx` | - |
| Homepage Hero | `src/app/(marketing)/page.tsx` | Lines 16-120 |
| Homepage Showcase | `src/app/(marketing)/page.tsx` | Lines 125-185 |
| Global Header | `src/components/layout/Header.tsx` | - |
| Footer | `src/components/layout/Footer.tsx` | - |

---

## KNOWN MOBILE ISSUES TO HIGHLIGHT

When talking to AI tools, emphasize these specific problems visible in screenshots:

1. **Progress Bar Labels**: On mobile (375px), the step labels "Vehicle", "Measurements", "Motorcycle", "Configuration", "Quote" run together with no spacing

2. **Step 1 Form Layout**: Contact info form + vehicle selection creates long scroll on mobile

3. **Measurement Step**: The "How to Measure" images are small on mobile; form validation errors are hard to read

4. **Step 4 Product Grid**: Too many selection cards (Ramp Model, Extensions, Delivery, Services, Boltless Kit, Tiedowns) - requires 3+ screens of scrolling on mobile

5. **Quote Summary**: On mobile, the sticky sidebar unsticks and CTA buttons get buried at the bottom

---

## IMPLEMENTATION CHECKLIST

After receiving AI feedback:

- [ ] Compile all suggestions into single document
- [ ] Identify conflicts between AI recommendations
- [ ] Prioritize by impact vs effort
- [ ] Create git branches for each section
- [ ] Implement one section at a time
- [ ] Test on real mobile devices
- [ ] Get user feedback before finalizing
- [ ] Keep original code accessible for rollback

---

## QUESTIONS TO ASK EACH AI

If you want more specific guidance, ask follow-up questions like:

1. "For the progress bar on mobile, should I use a vertical stepper, collapsible accordion, or horizontal scroll with current step highlighted?"

2. "For Step 4's many product options, would tabs, accordion sections, or a wizard-within-wizard be better for mobile?"

3. "Should the quote summary on mobile use a fixed bottom bar with total + CTA, or a drawer/sheet that pulls up?"

4. "Are there any shadCN/ui components I should leverage for these patterns?"
