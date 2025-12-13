/**
 * UFE Wizards - Barrel Export
 */

// Quick Wizard Controller
export {
  // State management
  createInitialState as createQuickWizardState,
  buildQuestionFlow,
  getCurrentQuestion,
  getProgress as getQuickWizardProgress,
  // State transitions
  processAnswer,
  goBack as goBackQuickWizard,
  resetWizard as resetQuickWizard,
  // Evaluation
  evaluateQuickWizard,
  // Utilities
  shouldShowQuestion,
  getRecommendationSummary,
  // Question definitions
  QUESTIONS,
} from './quick-wizard.controller';
export type { QuickWizardState } from './quick-wizard.controller';

// Advanced Wizard Controller
export {
  // Constants
  WIZARD_STEPS,
  // State management
  createInitialState as createAdvancedWizardState,
  getStepIndex,
  canProceed,
  // Navigation
  nextStep,
  previousStep,
  goToStep,
  // Field updates
  setVehicleType,
  setTruckField,
  setMotorcycleField,
  setTailgateRequirements,
  setUnitSystem,
  // Validation
  validateStep,
  validateAllSteps,
  // Evaluation
  buildInput,
  evaluateAndComplete,
  buildQuote,
  // Utilities
  getProgress as getAdvancedWizardProgress,
  getStepTitle,
  getStepDescription,
  resetWizard as resetAdvancedWizard,
  hasChanges,
} from './advanced-wizard.controller';
export type { AdvancedWizardState, WizardStep } from './advanced-wizard.controller';

// Wizard Sync Engine
export {
  // Storage operations
  saveWizardSyncData,
  getWizardSyncData,
  clearWizardSyncData,
  hasSyncData,
  getTimeUntilExpiry,
  // Quick → Advanced mapping
  mapQuickToAdvanced,
  getBedLengthHints,
  // Advanced → Quick mapping
  mapAdvancedToQuick,
  // Sync status
  getSyncStatus,
  getSyncMessage,
  // Conflict resolution
  resolveConflicts,
} from './wizard-sync.engine';
export type { SyncStatus } from './wizard-sync.engine';
