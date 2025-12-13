# Legacy Configurator Backup

**Created:** December 11, 2024
**Purpose:** Backup of existing configurators before UFE implementation

## Contents

This directory contains complete copies of the configurator components as they existed before the Unified Fitment Engine (UFE) was implemented.

### Components

| File | Description |
|------|-------------|
| `QuickConfiguratorV2.tsx` | Quick Wizard - 5-7 question flow for rapid ramp recommendation |
| `QuickConfiguratorOriginal.tsx` | Original Quick Configurator from marketing |
| `Configurator.tsx` | Advanced/Full Configurator - Multi-step with measurements |
| `ConfiguratorSmooth.tsx` | Smooth variant of the full configurator |
| `ConfiguratorProvider.tsx` | React context provider for configurator state |
| `ConfiguratorSettingsProvider.tsx` | Settings context provider |
| `ConfiguratorHeader.tsx` | Shared header component |
| `Step1VehicleType.tsx` | Step 1 - Vehicle type selection |
| `Step2Measurements.tsx` | Step 2 - Truck measurements input |
| `Step3Motorcycle.tsx` | Step 3 - Motorcycle specifications |
| `Step4Configuration.tsx` | Step 4 - Configuration/accessory selection |
| `Step5Quote.tsx` | Step 5 - Quote summary and checkout |
| `ProgressBar.tsx` | Progress indicator component |
| `ChatWidget.tsx` | Embedded chat support widget |
| `ContactModal.tsx` | Contact form modal |
| `AIValidationMessage.tsx` | AI-powered validation feedback |
| `ConfigurationHistory.tsx` | Saved configuration history |

### Library Files

| File | Description |
|------|-------------|
| `configurator-shared-data.ts` | Wizard sync/shared data utilities |
| `configurator-utils.ts` | Calculation and validation utilities |
| `db-settings.ts` | Database settings loader |
| `types-configurator.ts` | Original configurator types |
| `types-configurator-v2.ts` | V2 configurator types |

## Usage

These files are preserved for:
1. **Reference** - Understanding the original implementation
2. **Comparison** - A/B testing new UFE vs legacy
3. **Rollback** - Emergency fallback if needed

## Access

Legacy wizards can be accessed via:
- `/configure/legacy` - Review menu page
- `/configure/legacy/quick` - Quick Wizard (legacy)
- `/configure/legacy/advanced` - Advanced Wizard (legacy)

## Notes

- These files are NOT actively maintained
- Do not modify - create new components instead
- The UFE replaces the logic in these components while maintaining UI compatibility
