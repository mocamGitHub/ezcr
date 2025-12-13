/**
 * UFE Output Builder
 *
 * Formats UFE results into user-friendly output messages and structured data.
 */

import type {
  UFEResult,
  RampRecommendation,
  AccessoryRequirement,
  QuoteBreakdown,
  CalculatedValues,
  RampModelId,
} from '../types';
import { getMessage, getRampModel } from '../config';
import { formatCurrency, formatLength, formatAngle, formatPercent } from './converters';

// =============================================================================
// MESSAGE BUILDERS
// =============================================================================

/**
 * Build primary recommendation message
 */
export function buildRecommendationMessage(result: UFEResult): string {
  if (!result.success) {
    return result.failure?.message ?? 'Unable to determine a recommendation.';
  }

  const rec = result.primaryRecommendation;
  if (!rec) {
    return 'No recommendation available.';
  }

  const baseMessage = getMessage(`recommendations.${rec.rampId}.primary`);
  return baseMessage;
}

/**
 * Build detailed recommendation with reasons
 */
export function buildDetailedRecommendation(rec: RampRecommendation): {
  title: string;
  subtitle: string;
  reasons: string[];
  warnings: string[];
  priceDisplay: string;
} {
  const model = getRampModel(rec.rampId);

  return {
    title: model?.name ?? rec.rampId,
    subtitle:
      rec.type === 'primary'
        ? 'Recommended for your configuration'
        : 'Alternative option',
    reasons: rec.reasons,
    warnings: rec.warnings,
    priceDisplay: formatCurrency(rec.price),
  };
}

/**
 * Build accessory list for display
 */
export function buildAccessoryList(
  accessories: AccessoryRequirement[]
): {
  required: Array<{ name: string; price: string; reason: string }>;
  optional: Array<{ name: string; price: string; reason: string }>;
  requiredTotal: string;
} {
  const required = accessories
    .filter((a) => a.required)
    .map((a) => ({
      name: a.name,
      price: formatCurrency(a.price),
      reason: a.reason,
    }));

  const optional = accessories
    .filter((a) => !a.required)
    .map((a) => ({
      name: a.name,
      price: formatCurrency(a.price),
      reason: a.reason,
    }));

  const requiredTotal = formatCurrency(
    accessories.filter((a) => a.required).reduce((sum, a) => sum + a.price, 0)
  );

  return { required, optional, requiredTotal };
}

/**
 * Build quote breakdown for display
 */
export function buildQuoteDisplay(quote: QuoteBreakdown): {
  lineItems: Array<{ name: string; price: string; required: boolean }>;
  subtotal: string;
  discount: string | null;
  tax: string;
  processingFee: string;
  shipping: string;
  total: string;
  freeShippingMessage: string | null;
} {
  const lineItems = [
    { name: quote.ramp.name, price: formatCurrency(quote.ramp.totalPrice), required: true },
    ...quote.accessories.map((a) => ({
      name: a.name,
      price: formatCurrency(a.totalPrice),
      required: a.required,
    })),
  ];

  return {
    lineItems,
    subtotal: formatCurrency(quote.subtotal),
    discount: quote.discount > 0 ? formatCurrency(quote.discount) : null,
    tax: formatCurrency(quote.tax),
    processingFee: formatCurrency(quote.processingFee),
    shipping: quote.freeShipping ? 'FREE' : formatCurrency(quote.shipping),
    total: formatCurrency(quote.total),
    freeShippingMessage: quote.freeShipping
      ? 'Free shipping on orders over $500!'
      : `Add ${formatCurrency(500 - quote.subtotalAfterDiscount)} more for free shipping`,
  };
}

/**
 * Build calculated values summary for display
 */
export function buildCalculatedValuesSummary(values: CalculatedValues): {
  bedCategory: { label: string; value: string };
  usableBedLength: { label: string; value: string };
  tonneauPenalty: { label: string; value: string } | null;
  loadingAngle: { label: string; value: string; classification: string } | null;
  tailgateCloseStatus: { label: string; value: string; possible: boolean };
} {
  const bedCategoryLabels: Record<string, string> = {
    short: 'Short Bed',
    standard: 'Standard Bed',
    long: 'Long Bed',
  };

  return {
    bedCategory: {
      label: 'Bed Category',
      value: bedCategoryLabels[values.bedCategory] ?? values.bedCategory,
    },
    usableBedLength: {
      label: 'Usable Bed Length',
      value: formatLength(values.usableBedLength),
    },
    tonneauPenalty:
      values.tonneauPenalty > 0
        ? {
            label: 'Tonneau Penalty',
            value: `-${formatLength(values.tonneauPenalty)}`,
          }
        : null,
    loadingAngle: values.loadingAngle
      ? {
          label: 'Loading Angle',
          value: formatAngle(values.loadingAngle),
          classification: classifyAngleForDisplay(values.loadingAngle),
        }
      : null,
    tailgateCloseStatus: {
      label: 'Tailgate Close with Load',
      value: values.tailgateCloseWithLoadPossible ? 'Possible' : 'Not Possible',
      possible: values.tailgateCloseWithLoadPossible,
    },
  };
}

/**
 * Classify angle for display
 */
function classifyAngleForDisplay(angle: number): string {
  if (angle < 15) return 'Excellent';
  if (angle < 20) return 'Good';
  if (angle < 25) return 'Acceptable';
  if (angle < 30) return 'Steep';
  return 'Critical';
}

// =============================================================================
// TONNEAU NOTES BUILDER
// =============================================================================

/**
 * Build formatted tonneau notes
 */
export function buildTonneauNotesDisplay(notes: string[]): {
  hasNotes: boolean;
  title: string;
  notes: string[];
} {
  return {
    hasNotes: notes.length > 0,
    title: 'Tonneau Cover Notes',
    notes,
  };
}

// =============================================================================
// FAILURE MESSAGE BUILDER
// =============================================================================

/**
 * Build failure display
 */
export function buildFailureDisplay(result: UFEResult): {
  title: string;
  message: string;
  details: string | null;
  suggestion: string | null;
  isHardFailure: boolean;
} {
  if (result.success) {
    return {
      title: '',
      message: '',
      details: null,
      suggestion: null,
      isHardFailure: false,
    };
  }

  const failure = result.failure!;

  return {
    title: failure.type === 'hard' ? 'Configuration Not Possible' : 'Warning',
    message: failure.message,
    details: failure.details ?? null,
    suggestion: failure.suggestion ?? null,
    isHardFailure: failure.type === 'hard',
  };
}

// =============================================================================
// COMPARISON BUILDER
// =============================================================================

/**
 * Build comparison data for two ramps
 */
export function buildRampComparison(
  primary: RampRecommendation,
  alternative: RampRecommendation | undefined
): {
  primary: ComparisonItem;
  alternative: ComparisonItem | null;
} {
  const buildItem = (rec: RampRecommendation): ComparisonItem => {
    const model = getRampModel(rec.rampId);
    const accessoryTotal = rec.requiredAccessories.reduce((sum, a) => sum + a.price, 0);

    return {
      id: rec.rampId,
      name: model?.name ?? rec.rampId,
      type: rec.type,
      basePrice: formatCurrency(rec.price),
      accessoriesPrice: formatCurrency(accessoryTotal),
      totalPrice: formatCurrency(rec.totalWithRequired),
      features: model?.features ?? [],
      requiredAccessories: rec.requiredAccessories.map((a) => a.name),
      reasons: rec.reasons,
      warnings: rec.warnings,
    };
  };

  return {
    primary: buildItem(primary),
    alternative: alternative ? buildItem(alternative) : null,
  };
}

interface ComparisonItem {
  id: RampModelId;
  name: string;
  type: string;
  basePrice: string;
  accessoriesPrice: string;
  totalPrice: string;
  features: string[];
  requiredAccessories: string[];
  reasons: string[];
  warnings: string[];
}

// =============================================================================
// SUMMARY BUILDER
// =============================================================================

/**
 * Build complete result summary for display
 */
export function buildResultSummary(result: UFEResult): ResultSummary {
  if (!result.success) {
    return {
      success: false,
      failure: buildFailureDisplay(result),
      recommendation: null,
      alternative: null,
      accessories: null,
      calculatedValues: null,
      tonneauNotes: null,
      angleWarning: result.angleWarning ?? null,
    };
  }

  const rec = result.primaryRecommendation!;
  const allAccessories = [...rec.requiredAccessories, ...rec.optionalAccessories];

  return {
    success: true,
    failure: null,
    recommendation: buildDetailedRecommendation(rec),
    alternative: result.alternativeRecommendation
      ? buildDetailedRecommendation(result.alternativeRecommendation)
      : null,
    accessories: buildAccessoryList(allAccessories),
    calculatedValues: buildCalculatedValuesSummary(result.calculatedValues),
    tonneauNotes: result.tonneauNotes
      ? buildTonneauNotesDisplay(result.tonneauNotes)
      : null,
    angleWarning: result.angleWarning ?? null,
  };
}

interface ResultSummary {
  success: boolean;
  failure: ReturnType<typeof buildFailureDisplay> | null;
  recommendation: ReturnType<typeof buildDetailedRecommendation> | null;
  alternative: ReturnType<typeof buildDetailedRecommendation> | null;
  accessories: ReturnType<typeof buildAccessoryList> | null;
  calculatedValues: ReturnType<typeof buildCalculatedValuesSummary> | null;
  tonneauNotes: ReturnType<typeof buildTonneauNotesDisplay> | null;
  angleWarning: string | null;
}

// =============================================================================
// EMAIL/PRINT FORMAT BUILDER
// =============================================================================

/**
 * Build plain text summary for email or print
 */
export function buildPlainTextSummary(result: UFEResult, quote?: QuoteBreakdown): string {
  const lines: string[] = [];

  lines.push('EZ Cycle Ramp - Configuration Summary');
  lines.push('=====================================');
  lines.push('');

  if (!result.success) {
    lines.push('Status: CONFIGURATION NOT POSSIBLE');
    lines.push('');
    lines.push(result.failure?.message ?? '');
    if (result.failure?.details) {
      lines.push('');
      lines.push(result.failure.details);
    }
    if (result.failure?.suggestion) {
      lines.push('');
      lines.push('Suggestion: ' + result.failure.suggestion);
    }
    return lines.join('\n');
  }

  const rec = result.primaryRecommendation!;
  const model = getRampModel(rec.rampId);

  lines.push('RECOMMENDATION: ' + (model?.name ?? rec.rampId));
  lines.push('Price: ' + formatCurrency(rec.price));
  lines.push('');

  if (rec.requiredAccessories.length > 0) {
    lines.push('Required Accessories:');
    for (const acc of rec.requiredAccessories) {
      lines.push(`  - ${acc.name}: ${formatCurrency(acc.price)}`);
    }
    lines.push('');
  }

  lines.push('Configuration Details:');
  lines.push(`  Bed Category: ${result.calculatedValues.bedCategory}`);
  lines.push(`  Usable Bed Length: ${formatLength(result.calculatedValues.usableBedLength)}`);
  if (result.calculatedValues.loadingAngle) {
    lines.push(`  Loading Angle: ${formatAngle(result.calculatedValues.loadingAngle)}`);
  }
  lines.push('');

  if (quote) {
    lines.push('QUOTE SUMMARY');
    lines.push('-------------');
    lines.push(`Subtotal: ${formatCurrency(quote.subtotal)}`);
    lines.push(`Tax: ${formatCurrency(quote.tax)}`);
    lines.push(`Processing: ${formatCurrency(quote.processingFee)}`);
    lines.push(`Shipping: ${quote.freeShipping ? 'FREE' : formatCurrency(quote.shipping)}`);
    lines.push('');
    lines.push(`TOTAL: ${formatCurrency(quote.total)}`);
  } else {
    lines.push(`TOTAL WITH ACCESSORIES: ${formatCurrency(rec.totalWithRequired)}`);
  }

  lines.push('');
  lines.push('Generated: ' + new Date().toLocaleString());

  return lines.join('\n');
}
