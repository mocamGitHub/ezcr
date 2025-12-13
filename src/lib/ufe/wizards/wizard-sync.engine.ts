/**
 * UFE Wizard Sync Engine
 *
 * Bidirectional data synchronization between Quick and Advanced wizards.
 * Stores sync data in localStorage with TTL.
 */

import type {
  QuickWizardInput,
  AdvancedWizardInput,
  TruckMeasurements,
  BedCategory,
  BedCategoryAnswer,
  RampModelId,
  WizardSyncData,
} from '../types';
import { categorizeBedLength, estimateBedLengthFromCategory } from '../engines';

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEY = 'ezcr_ufe_wizard_sync';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// =============================================================================
// STORAGE OPERATIONS
// =============================================================================

/**
 * Save wizard sync data to localStorage
 */
export function saveWizardSyncData(data: Omit<WizardSyncData, 'timestamp' | 'expiresAt'>): void {
  if (typeof window === 'undefined') return;

  try {
    const now = Date.now();
    const syncData: WizardSyncData = {
      ...data,
      timestamp: now,
      expiresAt: now + TTL_MS,
    };

    // Merge with existing data
    const existing = getWizardSyncData();
    if (existing) {
      // Keep data from both sources, newer data takes precedence
      const merged: WizardSyncData = {
        source: data.source,
        timestamp: now,
        expiresAt: now + TTL_MS,
        quickWizardData: {
          ...existing.quickWizardData,
          ...data.quickWizardData,
        },
        advancedWizardData: {
          ...existing.advancedWizardData,
          ...data.advancedWizardData,
        },
        recommendation: data.recommendation ?? existing.recommendation,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(syncData));
    }
  } catch (error) {
    console.error('Failed to save wizard sync data:', error);
  }
}

/**
 * Get wizard sync data from localStorage
 */
export function getWizardSyncData(): WizardSyncData | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored) as WizardSyncData;

    // Check expiry
    if (data.expiresAt && Date.now() > data.expiresAt) {
      clearWizardSyncData();
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to get wizard sync data:', error);
    return null;
  }
}

/**
 * Clear wizard sync data from localStorage
 */
export function clearWizardSyncData(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear wizard sync data:', error);
  }
}

/**
 * Check if sync data exists and is not expired
 */
export function hasSyncData(): boolean {
  const data = getWizardSyncData();
  return data !== null;
}

/**
 * Get time until sync data expires
 */
export function getTimeUntilExpiry(): number | null {
  const data = getWizardSyncData();
  if (!data?.expiresAt) return null;
  return Math.max(0, data.expiresAt - Date.now());
}

// =============================================================================
// QUICK → ADVANCED MAPPING
// =============================================================================

/**
 * Map Quick Wizard data to Advanced Wizard hints
 */
export function mapQuickToAdvanced(
  quickData: Partial<QuickWizardInput>
): Partial<AdvancedWizardInput> {
  const result: Partial<AdvancedWizardInput> = {};

  // Map tonneau data
  if (quickData.hasTonneau !== undefined) {
    // Build partial truck measurements
    const truck: Partial<TruckMeasurements> = {
      hasTonneau: quickData.hasTonneau,
    };

    if (quickData.tonneauType) {
      truck.tonneauType = quickData.tonneauType;
    }
    if (quickData.rollDirection) {
      truck.rollDirection = quickData.rollDirection;
    }

    result.truck = truck as TruckMeasurements;
  }

  // Map tailgate requirements
  if (quickData.tailgateMustClose !== undefined) {
    result.tailgateMustClose = quickData.tailgateMustClose;
  }
  if (quickData.motorcycleLoadedWhenClosed !== undefined) {
    result.motorcycleLoadedWhenClosed = quickData.motorcycleLoadedWhenClosed;
  }

  return result;
}

/**
 * Get bed length hints from Quick Wizard category
 */
export function getBedLengthHints(
  bedLength: BedCategoryAnswer
): {
  estimatedRange: { min: number; max: number } | null;
  suggestedMidpoint: number | null;
  hint: string;
} {
  if (bedLength === 'unsure') {
    return {
      estimatedRange: null,
      suggestedMidpoint: null,
      hint: 'Please measure your bed length accurately',
    };
  }

  const range = estimateBedLengthFromCategory(bedLength);

  if (!range) {
    return {
      estimatedRange: null,
      suggestedMidpoint: null,
      hint: 'Please measure your bed length accurately',
    };
  }

  // Calculate midpoint (cap max at reasonable value)
  const effectiveMax = Math.min(range.max, 120);
  const midpoint = Math.round((range.min + effectiveMax) / 2);

  const hints: Record<BedCategory, string> = {
    short: `Based on your selection, bed length is typically ${range.min}-${Math.min(range.max, 72)}"`,
    standard: `Based on your selection, bed length is typically ${range.min}-${Math.min(range.max, 96)}"`,
    long: `Based on your selection, bed length is typically ${range.min}"+`,
  };

  return {
    estimatedRange: range,
    suggestedMidpoint: midpoint,
    hint: hints[bedLength],
  };
}

// =============================================================================
// ADVANCED → QUICK MAPPING (Backfill)
// =============================================================================

/**
 * Map Advanced Wizard data back to Quick Wizard format
 */
export function mapAdvancedToQuick(
  advancedData: Partial<AdvancedWizardInput>
): Partial<QuickWizardInput> {
  const result: Partial<QuickWizardInput> = {};

  // Categorize bed length from exact measurement
  if (advancedData.truck?.bedLengthClosed) {
    result.bedLength = categorizeBedLength(advancedData.truck.bedLengthClosed);
  }

  // Map tonneau data
  if (advancedData.truck?.hasTonneau !== undefined) {
    result.hasTonneau = advancedData.truck.hasTonneau;
  }
  if (advancedData.truck?.tonneauType) {
    result.tonneauType = advancedData.truck.tonneauType;
  }
  if (advancedData.truck?.rollDirection) {
    result.rollDirection = advancedData.truck.rollDirection;
  }

  // Map tailgate requirements
  if (advancedData.tailgateMustClose !== undefined) {
    result.tailgateMustClose = advancedData.tailgateMustClose;
  }
  if (advancedData.motorcycleLoadedWhenClosed !== undefined) {
    result.motorcycleLoadedWhenClosed = advancedData.motorcycleLoadedWhenClosed;
  }

  return result;
}

// =============================================================================
// SYNC STATUS HELPERS
// =============================================================================

export interface SyncStatus {
  hasSyncData: boolean;
  source: 'quick' | 'advanced' | null;
  recommendation: RampModelId | null;
  age: number; // milliseconds since sync
  isStale: boolean; // older than 1 hour
}

/**
 * Get current sync status
 */
export function getSyncStatus(): SyncStatus {
  const data = getWizardSyncData();

  if (!data) {
    return {
      hasSyncData: false,
      source: null,
      recommendation: null,
      age: 0,
      isStale: true,
    };
  }

  const age = Date.now() - data.timestamp;
  const oneHour = 60 * 60 * 1000;

  return {
    hasSyncData: true,
    source: data.source,
    recommendation: data.recommendation ?? null,
    age,
    isStale: age > oneHour,
  };
}

/**
 * Get message about pre-populated data
 */
export function getSyncMessage(): string | null {
  const status = getSyncStatus();

  if (!status.hasSyncData) {
    return null;
  }

  if (status.source === 'quick') {
    return "We've pre-filled some information from your Quick Ramp Finder answers.";
  }

  if (status.source === 'advanced') {
    return "We've pre-filled some information from your previous Full Configurator session.";
  }

  return null;
}

// =============================================================================
// CONFLICT RESOLUTION
// =============================================================================

/**
 * Resolve conflicts when both wizards have data
 */
export function resolveConflicts(
  quickData: Partial<QuickWizardInput>,
  advancedData: Partial<AdvancedWizardInput>
): {
  resolved: Partial<AdvancedWizardInput>;
  conflicts: string[];
} {
  const conflicts: string[] = [];
  const resolved: Partial<AdvancedWizardInput> = { ...advancedData };

  // Tonneau conflicts
  if (
    quickData.hasTonneau !== undefined &&
    advancedData.truck?.hasTonneau !== undefined &&
    quickData.hasTonneau !== advancedData.truck.hasTonneau
  ) {
    conflicts.push('Tonneau cover status differs between wizards');
    // Advanced takes precedence (more specific)
  }

  // Tailgate requirement conflicts
  if (
    quickData.tailgateMustClose !== undefined &&
    advancedData.tailgateMustClose !== undefined &&
    quickData.tailgateMustClose !== advancedData.tailgateMustClose
  ) {
    conflicts.push('Tailgate requirement differs between wizards');
    // Advanced takes precedence
  }

  // Bed length vs category conflict
  if (quickData.bedLength && advancedData.truck?.bedLengthClosed) {
    const derivedCategory = categorizeBedLength(advancedData.truck.bedLengthClosed);
    if (quickData.bedLength !== 'unsure' && quickData.bedLength !== derivedCategory) {
      conflicts.push(
        `Quick Wizard selected "${quickData.bedLength}" bed, but measurements indicate "${derivedCategory}"`
      );
    }
  }

  return { resolved, conflicts };
}

// =============================================================================
// EXPORT FOR LEGACY COMPATIBILITY
// =============================================================================

export { WizardSyncData };
