# EZCR Configurator Patterns

> **Tier:** Local (Tier 3)
> **Applies To:** ezcr repo only
> **Inherits From:** platform/*, templates/tenant-template
> **Override Policy:** N/A (local)
> **Version:** 1.0.0

## Purpose

Documents the Unified Fitment Engine (UFE) and wizard-based configurator patterns specific to EZCR motorcycle ramp sales.

## Inheritance

**Inherits From:**
- platform/supabase-patterns
- platform/security-standards
- platform/api-design
- templates/tenant-template

**Extends:** E-commerce checkout with pre-purchase configuration

## Graduation Assessment

**Could benefit other tenants?** Yes - any product requiring configuration
**Generalization effort:** Medium - would need to abstract ramp-specific logic
**Recommendation:** Keep local until second tenant needs similar functionality

## Patterns

### 1. Unified Fitment Engine (UFE)

**Location:** `src/lib/ufe/`

**Architecture:**

```
src/lib/ufe/
├── types.ts              # All TypeScript types
├── config/
│   └── index.ts          # Ramp configs, accessory configs, settings
├── engines/
│   ├── bed-length.engine.ts    # Bed category determination
│   ├── tailgate.engine.ts      # Tailgate compatibility
│   ├── ramp-selector.engine.ts # Ramp recommendation
│   ├── accessory.engine.ts     # Required accessories
│   └── angle.engine.ts         # Loading angle calculation
├── wizards/
│   ├── quick-wizard.controller.ts    # Categorical questions
│   ├── advanced-wizard.controller.ts # Precise measurements
│   └── wizard-sync.engine.ts         # Sync between wizards
├── hooks/
│   ├── useQuickWizard.ts
│   └── useAdvancedWizard.ts
└── utils/
    ├── validators.ts
    └── converters.ts
```

### 2. Type Definitions

```typescript
// Core identifiers
export type RampModelId = 'AUN210' | 'AUN250'
export type AccessoryId = 'AC004' | '4-BEAM' | 'AC001-1' | 'AC001-2' | 'AC001-3' | 'AC012'
export type BedCategory = 'short' | 'standard' | 'long'

// Quick Wizard Input
export interface QuickWizardInput {
  bedLength: BedCategory | 'unsure'
  hasTonneau: boolean
  tonneauType?: TonneauType
  rollDirection?: RollDirection
  tailgateMustClose: boolean
  motorcycleLoadedWhenClosed?: boolean
}

// Advanced Wizard Input
export interface AdvancedWizardInput {
  truck: TruckMeasurements
  motorcycle: MotorcycleMeasurements
  tailgateMustClose: boolean
  unitSystem: UnitSystem
}

// Result
export interface UFEResult {
  success: boolean
  failure?: UFEFailure
  primaryRecommendation?: RampRecommendation
  alternativeRecommendation?: RampRecommendation
  calculatedValues: CalculatedValues
  tonneauNotes?: string[]
  angleWarning?: string
  timestamp: string
  inputHash: string
}
```

### 3. Quick Wizard Flow

**Component:** `src/components/configurator-v2/QuickConfiguratorV2.tsx`

```typescript
// Question flow with conditional branching
const BASE_QUESTIONS = [
  { id: 'bedLength', question: "What's your truck bed length?" },
  { id: 'hasTonneau', question: "Does your truck have a tonneau cover?" },
]

// Conditional questions
if (answers.hasTonneau === 'yes') {
  questions.push(TONNEAU_TYPE_QUESTION)
  if (answers.tonneauType?.includes('roll-up')) {
    questions.push(ROLL_DIRECTION_QUESTION)
  }
}

questions.push(...REMAINING_QUESTIONS)  // bikeWeight, tailgateRequired
```

### 4. Recommendation Logic

```typescript
function calculateRecommendation(answers: Record<string, string>): Result {
  // Hard fail: weight exceeds capacity
  if (answers.bikeWeight === 'over') {
    return { recommendation: 'custom', message: 'Contact us for custom solutions' }
  }

  // Recommend AUN250 for:
  // - Short beds
  // - Tailgate must close
  // - Unsure about measurements
  // - Roll-up cover reduces bed space
  const needsAUN250 =
    answers.bedLength === 'short' ||
    answers.tailgateRequired === 'yes' ||
    answers.bedLength === 'unsure' ||
    (answers.rollDirection === 'into-bed' && answers.bedLength === 'short')

  if (needsAUN250) {
    return { recommendation: 'AUN250', price: 2795 }
  }

  return {
    recommendation: 'AUN200',
    price: 2495,
    alternateOption: { model: 'AUN 250', reason: 'If you want tailgate compatibility' }
  }
}
```

### 5. Two-Tier Configurator Design

| Feature | Quick Ramp Finder | Full Configurator |
|---------|-------------------|-------------------|
| Time | < 1 minute | 3-5 minutes |
| Input | Categorical choices | Precise measurements |
| Output | Ramp recommendation | Full quote + accessories |
| Use case | Initial research | Pre-purchase validation |

### 6. State Management

```typescript
// Wizard state with React hooks
const [answers, setAnswers] = useState<Record<string, string>>({})
const [step, setStep] = useState(0)
const [result, setResult] = useState<Result | null>(null)

// Dynamic question flow
const questions = buildQuestionFlow(answers)
const currentQuestion = questions[step]
const isComplete = step >= questions.length
const progress = (step / questions.length) * 100
```

## Testing

```bash
# Run UFE tests
npm run test:ufe

# Test files
src/lib/ufe/__tests__/
├── setup.ts
├── fixtures.ts
├── bed-length.engine.test.ts
├── tailgate.engine.test.ts
├── accessory.engine.test.ts
├── ramp-selector.engine.test.ts
└── integration.test.ts
```

## Checklist

Before modifying configurator:

- [ ] Types updated in `src/lib/ufe/types.ts`
- [ ] Config changes in `src/lib/ufe/config/`
- [ ] Engine tests pass
- [ ] Quick wizard flow tested
- [ ] Advanced wizard sync works
- [ ] Price calculations verified
