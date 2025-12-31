'use client'

/**
 * Quick Configurator with UFE Integration
 *
 * This component uses the Unified Fitment Engine for recommendations.
 * It provides the same UI as QuickConfiguratorV2 but uses UFE for business logic.
 */

import React, { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { ConfiguratorHeader } from './ConfiguratorHeader'
import { ConfiguratorWrapper } from './ConfiguratorWrapper'
import { ConfiguratorProvider } from './ConfiguratorProvider'
import { ArrowRight, CheckCircle, Info, Ruler, FileText, Clock, Phone, Calendar, X, AlertTriangle } from 'lucide-react'
import { CallScheduler } from '@/components/contact/CallScheduler'
import { useQuickWizard } from '@/lib/ufe/hooks'
import { formatCurrency, getRampModel, getAccessory } from '@/lib/ufe'
import type { UFEResult, RampRecommendation } from '@/lib/ufe/types'

// =============================================================================
// COMPONENTS
// =============================================================================

interface QuestionCardProps {
  question: {
    id: string;
    question: string;
    helpText?: string;
    options: Array<{
      value: string;
      label: string;
      sublabel?: string;
    }>;
  };
  onAnswer: (value: string) => void;
  onBack?: () => void;
  showTonneauBadge?: boolean;
  selectedOption: string | null;
  isTransitioning: boolean;
}

function QuestionCard({
  question,
  onAnswer,
  onBack,
  showTonneauBadge = false,
  selectedOption,
  isTransitioning,
}: QuestionCardProps) {
  return (
    <div>
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}

      {/* Tonneau indicator */}
      {showTonneauBadge && (
        <div className="mb-4 px-3 py-2 bg-[#F78309]/10 border border-[#F78309]/30 rounded-lg text-[#F78309] text-sm flex items-center gap-2">
          <span>🚛</span>
          <span>Tonneau Cover Configuration</span>
        </div>
      )}

      {/* Question */}
      <h3 className="text-xl text-foreground font-medium mb-2">
        {question.question}
      </h3>
      {question.helpText && (
        <p className="text-muted-foreground text-sm mb-6">{question.helpText}</p>
      )}

      {/* Options */}
      <div className={`space-y-3 ${question.options.length > 4 ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : ''}`}>
        {question.options.map((option) => {
          const isSelected = selectedOption === option.value
          return (
            <button
              key={option.value}
              onClick={() => onAnswer(option.value)}
              disabled={selectedOption !== null}
              className={`w-full p-4 text-left rounded-lg transition-all duration-300 group
                ${isSelected
                  ? 'bg-[#F78309]/20 border-2 border-[#F78309] scale-[1.02]'
                  : 'bg-muted/50 hover:bg-muted border border-border hover:border-[#F78309]/50'
                }
                ${selectedOption && !isSelected ? 'opacity-50' : 'opacity-100'}
              `}
            >
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <span className="text-foreground font-medium block">{option.label}</span>
                  {option.sublabel && (
                    <span className="text-muted-foreground text-sm">{option.sublabel}</span>
                  )}
                </div>
                {isSelected ? (
                  <svg className="w-6 h-6 text-[#F78309]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-muted-foreground group-hover:text-[#F78309] transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface ResultCardProps {
  result: UFEResult;
  answers: Record<string, string>;
  onReset: () => void;
  onScheduleCall: () => void;
}

function ResultCard({ result, answers, onReset, onScheduleCall }: ResultCardProps) {
  const recommendation = result.primaryRecommendation;

  // Handle failure case
  if (!result.success || !recommendation) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 mx-auto mb-6 bg-amber-500/20 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>

        <h3 className="text-2xl font-bold text-foreground mb-2">
          Custom Solution Needed
        </h3>
        <p className="text-muted-foreground mb-6">
          {result.failure?.message || "Based on your requirements, we recommend speaking with our team for a custom solution."}
        </p>

        <Link
          href="/contact"
          className="inline-flex items-center px-8 py-4 bg-[#F78309] hover:bg-[#e07308] text-white font-bold rounded-lg transition-all hover:scale-105"
        >
          Contact Us
          <ArrowRight className="ml-2 w-5 h-5" />
        </Link>

        <button
          onClick={onReset}
          className="block mx-auto mt-6 text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          Start over
        </button>
      </div>
    );
  }

  // Get ramp info
  const rampModel = getRampModel(recommendation.rampId);
  const displayName = rampModel?.name || recommendation.name;
  const productUrl = recommendation.rampId === 'AUN210'
    ? '/products/aun-200-basic-ramp'
    : '/products/aun-250-folding-ramp';

  // Calculate total price with required accessories
  const requiredAccessoriesTotal = recommendation.requiredAccessories
    .reduce((sum, acc) => sum + acc.price, 0);
  const totalPrice = recommendation.price + requiredAccessoriesTotal;

  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-green-500" />
      </div>

      <h3 className="text-2xl font-bold text-foreground mb-2">
        We recommend the {displayName.replace('Ramp', '').trim()}
      </h3>
      <p className="text-muted-foreground mb-4">
        {recommendation.reasons[0] || 'This ramp is perfect for your setup.'}
      </p>

      {/* Tonneau compatibility */}
      {answers.hasTonneau === 'yes' && (
        <div className="mb-4 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-lg inline-block">
          <p className="text-green-600 dark:text-green-400 text-sm font-medium">
            ✓ Compatible with your {answers.tonneauType?.replace(/-/g, ' ')} cover
          </p>
        </div>
      )}

      {/* Tonneau Notes */}
      {result.tonneauNotes && result.tonneauNotes.length > 0 && (
        <div className="mb-6 text-left max-w-md mx-auto">
          <p className="text-muted-foreground text-sm mb-2">Usage notes:</p>
          {result.tonneauNotes.map((note, i) => (
            <p key={i} className="text-[#F78309]/80 text-sm flex items-start gap-2 mb-1">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{note}</span>
            </p>
          ))}
        </div>
      )}

      {/* Warnings */}
      {recommendation.warnings.length > 0 && (
        <div className="mb-6 text-left max-w-md mx-auto">
          {recommendation.warnings.map((warning, i) => (
            <p key={i} className="text-amber-500 text-sm flex items-start gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{warning}</span>
            </p>
          ))}
        </div>
      )}

      {/* Required Accessories */}
      {recommendation.requiredAccessories.length > 0 && (
        <div className="mb-6 text-left max-w-md mx-auto bg-muted/30 rounded-lg p-4">
          <p className="text-foreground font-medium text-sm mb-2">Required Accessories:</p>
          {recommendation.requiredAccessories.map((acc, i) => (
            <div key={i} className="flex justify-between text-sm py-1">
              <span className="text-muted-foreground">{acc.name}</span>
              <span className="text-foreground font-medium">{formatCurrency(acc.price)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Price */}
      <div className="mb-6">
        <span className="text-4xl font-bold text-foreground">{formatCurrency(totalPrice)}</span>
        <span className="text-muted-foreground ml-2">+ free shipping</span>
        {requiredAccessoriesTotal > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            (includes required accessories)
          </p>
        )}
      </div>

      {/* CTA */}
      <Link
        href={productUrl}
        className="inline-flex items-center px-8 py-4 bg-[#F78309] hover:bg-[#e07308] text-white font-bold rounded-lg transition-all hover:scale-105"
      >
        View Product
        <ArrowRight className="ml-2 w-5 h-5" />
      </Link>

      {/* Alternative Recommendation */}
      {result.alternativeRecommendation && (
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-2">Alternative option:</p>
          <p className="text-foreground">
            {result.alternativeRecommendation.name} - {formatCurrency(result.alternativeRecommendation.price)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {result.alternativeRecommendation.reasons[0]}
          </p>
        </div>
      )}

      {/* Help Options */}
      <div className="mt-8 pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground mb-3">Need help deciding?</p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={onScheduleCall}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-[#0B5394] text-[#0B5394] hover:bg-[#0B5394]/10 rounded-lg transition-colors text-sm"
          >
            <Calendar className="w-4 h-4" />
            Schedule a Call
          </button>
          <a
            href="tel:800-687-4410"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-[#F78309] text-[#F78309] hover:bg-[#F78309]/10 rounded-lg transition-colors text-sm"
          >
            <Phone className="w-4 h-4" />
            Call Now
          </a>
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={onReset}
        className="block mx-auto mt-6 text-muted-foreground hover:text-foreground text-sm transition-colors"
      >
        Start over
      </button>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function QuickConfiguratorContent() {
  const {
    currentQuestion,
    progress,
    isComplete,
    result,
    answer,
    goBack,
    reset,
    answers,
    currentStep,
    totalQuestions,
  } = useQuickWizard();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Handle answer with animation
  const handleAnswer = useCallback((questionId: string, value: string) => {
    setSelectedOption(value);

    setTimeout(() => {
      setIsTransitioning(true);

      setTimeout(() => {
        answer(questionId, value);
        setSelectedOption(null);
        setIsTransitioning(false);
      }, 300);
    }, 200);
  }, [answer]);

  // Handle back with animation
  const handleBack = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      goBack();
      setIsTransitioning(false);
    }, 300);
  }, [goBack]);

  // Handle reset with animation
  const handleReset = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      reset();
      setSelectedOption(null);
      setIsTransitioning(false);
    }, 300);
  }, [reset]);

  // Check if we're on a tonneau-related question
  const showTonneauBadge = currentQuestion?.id === 'tonneauType' || currentQuestion?.id === 'rollDirection';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ConfiguratorHeader />

      <main className="flex-1 container mx-auto max-w-[1400px] px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Quick Configurator - Left/Main Column */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border shadow-lg">
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-border/50">
                <h2 className="text-2xl font-bold text-foreground">
                  Quick <span className="text-[#F78309]">Ramp Finder</span>
                </h2>
                <p className="text-muted-foreground mt-1">
                  Answer a few questions to find your perfect ramp
                </p>
              </div>

              {/* Progress bar */}
              <div className="px-6 pt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Step {Math.min(currentStep, totalQuestions)} of {totalQuestions}</span>
                  <span>{Math.round(progress)}% complete</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#F78309] to-amber-400 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div
                  className={`transition-all duration-300 ${isTransitioning ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}
                >
                  {!isComplete && currentQuestion ? (
                    <QuestionCard
                      question={currentQuestion}
                      onAnswer={(value) => handleAnswer(currentQuestion.id, value)}
                      onBack={currentStep > 1 ? handleBack : undefined}
                      showTonneauBadge={showTonneauBadge}
                      selectedOption={selectedOption}
                      isTransitioning={isTransitioning}
                    />
                  ) : isComplete && result ? (
                    <ResultCard
                      result={result}
                      answers={answers}
                      onReset={handleReset}
                      onScheduleCall={() => setShowScheduleModal(true)}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Info Panel - Right Column */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-[#0B5394]" />
                Quick vs Full Configurator
              </h3>

              {/* Quick Configurator */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-[#F78309]" />
                  <span className="font-medium text-foreground">Quick Ramp Finder</span>
                  <span className="text-xs bg-[#F78309]/20 text-[#F78309] px-2 py-0.5 rounded-full">You are here</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1.5 ml-6">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    Get a recommendation in under 1 minute
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    Uses general bed length categories
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    Perfect for initial research
                  </li>
                </ul>
              </div>

              {/* Divider */}
              <div className="h-px bg-border my-4" />

              {/* Full Configurator */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Ruler className="w-4 h-4 text-[#0B5394]" />
                  <span className="font-medium text-foreground">Full Configurator</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1.5 ml-6">
                  <li className="flex items-start gap-2">
                    <span className="text-[#0B5394]">•</span>
                    Requires exact measurements
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0B5394]">•</span>
                    Precise motorcycle specs
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0B5394]">•</span>
                    Complete accessory selection
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0B5394]">•</span>
                    Full quote with all options
                  </li>
                </ul>
              </div>

              {/* Important Note */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <FileText className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-400 mb-1">
                      Before You Purchase
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-500/80">
                      Exact measurements will be required before finalizing your order to ensure perfect fit and compatibility.
                    </p>
                  </div>
                </div>
              </div>

              {/* Full Configurator Link */}
              <Link
                href="/configure-smooth"
                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#0B5394] hover:bg-[#0B5394]/90 text-white font-medium rounded-lg transition-colors"
              >
                <Ruler className="w-4 h-4" />
                Use Full Configurator
              </Link>
            </div>
          </div>
        </div>

        {/* Schedule Call Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-xl shadow-2xl max-w-md w-full p-6 relative">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              <CallScheduler
                onScheduled={() => setShowScheduleModal(false)}
                onCallbackRequested={() => setShowScheduleModal(false)}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function QuickConfiguratorUFE() {
  return (
    <ConfiguratorWrapper>
      <ConfiguratorProvider>
        <QuickConfiguratorContent />
      </ConfiguratorProvider>
    </ConfiguratorWrapper>
  )
}
