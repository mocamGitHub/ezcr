# EZCR Premium UX Patterns

> **Tier:** Local (Tier 3)
> **Applies To:** ezcr repo only
> **Inherits From:** platform/*, templates/tenant-template
> **Override Policy:** N/A (local)
> **Version:** 1.0.0

## Purpose

Documents UX patterns specific to high-value motorcycle ramp purchases ($2,500-$4,000+). These patterns focus on building trust, reducing purchase anxiety, and providing expert guidance.

## Graduation Assessment

**Could benefit other tenants?** Yes - any high-ticket e-commerce
**Generalization effort:** Low - patterns are mostly design guidelines
**Recommendation:** Promote to tenant-template when second tenant needs it

## Patterns

### 1. Trust Indicators

**Placement:** Above fold, near CTAs, checkout

```tsx
// Trust banner component
<TrustBanner>
  <TrustItem icon={Shield}>Lifetime Warranty</TrustItem>
  <TrustItem icon={Truck}>Free Shipping</TrustItem>
  <TrustItem icon={Phone}>Expert Support</TrustItem>
  <TrustItem icon={Star}>4.9/5 Rating</TrustItem>
</TrustBanner>
```

### 2. Expert Consultation CTAs

**Pattern:** Multiple touchpoints for human help

```tsx
// In configurator results
<div className="mt-8 pt-6 border-t">
  <p className="text-sm text-muted-foreground mb-3">Need help deciding?</p>
  <div className="flex gap-2">
    <Button variant="outline" onClick={() => setShowScheduleModal(true)}>
      <Calendar className="w-4 h-4 mr-2" />
      Schedule a Call
    </Button>
    <Button variant="outline" asChild>
      <a href="tel:800-687-4410">
        <Phone className="w-4 h-4 mr-2" />
        Call Now
      </a>
    </Button>
  </div>
</div>
```

### 3. Progressive Disclosure

**Pattern:** Don't overwhelm - reveal complexity gradually

```
Quick Finder (30 sec) -> Full Configurator (3 min) -> Expert Consultation
     |                         |                          |
 Recommendation            Full Quote               Custom Solution
```

### 4. Comparison Panel

**Pattern:** Side-by-side product comparison

```tsx
<ComparisonTable>
  <ComparisonRow label="Bed Length">
    <span>Standard/Long</span>
    <span>Short/Any</span>
  </ComparisonRow>
  <ComparisonRow label="Tailgate Closes">
    <span>Unloaded only</span>
    <span>Loaded or unloaded</span>
  </ComparisonRow>
  <ComparisonRow label="Price">
    <span>$2,495</span>
    <span>$2,795</span>
  </ComparisonRow>
</ComparisonTable>
```

### 5. Measurement Validation

**Pattern:** AI-assisted input validation

```tsx
// Real-time measurement feedback
<AIValidationMessage
  measurement={bedLength}
  type="bed-length"
  suggestions={["Typical F-150: 67-79 inches", "Measure from bulkhead to tailgate"]}
/>
```

### 6. Visual Feedback

**Pattern:** Animated transitions, progress indicators

```tsx
// Progress bar with percentage
<div className="h-1.5 bg-muted rounded-full overflow-hidden">
  <div
    className="h-full bg-gradient-to-r from-[#F78309] to-amber-400 rounded-full transition-all duration-500"
    style={{ width: `${progress}%` }}
  />
</div>

// Step transitions
<div className={`transition-all duration-300 ${
  isTransitioning ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
}`}>
```

### 7. Brand Colors

```css
/* Primary - Action/CTA */
--ezcr-orange: #F78309;
--ezcr-orange-hover: #e07308;

/* Secondary - Info/Links */
--ezcr-blue: #0B5394;

/* Status */
--success: #22c55e;
--warning: #f59e0b;
--error: #ef4444;
```

### 8. Help Before Commitment

**Pattern:** Offer help before checkout, not after frustration

```tsx
// Before purchase note
<div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
  <div className="flex items-start gap-2">
    <FileText className="w-5 h-5 text-amber-600 mt-0.5" />
    <div>
      <p className="font-medium text-amber-800">Before You Purchase</p>
      <p className="text-xs text-amber-700">
        Exact measurements will be required before finalizing your order
        to ensure perfect fit and compatibility.
      </p>
    </div>
  </div>
</div>
```

## Checklist

For high-value purchase flows:

- [ ] Trust indicators visible above fold
- [ ] Phone number prominently displayed
- [ ] Schedule call option available
- [ ] Progress indicator on multi-step flows
- [ ] Smooth transitions between steps
- [ ] Confirmation before destructive actions
- [ ] Clear pricing with no surprises
- [ ] "Help" accessible at every step
