/**
 * UFE Angle Engine
 *
 * Calculates loading angle and generates warnings.
 * This module is toggleable via configuration.
 *
 * ANGLE RULES:
 * - Calculate angle via: atan(height / usable_bed_length)
 * - Soft warnings only - no hard failures
 * - Warning threshold and max safe angle configurable
 */

import type { AngleCalculation } from '../types';
import { getEngineSettings, getMessage } from '../config';
import { radiansToDegrees, formatAngle } from '../utils';

// =============================================================================
// CONFIGURATION CHECK
// =============================================================================

/**
 * Check if angle calculation is enabled in config
 */
export function isAngleCalculationEnabled(): boolean {
  const settings = getEngineSettings();
  return settings.angleCalculation.enabled;
}

/**
 * Get angle calculation settings
 */
export function getAngleSettings(): {
  enabled: boolean;
  warningThreshold: number;
  maxSafe: number;
} {
  const settings = getEngineSettings();
  return {
    enabled: settings.angleCalculation.enabled,
    warningThreshold: settings.angleCalculation.warningThresholdDegrees,
    maxSafe: settings.angleCalculation.maxSafeDegrees,
  };
}

// =============================================================================
// ANGLE CALCULATION
// =============================================================================

/**
 * Calculate loading angle in degrees
 *
 * @param height - Tailgate height from ground (inches)
 * @param length - Usable bed length or ramp length (inches)
 * @returns Angle in degrees
 */
export function calculateLoadingAngle(height: number, length: number): number {
  if (length <= 0) {
    return 0;
  }

  // Calculate angle using arctangent
  // angle = atan(opposite / adjacent) = atan(height / length)
  const angleRadians = Math.atan(height / length);
  const angleDegrees = radiansToDegrees(angleRadians);

  return angleDegrees;
}

/**
 * Calculate loading angle with additional ramp extension
 *
 * @param height - Tailgate height from ground (inches)
 * @param bedLength - Usable bed length (inches)
 * @param extensionLength - Additional extension length (inches), default 0
 * @returns Angle in degrees
 */
export function calculateAngleWithExtension(
  height: number,
  bedLength: number,
  extensionLength: number = 0
): number {
  const totalLength = bedLength + extensionLength;
  return calculateLoadingAngle(height, totalLength);
}

// =============================================================================
// ANGLE EVALUATION
// =============================================================================

/**
 * Evaluate angle safety and generate warnings
 */
export function evaluateAngleSafety(angleDegrees: number): AngleCalculation {
  const settings = getAngleSettings();

  // Check if enabled
  if (!settings.enabled) {
    return {
      angleDegrees,
      isSafe: true,
      isWarning: false,
    };
  }

  const { warningThreshold, maxSafe } = settings;

  // Below warning threshold - all good
  if (angleDegrees < warningThreshold) {
    return {
      angleDegrees,
      isSafe: true,
      isWarning: false,
    };
  }

  // Above max safe - warning (soft failure only)
  if (angleDegrees > maxSafe) {
    return {
      angleDegrees,
      isSafe: false,
      isWarning: true,
      warningMessage: getMessage('warnings.angleCritical', {
        angle: formatAngle(angleDegrees),
        max: maxSafe,
      }),
    };
  }

  // Between warning threshold and max safe
  return {
    angleDegrees,
    isSafe: true,
    isWarning: true,
    warningMessage: getMessage('warnings.angleHigh', {
      angle: formatAngle(angleDegrees),
      threshold: warningThreshold,
    }),
  };
}

/**
 * Full angle calculation with evaluation
 */
export function calculateAndEvaluateAngle(
  height: number,
  usableBedLength: number
): AngleCalculation {
  // Skip if disabled
  if (!isAngleCalculationEnabled()) {
    return {
      angleDegrees: 0,
      isSafe: true,
      isWarning: false,
    };
  }

  const angleDegrees = calculateLoadingAngle(height, usableBedLength);
  return evaluateAngleSafety(angleDegrees);
}

// =============================================================================
// ANGLE HELPERS
// =============================================================================

/**
 * Get angle classification
 */
export function classifyAngle(
  angleDegrees: number
): 'safe' | 'moderate' | 'steep' | 'critical' {
  const settings = getAngleSettings();

  if (angleDegrees < 15) {
    return 'safe';
  }
  if (angleDegrees < settings.warningThreshold) {
    return 'moderate';
  }
  if (angleDegrees <= settings.maxSafe) {
    return 'steep';
  }
  return 'critical';
}

/**
 * Get angle recommendations
 */
export function getAngleRecommendations(angleDegrees: number): string[] {
  const recommendations: string[] = [];
  const classification = classifyAngle(angleDegrees);

  switch (classification) {
    case 'safe':
      recommendations.push('Loading angle is within safe range');
      break;

    case 'moderate':
      recommendations.push('Loading angle is acceptable');
      recommendations.push('Use standard loading technique');
      break;

    case 'steep':
      recommendations.push('Loading angle is steeper than ideal');
      recommendations.push('Consider using walk-up technique');
      recommendations.push('Maintain steady throttle when loading');
      recommendations.push('Have a spotter assist if possible');
      break;

    case 'critical':
      recommendations.push('Loading angle exceeds recommended maximum');
      recommendations.push('Extra caution required');
      recommendations.push('Consider height extension accessory if not already included');
      recommendations.push('Use walk-up technique with spotter assistance');
      recommendations.push('Alternative: Use lower loading position if available');
      break;
  }

  return recommendations;
}

/**
 * Calculate what height extension would help
 */
export function suggestHeightExtension(
  currentHeight: number,
  usableBedLength: number
): {
  needed: boolean;
  currentAngle: number;
  withExtension?: {
    extensionId: string;
    extensionLength: number;
    newAngle: number;
    improvement: number;
  };
} {
  const currentAngle = calculateLoadingAngle(currentHeight, usableBedLength);
  const settings = getAngleSettings();

  // If angle is already safe, no extension needed
  if (currentAngle < settings.warningThreshold) {
    return {
      needed: false,
      currentAngle,
    };
  }

  // Calculate improvement with hypothetical extensions
  // AC001 extensions add approximately 12-18" depending on model
  const extensionLengths = [
    { id: 'AC001-1', length: 12 },
    { id: 'AC001-2', length: 15 },
    { id: 'AC001-3', length: 18 },
  ];

  for (const ext of extensionLengths) {
    const newAngle = calculateAngleWithExtension(currentHeight, usableBedLength, ext.length);
    if (newAngle < settings.warningThreshold) {
      return {
        needed: true,
        currentAngle,
        withExtension: {
          extensionId: ext.id,
          extensionLength: ext.length,
          newAngle,
          improvement: currentAngle - newAngle,
        },
      };
    }
  }

  // Even with extension, angle may still be high
  const bestExt = extensionLengths[extensionLengths.length - 1];
  const bestNewAngle = calculateAngleWithExtension(
    currentHeight,
    usableBedLength,
    bestExt.length
  );

  return {
    needed: true,
    currentAngle,
    withExtension: {
      extensionId: bestExt.id,
      extensionLength: bestExt.length,
      newAngle: bestNewAngle,
      improvement: currentAngle - bestNewAngle,
    },
  };
}

// =============================================================================
// ANGLE FORMATTING
// =============================================================================

/**
 * Format angle for display with classification
 */
export function formatAngleWithClassification(angleDegrees: number): string {
  const classification = classifyAngle(angleDegrees);
  const formatted = formatAngle(angleDegrees);

  const labels: Record<string, string> = {
    safe: 'Safe',
    moderate: 'Moderate',
    steep: 'Steep',
    critical: 'Critical',
  };

  return `${formatted} (${labels[classification]})`;
}

/**
 * Get angle indicator color for UI
 */
export function getAngleIndicatorColor(
  angleDegrees: number
): 'green' | 'yellow' | 'orange' | 'red' {
  const classification = classifyAngle(angleDegrees);

  switch (classification) {
    case 'safe':
      return 'green';
    case 'moderate':
      return 'yellow';
    case 'steep':
      return 'orange';
    case 'critical':
      return 'red';
    default:
      return 'green';
  }
}
