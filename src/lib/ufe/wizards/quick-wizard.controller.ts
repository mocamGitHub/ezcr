/**
 * UFE Quick Wizard Controller
 *
 * Manages Quick Wizard state and question flow.
 * 5-7 question branching logic with conditional questions.
 */

import type {
  QuickWizardInput,
  QuickWizardQuestion,
  QuickWizardOption,
  BedCategoryAnswer,
  TonneauType,
  RollDirection,
  UFEResult,
  RampModelId,
} from '../types';
import { selectRampQuickWizard, calculateAndEvaluateAngle } from '../engines';
import { getMessage } from '../config';
import { saveWizardSyncData, WizardSyncData } from './wizard-sync.engine';
import { createInputHash } from '../utils';

// =============================================================================
// QUESTION DEFINITIONS
// =============================================================================

const BED_LENGTH_QUESTION: QuickWizardQuestion = {
  id: 'bedLength',
  question: "What's your truck bed length?",
  helpText: 'Measure inside from bulkhead to tailgate',
  options: [
    { value: 'short', label: 'Short bed', sublabel: "5' - 5.8'" },
    { value: 'standard', label: 'Standard bed', sublabel: "6' - 6.5'" },
    { value: 'long', label: 'Long bed', sublabel: "8'+" },
    { value: 'unsure', label: "I'm not sure" },
  ],
};

const HAS_TONNEAU_QUESTION: QuickWizardQuestion = {
  id: 'hasTonneau',
  question: 'Does your truck have a tonneau cover?',
  helpText: 'Also called a bed cover or truck bed cover',
  options: [
    { value: 'yes', label: 'Yes, I have a tonneau cover', sublabel: 'Any type of bed cover' },
    { value: 'no', label: 'No cover / Open bed', sublabel: 'Nothing covering the bed' },
  ],
};

const TONNEAU_TYPE_QUESTION: QuickWizardQuestion = {
  id: 'tonneauType',
  question: 'What type of tonneau cover do you have?',
  helpText: 'Select the style that best matches your cover',
  options: [
    { value: 'roll-up-soft', label: 'Roll-up (Soft)', sublabel: 'Vinyl/fabric that rolls toward cab' },
    { value: 'roll-up-hard', label: 'Roll-up (Hard)', sublabel: 'Aluminum slats that roll up' },
    { value: 'tri-fold-soft', label: 'Tri-fold (Soft)', sublabel: 'Three fabric panels that fold' },
    { value: 'tri-fold-hard', label: 'Tri-fold (Hard)', sublabel: 'Three rigid panels that fold' },
    { value: 'bi-fold', label: 'Bi-fold', sublabel: 'Two panels that fold in half' },
    { value: 'hinged', label: 'One-piece (Hinged)', sublabel: 'Single panel that lifts up' },
    { value: 'retractable', label: 'Retractable', sublabel: 'Slides into canister at cab' },
    { value: 'other', label: 'Other / Not listed', sublabel: 'Different style' },
  ],
  conditional: {
    dependsOn: 'hasTonneau',
    showWhen: 'yes',
  },
};

const ROLL_DIRECTION_QUESTION: QuickWizardQuestion = {
  id: 'rollDirection',
  question: 'When your cover rolls up, where does it go?',
  helpText: 'This affects how much bed space is available',
  options: [
    {
      value: 'on-top',
      label: 'Rolls ON TOP of the rails',
      sublabel: 'Toward cab, outside the bed - No bed space lost',
    },
    {
      value: 'into-bed',
      label: 'Rolls INTO the bed',
      sublabel: 'Takes up space inside - Reduces usable length ~8-12"',
    },
  ],
  conditional: {
    dependsOn: 'tonneauType',
    showWhen: ['roll-up-soft', 'roll-up-hard'],
  },
};

const TAILGATE_REQUIRED_QUESTION: QuickWizardQuestion = {
  id: 'tailgateRequired',
  question: 'Do you need to close your tailgate with the ramp installed?',
  helpText: 'Important for highway driving and security',
  options: [
    {
      value: 'yes',
      label: 'Yes, tailgate must close',
      sublabel: 'For highway trips, parking security',
    },
    { value: 'no', label: 'No, open tailgate is fine', sublabel: 'Short trips, local use' },
  ],
};

const MOTORCYCLE_LOADED_QUESTION: QuickWizardQuestion = {
  id: 'motorcycleLoadedWhenClosed',
  question: 'When the tailgate needs to close, will the motorcycle be loaded?',
  helpText: 'This determines which ramp options are available',
  options: [
    {
      value: 'yes',
      label: 'Yes, motorcycle will be loaded',
      sublabel: 'Need tailgate to close during transport',
    },
    {
      value: 'no',
      label: 'No, just for storage/parking',
      sublabel: 'Motorcycle unloaded when tailgate closes',
    },
  ],
  conditional: {
    dependsOn: 'tailgateRequired',
    showWhen: 'yes',
  },
};

// =============================================================================
// WIZARD STATE
// =============================================================================

export interface QuickWizardState {
  currentStep: number;
  answers: Partial<QuickWizardInput>;
  questions: QuickWizardQuestion[];
  isComplete: boolean;
  result: UFEResult | null;
}

/**
 * Create initial wizard state
 */
export function createInitialState(): QuickWizardState {
  return {
    currentStep: 0,
    answers: {},
    questions: buildQuestionFlow({}),
    isComplete: false,
    result: null,
  };
}

// =============================================================================
// QUESTION FLOW BUILDER
// =============================================================================

/**
 * Build dynamic question flow based on current answers
 */
export function buildQuestionFlow(
  answers: Partial<QuickWizardInput>
): QuickWizardQuestion[] {
  const questions: QuickWizardQuestion[] = [];

  // Always start with bed length
  questions.push(BED_LENGTH_QUESTION);

  // Always ask about tonneau
  questions.push(HAS_TONNEAU_QUESTION);

  // Tonneau type if has tonneau
  if (answers.hasTonneau === true) {
    questions.push(TONNEAU_TYPE_QUESTION);

    // Roll direction if roll-up type
    if (
      answers.tonneauType === 'roll-up-soft' ||
      answers.tonneauType === 'roll-up-hard'
    ) {
      questions.push(ROLL_DIRECTION_QUESTION);
    }
  }

  // Always ask about tailgate
  questions.push(TAILGATE_REQUIRED_QUESTION);

  // Ask about loaded state if tailgate must close
  if (answers.tailgateMustClose === true) {
    questions.push(MOTORCYCLE_LOADED_QUESTION);
  }

  return questions;
}

/**
 * Get current question
 */
export function getCurrentQuestion(state: QuickWizardState): QuickWizardQuestion | null {
  if (state.currentStep >= state.questions.length) {
    return null;
  }
  return state.questions[state.currentStep];
}

/**
 * Get progress percentage
 */
export function getProgress(state: QuickWizardState): number {
  if (state.questions.length === 0) return 0;
  return Math.min(100, (state.currentStep / state.questions.length) * 100);
}

// =============================================================================
// STATE TRANSITIONS
// =============================================================================

/**
 * Process an answer and return new state
 */
export function processAnswer(
  state: QuickWizardState,
  questionId: string,
  value: string
): QuickWizardState {
  // Update answers based on question type
  const newAnswers = { ...state.answers };

  switch (questionId) {
    case 'bedLength':
      newAnswers.bedLength = value as BedCategoryAnswer;
      break;
    case 'hasTonneau':
      newAnswers.hasTonneau = value === 'yes';
      if (value === 'no') {
        // Clear tonneau-related answers
        delete newAnswers.tonneauType;
        delete newAnswers.rollDirection;
      }
      break;
    case 'tonneauType':
      newAnswers.tonneauType = value as TonneauType;
      if (!value.includes('roll-up')) {
        // Clear roll direction if not roll-up
        delete newAnswers.rollDirection;
      }
      break;
    case 'rollDirection':
      newAnswers.rollDirection = value as RollDirection;
      break;
    case 'tailgateRequired':
      newAnswers.tailgateMustClose = value === 'yes';
      if (value === 'no') {
        // Clear loaded state if tailgate not required
        delete newAnswers.motorcycleLoadedWhenClosed;
      }
      break;
    case 'motorcycleLoadedWhenClosed':
      newAnswers.motorcycleLoadedWhenClosed = value === 'yes';
      break;
  }

  // Rebuild question flow with new answers
  const newQuestions = buildQuestionFlow(newAnswers);

  // Calculate next step
  const currentQuestionIndex = newQuestions.findIndex((q) => q.id === questionId);
  const nextStep = currentQuestionIndex + 1;

  // Check if complete
  const isComplete = nextStep >= newQuestions.length;

  // Calculate result if complete
  let result: UFEResult | null = null;
  if (isComplete) {
    result = evaluateQuickWizard(newAnswers as QuickWizardInput);

    // Save sync data for Advanced Wizard
    saveWizardSyncData({
      source: 'quick',
      quickWizardData: newAnswers,
      recommendation: result.primaryRecommendation?.rampId,
    });
  }

  return {
    currentStep: nextStep,
    answers: newAnswers,
    questions: newQuestions,
    isComplete,
    result,
  };
}

/**
 * Go back one step
 */
export function goBack(state: QuickWizardState): QuickWizardState {
  if (state.currentStep <= 0) {
    return state;
  }

  return {
    ...state,
    currentStep: state.currentStep - 1,
    isComplete: false,
    result: null,
  };
}

/**
 * Reset wizard to initial state
 */
export function resetWizard(): QuickWizardState {
  return createInitialState();
}

// =============================================================================
// EVALUATION
// =============================================================================

/**
 * Evaluate Quick Wizard answers and produce result
 */
export function evaluateQuickWizard(input: QuickWizardInput): UFEResult {
  const selectionResult = selectRampQuickWizard(input);

  // Build tonneau notes
  const tonneauNotes = buildTonneauNotes(input);

  // Create UFE result
  const result: UFEResult = {
    success: selectionResult.success,
    failure: selectionResult.failure,
    primaryRecommendation: selectionResult.primaryRecommendation,
    alternativeRecommendation: selectionResult.alternativeRecommendation,
    calculatedValues: selectionResult.calculatedValues,
    tonneauNotes,
    timestamp: new Date().toISOString(),
    inputHash: createInputHash(input),
  };

  return result;
}

/**
 * Build tonneau-specific notes based on cover type
 */
function buildTonneauNotes(input: QuickWizardInput): string[] {
  const notes: string[] = [];

  if (!input.hasTonneau || input.tonneauType === 'none') {
    return notes;
  }

  // Roll direction notes
  if (input.rollDirection === 'into-bed') {
    notes.push(
      getMessage('warnings.tonneau.rollsIntoBed', { penalty: '8-12' })
    );
  }

  // Type-specific notes
  switch (input.tonneauType) {
    case 'tri-fold-soft':
    case 'tri-fold-hard':
      notes.push(getMessage('warnings.tonneau.triFold'));
      break;
    case 'bi-fold':
      notes.push(getMessage('warnings.tonneau.biFold'));
      break;
    case 'hinged':
      notes.push(getMessage('warnings.tonneau.hinged'));
      break;
    case 'retractable':
      notes.push(getMessage('warnings.tonneau.retractable'));
      break;
    case 'other':
      notes.push(getMessage('warnings.tonneau.other'));
      break;
  }

  return notes;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if a specific question should be shown
 */
export function shouldShowQuestion(
  question: QuickWizardQuestion,
  answers: Partial<QuickWizardInput>
): boolean {
  if (!question.conditional) {
    return true;
  }

  const { dependsOn, showWhen } = question.conditional;
  const dependentValue = answers[dependsOn as keyof QuickWizardInput];

  if (Array.isArray(showWhen)) {
    return showWhen.includes(dependentValue as string);
  }

  return dependentValue === showWhen || dependentValue === (showWhen === 'yes');
}

/**
 * Get recommendation summary for result
 */
export function getRecommendationSummary(result: UFEResult): {
  recommendation: RampModelId | null;
  message: string;
  price: number | null;
  issues: string[];
  notes: string[];
} {
  if (!result.success || !result.primaryRecommendation) {
    return {
      recommendation: null,
      message: result.failure?.message ?? 'Unable to determine recommendation',
      price: null,
      issues: [result.failure?.details ?? ''],
      notes: [],
    };
  }

  const rec = result.primaryRecommendation;

  return {
    recommendation: rec.rampId,
    message:
      rec.rampId === 'AUN210'
        ? 'The AUN210 Standard Ramp is ideal for your configuration.'
        : 'The AUN250 Folding Ramp is perfect for your setup.',
    price: rec.price,
    issues: rec.warnings,
    notes: result.tonneauNotes ?? [],
  };
}

/**
 * Export question definitions for external use
 */
export const QUESTIONS = {
  BED_LENGTH: BED_LENGTH_QUESTION,
  HAS_TONNEAU: HAS_TONNEAU_QUESTION,
  TONNEAU_TYPE: TONNEAU_TYPE_QUESTION,
  ROLL_DIRECTION: ROLL_DIRECTION_QUESTION,
  TAILGATE_REQUIRED: TAILGATE_REQUIRED_QUESTION,
  MOTORCYCLE_LOADED: MOTORCYCLE_LOADED_QUESTION,
};
