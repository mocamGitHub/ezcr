'use client'

// Quick Configurator V2 - Option 2A: Sequential Tonneau Cover Steps
// Uses ConfiguratorHeader and includes comparison panel

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ConfiguratorHeader } from './ConfiguratorHeader'
import { ConfiguratorProvider } from './ConfiguratorProvider'
import { ArrowRight, CheckCircle, Info, Ruler, FileText, Clock } from 'lucide-react'

interface Option {
  value: string
  label: string
  sublabel?: string
}

interface Question {
  id: string
  question: string
  helpText?: string
  options: Option[]
}

interface Result {
  recommendation: string
  message: string
  price: number | null
  productUrl: string
  issues: string[]
  notes: string[]
  tonneauCompatible?: boolean
  alternateOption?: { model: string; reason: string }
}

const BASE_QUESTIONS: Question[] = [
  {
    id: 'bedLength',
    question: "What's your truck bed length?",
    helpText: "Measure inside from bulkhead to tailgate",
    options: [
      { value: 'short', label: 'Short bed', sublabel: "5' - 5.8'" },
      { value: 'standard', label: 'Standard bed', sublabel: "6' - 6.5'" },
      { value: 'long', label: 'Long bed', sublabel: "8'+" },
      { value: 'unsure', label: "I'm not sure" },
    ],
  },
  {
    id: 'hasTonneau',
    question: "Does your truck have a tonneau cover?",
    helpText: "Also called a bed cover or truck bed cover",
    options: [
      { value: 'yes', label: 'Yes, I have a tonneau cover', sublabel: 'Any type of bed cover' },
      { value: 'no', label: 'No cover / Open bed', sublabel: 'Nothing covering the bed' },
    ],
  },
]

const TONNEAU_TYPE_QUESTION: Question = {
  id: 'tonneauType',
  question: "What type of tonneau cover do you have?",
  helpText: "Select the style that best matches your cover",
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
}

const ROLL_DIRECTION_QUESTION: Question = {
  id: 'rollDirection',
  question: "When your cover rolls up, where does it go?",
  helpText: "This affects how much bed space is available",
  options: [
    { value: 'on-top', label: 'Rolls ON TOP of the rails', sublabel: 'Toward cab, outside the bed - No bed space lost' },
    { value: 'into-bed', label: 'Rolls INTO the bed', sublabel: 'Takes up space inside - Reduces usable length ~8"' },
  ],
}

const REMAINING_QUESTIONS: Question[] = [
  {
    id: 'bikeWeight',
    question: 'Approximate weight of your motorcycle?',
    helpText: 'Include gear, bags, and accessories',
    options: [
      { value: 'light', label: 'Under 500 lbs', sublabel: 'Sport bikes, dirt bikes' },
      { value: 'medium', label: '500-800 lbs', sublabel: 'Cruisers, mid-size touring' },
      { value: 'heavy', label: '800-1,200 lbs', sublabel: 'Full dressers, Goldwings' },
      { value: 'over', label: 'Over 1,200 lbs', sublabel: 'Trikes, sidecars' },
    ],
  },
  {
    id: 'tailgateRequired',
    question: 'Do you need to close your tailgate with the ramp installed?',
    helpText: 'Important for highway driving and security',
    options: [
      { value: 'yes', label: 'Yes, tailgate must close', sublabel: 'For highway trips, parking security' },
      { value: 'no', label: 'No, open tailgate is fine', sublabel: 'Short trips, local use' },
    ],
  },
]

function buildQuestionFlow(answers: Record<string, string>): Question[] {
  let questions = [...BASE_QUESTIONS]

  // Add tonneau type question if they have a cover
  if (answers.hasTonneau === 'yes') {
    questions.push(TONNEAU_TYPE_QUESTION)

    // Add roll direction if it's a roll-up type
    if (answers.tonneauType?.includes('roll-up')) {
      questions.push(ROLL_DIRECTION_QUESTION)
    }
  }

  // Add remaining questions
  questions = [...questions, ...REMAINING_QUESTIONS]

  return questions
}

function calculateRecommendation(answers: Record<string, string>): Result {
  const issues: string[] = []
  const notes: string[] = []

  // Weight check
  if (answers.bikeWeight === 'over') {
    return {
      recommendation: 'custom',
      message: 'Your bike exceeds our 1,200 lb capacity. Contact us for custom solutions.',
      price: null,
      productUrl: '/contact',
      issues: ['Weight exceeds standard capacity'],
      notes: [],
    }
  }

  // Tonneau cover logic
  if (answers.hasTonneau === 'yes') {
    if (answers.rollDirection === 'into-bed') {
      notes.push('Your rolled cover reduces usable bed length by ~8"')
      if (answers.bedLength === 'short') {
        issues.push('Limited bed space with cover rolled')
      }
    }

    if (['tri-fold-soft', 'tri-fold-hard', 'bi-fold'].includes(answers.tonneauType)) {
      notes.push('Fold your cover toward the cab before loading')
    }

    if (answers.tonneauType === 'hinged') {
      notes.push('Open your cover fully before loading')
    }

    if (answers.tonneauType === 'retractable') {
      notes.push('Ensure canister is at least 10" from cab')
    }
  }

  // Recommendation logic
  const needsAUN250 =
    answers.bedLength === 'short' ||
    answers.tailgateRequired === 'yes' ||
    answers.bedLength === 'unsure' ||
    (answers.rollDirection === 'into-bed' && answers.bedLength === 'short')

  if (needsAUN250) {
    return {
      recommendation: 'AUN250',
      message: 'The AUN 250 Folding Ramp is perfect for your setup.',
      price: 2795,
      productUrl: '/products/aun-250-folding-ramp',
      issues,
      notes,
      tonneauCompatible: true,
    }
  }

  return {
    recommendation: 'AUN200',
    message: 'The AUN 200 Standard Ramp is ideal for your truck.',
    price: 2495,
    productUrl: '/products/aun-200-basic-ramp',
    issues,
    notes,
    tonneauCompatible: true,
    alternateOption: { model: 'AUN 250', reason: 'If you want tailgate compatibility' },
  }
}

// Format currency with thousand separators
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function QuickConfiguratorContent() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [step, setStep] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  const questions = buildQuestionFlow(answers)
  const currentQuestion = questions[step]
  const isComplete = step >= questions.length
  const progress = (step / questions.length) * 100

  useEffect(() => {
    if (isComplete && !result) {
      const calculatedResult = calculateRecommendation(answers)
      setResult(calculatedResult)
    }
  }, [isComplete, result, answers])

  const handleAnswer = useCallback((questionId: string, value: string) => {
    setSelectedOption(value)

    setTimeout(() => {
      setIsTransitioning(true)

      const newAnswers = { ...answers, [questionId]: value }
      setAnswers(newAnswers)

      setTimeout(() => {
        // Recalculate questions based on new answers
        const newQuestions = buildQuestionFlow(newAnswers)

        // Find next step
        const currentIndex = newQuestions.findIndex(q => q.id === questionId)
        setStep(currentIndex + 1)
        setSelectedOption(null)
        setIsTransitioning(false)
      }, 300)
    }, 200)
  }, [answers])

  const handleBack = () => {
    if (step > 0) {
      setIsTransitioning(true)
      setTimeout(() => {
        setStep(prev => prev - 1)
        setResult(null)
        setIsTransitioning(false)
      }, 300)
    }
  }

  const handleReset = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setStep(0)
      setAnswers({})
      setResult(null)
      setSelectedOption(null)
      setIsTransitioning(false)
    }, 300)
  }

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
                  <span>Step {Math.min(step + 1, questions.length)} of {questions.length}</span>
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
                  {!isComplete ? (
                    <div>
                      {/* Back button */}
                      {step > 0 && (
                        <button
                          onClick={handleBack}
                          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Back
                        </button>
                      )}

                      {/* Tonneau indicator */}
                      {(currentQuestion?.id === 'tonneauType' || currentQuestion?.id === 'rollDirection') && (
                        <div className="mb-4 px-3 py-2 bg-[#F78309]/10 border border-[#F78309]/30 rounded-lg text-[#F78309] text-sm flex items-center gap-2">
                          <span>🚛</span>
                          <span>Tonneau Cover Configuration</span>
                        </div>
                      )}

                      {/* Question */}
                      <h3 className="text-xl text-foreground font-medium mb-2">
                        {currentQuestion?.question}
                      </h3>
                      {currentQuestion?.helpText && (
                        <p className="text-muted-foreground text-sm mb-6">{currentQuestion.helpText}</p>
                      )}

                      {/* Options */}
                      <div className={`space-y-3 ${currentQuestion?.options?.length > 4 ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : ''}`}>
                        {currentQuestion?.options?.map((option) => {
                          const isSelected = selectedOption === option.value
                          return (
                            <button
                              key={option.value}
                              onClick={() => handleAnswer(currentQuestion.id, option.value)}
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
                  ) : (
                    /* Result */
                    <div className="text-center py-4">
                      <div className="w-16 h-16 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      </div>

                      <h3 className="text-2xl font-bold text-foreground mb-2">
                        {result?.recommendation === 'custom'
                          ? 'Custom Solution Needed'
                          : `We recommend the ${result?.recommendation === 'AUN200' ? 'AUN 200' : 'AUN 250'}`
                        }
                      </h3>
                      <p className="text-muted-foreground mb-4">{result?.message}</p>

                      {/* Tonneau compatibility */}
                      {answers.hasTonneau === 'yes' && result?.tonneauCompatible && (
                        <div className="mb-4 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-lg inline-block">
                          <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                            ✓ Compatible with your {answers.tonneauType?.replace(/-/g, ' ')} cover
                          </p>
                        </div>
                      )}

                      {/* Notes */}
                      {result?.notes && result.notes.length > 0 && (
                        <div className="mb-6 text-left max-w-md mx-auto">
                          <p className="text-muted-foreground text-sm mb-2">Usage notes:</p>
                          {result.notes.map((note, i) => (
                            <p key={i} className="text-[#F78309]/80 text-sm flex items-start gap-2 mb-1">
                              <Info className="w-4 h-4 mt-0.5 shrink-0" />
                              <span>{note}</span>
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Price */}
                      {result?.price && (
                        <div className="mb-6">
                          <span className="text-4xl font-bold text-foreground">${formatCurrency(result.price)}</span>
                          <span className="text-muted-foreground ml-2">+ free shipping</span>
                        </div>
                      )}

                      {/* CTA */}
                      <Link
                        href={result?.productUrl || '/products'}
                        className="inline-flex items-center px-8 py-4 bg-[#F78309] hover:bg-[#e07308] text-white font-bold rounded-lg transition-all hover:scale-105"
                      >
                        {result?.recommendation === 'custom' ? 'Contact Us' : 'View Product'}
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Link>

                      {/* Reset */}
                      <button
                        onClick={handleReset}
                        className="block mx-auto mt-6 text-muted-foreground hover:text-foreground text-sm transition-colors"
                      >
                        Start over
                      </button>
                    </div>
                  )}
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
      </main>
    </div>
  )
}

export default function QuickConfiguratorV2() {
  return (
    <ConfiguratorProvider>
      <QuickConfiguratorContent />
    </ConfiguratorProvider>
  )
}
