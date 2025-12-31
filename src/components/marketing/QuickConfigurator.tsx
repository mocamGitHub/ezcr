'use client'

// Quick Configurator for Homepage
// Option 2A style with step navigator, tonneau cover flow, and info panel

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Check, Info, Ruler, Clock, FileText } from 'lucide-react'
import {
  saveSharedConfiguratorData,
  getSharedConfiguratorData,
  clearSharedConfiguratorData,
  type SharedConfiguratorData,
} from '@/lib/configurator-shared-data'

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
  stepLabel: string
}

interface Result {
  recommendation: string
  message: string
  price: number | null
  productUrl: string
  issues: string[]
  notes: string[]
  tonneauCompatible?: boolean
}

interface ConfiguratorPricing {
  models?: {
    AUN200?: { name: string; price: number }
    AUN210?: { name: string; price: number }
    AUN250?: { name: string; price: number }
  }
}

const BASE_QUESTIONS: Question[] = [
  {
    id: 'bedLength',
    question: "What's your truck bed length?",
    helpText: "Measure inside from bulkhead to inside of closed tailgate",
    stepLabel: 'Bed Length',
    options: [
      { value: 'short', label: 'Short bed', sublabel: "5' - 5.8' (60\" - 70\")" },
      { value: 'standard', label: 'Standard bed', sublabel: "6' - 6.5' (72\" - 78\")" },
      { value: 'long', label: 'Long bed', sublabel: "8'+ (96\"+)" },
      { value: 'unsure', label: "I'm not sure" },
    ],
  },
  {
    id: 'hasTonneau',
    question: "Does your truck have a tonneau cover?",
    helpText: "Also called a bed cover or truck bed cover",
    stepLabel: 'Tonneau',
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
  stepLabel: 'Cover Type',
  options: [
    { value: 'roll-up-soft', label: 'Roll-up (Soft)', sublabel: 'Vinyl/fabric that rolls toward cab' },
    { value: 'roll-up-hard', label: 'Roll-up (Hard)', sublabel: 'Aluminum slats that roll up' },
    { value: 'tri-fold-soft', label: 'Tri-fold (Soft)', sublabel: 'Three fabric panels that fold' },
    { value: 'tri-fold-hard', label: 'Tri-fold (Hard)', sublabel: 'Three rigid panels that fold' },
    { value: 'bi-fold', label: 'Bi-fold', sublabel: 'Two panels that fold in half' },
    { value: 'hinged', label: 'One-piece (Hinged)', sublabel: 'Single panel that lifts up' },
    { value: 'retractable', label: 'Retractable', sublabel: 'Slides into canister at cab' },
    { value: 'other', label: 'Other / Not Listed', sublabel: 'Different style' },
  ],
}

const ROLL_DIRECTION_QUESTION: Question = {
  id: 'rollDirection',
  question: "When your cover rolls up, where does it go?",
  helpText: "This affects how much bed space is available",
  stepLabel: 'Roll Direction',
  options: [
    { value: 'on-top', label: 'Rolls ON TOP of the rails', sublabel: 'Toward cab, outside the bed' },
    { value: 'into-bed', label: 'Rolls INTO the bed', sublabel: 'Takes up 8-12 inches of space inside' },
  ],
}

const REMAINING_QUESTIONS: Question[] = [
  {
    id: 'bikeWeight',
    question: 'Approximate weight of your motorcycle?',
    helpText: 'Include gear, bags, and accessories',
    stepLabel: 'Bike Weight',
    options: [
      { value: 'light', label: 'Under 500 lbs', sublabel: 'Sport bikes, dirt bikes' },
      { value: 'medium', label: '500-800 lbs', sublabel: 'Cruisers, mid-size touring' },
      { value: 'heavy', label: '800-1,200 lbs', sublabel: 'Full dressers, Goldwings' },
    ],
  },
  {
    id: 'tailgateRequired',
    question: 'Do you need to close your tailgate with the ramp installed (unloaded)?',
    helpText: 'This means with the ramp stored but no bike loaded. Only long bed trucks can close the tailgate with the bike loaded.',
    stepLabel: 'Tailgate',
    options: [
      { value: 'yes', label: 'Yes, tailgate must close', sublabel: 'Ramp installed, no bike loaded' },
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

function calculateRecommendation(answers: Record<string, string>, pricing: ConfiguratorPricing): Result {
  const issues: string[] = []
  const notes: string[] = []

  // Tonneau cover logic
  if (answers.hasTonneau === 'yes') {
    if (answers.rollDirection === 'into-bed') {
      notes.push('Your rolled cover reduces usable bed length by 8-12 inches')
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

  // Get prices from API (required - no fallback)
  // Support both AUN200 (legacy) and AUN210 (current) as the base model
  const aun250Price = pricing?.models?.AUN250?.price ?? 0
  const baseModel = pricing?.models?.AUN200 || pricing?.models?.AUN210
  const baseModelPrice = baseModel?.price ?? 0
  const baseModelName = pricing?.models?.AUN200 ? 'AUN200' : 'AUN210'
  const baseModelDisplayName = pricing?.models?.AUN200 ? 'AUN 200' : 'AUN 210'

  // Recommendation logic
  const needsAUN250 =
    answers.bedLength === 'short' ||
    answers.tailgateRequired === 'yes' ||
    answers.bedLength === 'unsure' ||
    (answers.rollDirection === 'into-bed' && answers.bedLength === 'short')

  if (needsAUN250) {
    return {
      recommendation: 'AUN250',
      message: 'Based on your answers, the AUN 250 Folding Ramp is recommended for your setup.',
      price: aun250Price,
      productUrl: '/products/aun-250-folding-ramp',
      issues,
      notes,
      tonneauCompatible: true,
    }
  }

  return {
    recommendation: baseModelName,
    message: `Based on your answers, the ${baseModelDisplayName} Standard Ramp is recommended for your truck.`,
    price: baseModelPrice,
    productUrl: `/products/${baseModelName.toLowerCase()}-standard-ramp`,
    issues,
    notes,
    tonneauCompatible: true,
  }
}

// Animated counter for price
function AnimatedPrice({ value, show }: { value: number; show: boolean }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (!show) {
      setDisplayValue(0)
      return
    }

    const duration = 800
    const steps = 25
    const increment = value / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value, show])

  return (
    <span className="tabular-nums">${displayValue.toLocaleString()}</span>
  )
}

// Step Navigator component with clickable steps
function StepNavigator({
  questions,
  currentStep,
  completedSteps,
  isComplete,
  onStepClick
}: {
  questions: Question[]
  currentStep: number
  completedSteps: number[]
  isComplete: boolean
  onStepClick: (stepIndex: number) => void
}) {
  const getStepState = (stepIndex: number) => {
    if (isComplete) return 'completed'
    if (stepIndex === currentStep) return 'current'
    if (completedSteps.includes(stepIndex)) return 'completed'
    return 'disabled'
  }

  const canClickStep = (stepIndex: number) => {
    if (stepIndex === currentStep) return true
    if (completedSteps.includes(stepIndex)) return true
    // Can click the next step if previous is completed
    if (stepIndex > 0 && completedSteps.includes(stepIndex - 1)) return true
    return false
  }

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
      {questions.map((question, index) => {
        const state = getStepState(index)
        const clickable = canClickStep(index)

        return (
          <React.Fragment key={question.id}>
            <button
              onClick={() => clickable && onStepClick(index)}
              disabled={!clickable}
              className={`
                flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-xs font-medium
                transition-all duration-300
                ${state === 'current'
                  ? 'bg-[#0B5394] text-white shadow-md scale-105'
                  : state === 'completed'
                    ? 'bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/30'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500'
                }
                ${clickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}
              `}
            >
              {state === 'completed' ? (
                <Check className="w-3 h-3" />
              ) : (
                <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white/20 text-[10px]">
                  {index + 1}
                </span>
              )}
              <span className="hidden sm:inline">{question.stepLabel}</span>
            </button>

            {/* Connector line */}
            {index < questions.length - 1 && (
              <div
                className={`w-3 sm:w-4 h-0.5 transition-colors duration-300 ${
                  completedSteps.includes(index) ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
              />
            )}
          </React.Fragment>
        )
      })}

      {/* Result step - clickable when all questions completed */}
      <>
        <div
          className={`w-3 sm:w-4 h-0.5 transition-colors duration-300 ${
            isComplete || completedSteps.length === questions.length ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-700'
          }`}
        />
        <button
          onClick={() => {
            // Can navigate to result if all questions are completed
            if (completedSteps.length === questions.length) {
              onStepClick(questions.length) // Navigate to result
            }
          }}
          disabled={completedSteps.length !== questions.length}
          className={`
            flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-xs font-medium
            transition-all duration-300
            ${isComplete
              ? 'bg-green-500/20 text-green-700 dark:text-green-400 cursor-pointer hover:bg-green-500/30'
              : completedSteps.length === questions.length
                ? 'bg-[#0B5394] text-white shadow-md scale-105 cursor-pointer'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500 opacity-60 cursor-not-allowed'
            }
          `}
        >
          {isComplete && <Check className="w-3 h-3" />}
          <span>Result</span>
        </button>
      </>
    </div>
  )
}

// Info Panel Component
function InfoPanel() {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 sticky top-24">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
        <Info className="w-5 h-5 text-[#0B5394]" />
        Quick vs Full Configurator
      </h3>

      {/* Quick Configurator */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-[#F78309]" />
          <span className="font-medium text-zinc-900 dark:text-white">Quick Ramp Finder</span>
          <span className="text-xs bg-[#F78309]/20 text-[#F78309] px-2 py-0.5 rounded-full">You are here</span>
        </div>
        <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1.5 ml-6">
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
            Great for initial research
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500">!</span>
            Does not include accessory costs
          </li>
        </ul>
      </div>

      {/* Divider */}
      <div className="h-px bg-zinc-200 dark:bg-zinc-700 my-4" />

      {/* Full Configurator */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Ruler className="w-4 h-4 text-[#0B5394]" />
          <span className="font-medium text-zinc-900 dark:text-white">Full Configurator</span>
        </div>
        <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1.5 ml-6">
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
              Exact measurements will be required before finalizing your order to ensure perfect fit, compatibility, and exact costs.
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
  )
}

export function QuickConfigurator() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [result, setResult] = useState<Result | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [pricing, setPricing] = useState<ConfiguratorPricing | null>(null)
  const [pricingLoading, setPricingLoading] = useState(true)
  const [pricingError, setPricingError] = useState<string | null>(null)

  const questions = buildQuestionFlow(answers)
  const currentQuestion = questions[step]
  const isComplete = step >= questions.length

  // Fetch pricing from API on mount
  const fetchPricing = useCallback(async () => {
    setPricingLoading(true)
    setPricingError(null)
    try {
      const response = await fetch('/api/configurator/settings')
      if (!response.ok) {
        throw new Error('Failed to load pricing')
      }
      const data = await response.json()
      // Validate that we have at least one ramp model - check for AUN250 (primary) and AUN200 or AUN210
      const models = data.pricing?.models
      if (!models || !models.AUN250 || (!models.AUN200 && !models.AUN210)) {
        console.error('Missing pricing data. Got models:', models)
        throw new Error('Invalid pricing data: missing required ramp models')
      }
      setPricing(data.pricing)
    } catch (error) {
      console.error('Failed to fetch pricing:', error)
      setPricingError(error instanceof Error ? error.message : 'Failed to load pricing')
    } finally {
      setPricingLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPricing()
  }, [fetchPricing])

  // Load any existing shared data on mount
  useEffect(() => {
    const sharedData = getSharedConfiguratorData()
    if (sharedData && sharedData.source === 'quick') {
      // Load previous quick configurator answers
      const loadedAnswers: Record<string, string> = {}
      if (sharedData.bedLength) loadedAnswers.bedLength = sharedData.bedLength
      if (sharedData.hasTonneau) loadedAnswers.hasTonneau = sharedData.hasTonneau
      if (sharedData.tonneauType) loadedAnswers.tonneauType = sharedData.tonneauType
      if (sharedData.rollDirection) loadedAnswers.rollDirection = sharedData.rollDirection
      if (sharedData.bikeWeight) loadedAnswers.bikeWeight = sharedData.bikeWeight
      if (sharedData.tailgateRequired) loadedAnswers.tailgateRequired = sharedData.tailgateRequired

      if (Object.keys(loadedAnswers).length > 0) {
        setAnswers(loadedAnswers)
        // Calculate which steps are completed
        const newQuestions = buildQuestionFlow(loadedAnswers)
        const completed: number[] = []
        newQuestions.forEach((q, idx) => {
          if (loadedAnswers[q.id]) completed.push(idx)
        })
        setCompletedSteps(completed)
        // Set step to first unanswered or complete
        const firstUnanswered = newQuestions.findIndex(q => !loadedAnswers[q.id])
        if (firstUnanswered === -1) {
          setStep(newQuestions.length) // All answered, show result
        } else {
          setStep(firstUnanswered)
        }
      }
    }
  }, [])

  // Save answers when complete
  useEffect(() => {
    if (isComplete && !result && pricing) {
      const calculatedResult = calculateRecommendation(answers, pricing)
      setResult(calculatedResult)

      // Save to shared storage
      const sharedData: SharedConfiguratorData = {
        bedLength: answers.bedLength as SharedConfiguratorData['bedLength'],
        hasTonneau: answers.hasTonneau as SharedConfiguratorData['hasTonneau'],
        tonneauType: answers.tonneauType,
        rollDirection: answers.rollDirection as SharedConfiguratorData['rollDirection'],
        bikeWeight: answers.bikeWeight as SharedConfiguratorData['bikeWeight'],
        tailgateRequired: answers.tailgateRequired as SharedConfiguratorData['tailgateRequired'],
        vehicleType: 'pickup',
        recommendation: calculatedResult.recommendation as 'AUN200' | 'AUN250',
        source: 'quick',
      }
      saveSharedConfiguratorData(sharedData)

      setTimeout(() => setShowResult(true), 300)
    }
  }, [isComplete, result, answers, pricing])

  const handleAnswer = useCallback((questionId: string, value: string) => {
    setSelectedOption(value)

    setTimeout(() => {
      setIsTransitioning(true)
      const newAnswers = { ...answers, [questionId]: value }
      setAnswers(newAnswers)
      setCompletedSteps(prev => [...prev.filter(s => s !== step), step])

      setTimeout(() => {
        // Recalculate questions based on new answers
        const newQuestions = buildQuestionFlow(newAnswers)
        // Find next step
        const currentIndex = newQuestions.findIndex(q => q.id === questionId)
        setStep(currentIndex + 1)
        setSelectedOption(null)
        setIsTransitioning(false)
      }, 400)
    }, 300)
  }, [answers, step])

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex !== step) {
      setIsTransitioning(true)
      setTimeout(() => {
        setStep(stepIndex)
        setResult(null)
        setShowResult(false)
        setIsTransitioning(false)
      }, 300)
    }
  }

  const handleReset = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setStep(0)
      setAnswers({})
      setCompletedSteps([])
      setResult(null)
      setShowResult(false)
      setSelectedOption(null)
      setIsTransitioning(false)
      // Clear shared data when starting over
      clearSharedConfiguratorData()
    }, 300)
  }

  // Show loading state
  if (pricingLoading) {
    return (
      <section id="configurator" className="py-16 bg-amber-50/50 dark:bg-zinc-950 border-y border-amber-200/50 dark:border-amber-800/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
              Find Your <span className="text-[#F78309]">Perfect Ramp</span>
            </h2>
          </div>
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#F78309] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-zinc-600 dark:text-zinc-400">Loading configurator...</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Show error state
  if (pricingError) {
    return (
      <section id="configurator" className="py-16 bg-amber-50/50 dark:bg-zinc-950 border-y border-amber-200/50 dark:border-amber-800/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
              Find Your <span className="text-[#F78309]">Perfect Ramp</span>
            </h2>
          </div>
          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Info className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                Unable to Load Configurator
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                We couldn&apos;t load the current pricing. This may be due to a temporary connection issue.
              </p>
              <button
                onClick={fetchPricing}
                className="px-6 py-3 bg-[#F78309] hover:bg-[#e07308] text-white font-medium rounded-lg transition-colors"
              >
                Try Again
              </button>
              <p className="text-zinc-500 text-sm mt-4">
                Or call us at <a href="tel:18006874410" className="text-[#0B5394] hover:underline">1-800-687-4410</a>
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="configurator" className="py-16 bg-amber-50/50 dark:bg-zinc-950 border-y border-amber-200/50 dark:border-amber-800/30">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
            Find Your <span className="text-[#F78309]">Perfect Ramp</span>
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg">
            Answer a few quick questions — no email required
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configurator - Left/Main Column */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg">

              {/* Step Navigator */}
              <div className="px-4 sm:px-6 pt-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <StepNavigator
                  questions={questions}
                  currentStep={step}
                  completedSteps={completedSteps}
                  isComplete={isComplete}
                  onStepClick={handleStepClick}
                />
              </div>

              {/* Content */}
              <div className="p-6 md:p-8">
                <div
                  style={{
                    opacity: isTransitioning ? 0 : 1,
                    transform: isTransitioning ? 'translateX(-20px)' : 'translateX(0)',
                    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  {!isComplete ? (
                    /* Question View */
                    <div>
                      {/* Question */}
                      <h3 className="text-xl text-zinc-900 dark:text-white font-medium mb-2">
                        {currentQuestion?.question}
                      </h3>
                      {currentQuestion?.helpText && (
                        <p className="text-zinc-500 dark:text-zinc-500 text-sm mb-6">{currentQuestion.helpText}</p>
                      )}

                      {/* Options */}
                      <div className={`space-y-3 ${currentQuestion?.options?.length > 4 ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : ''}`}>
                        {currentQuestion?.options.map((option) => {
                          const isSelected = selectedOption === option.value
                          const isPreviousAnswer = answers[currentQuestion.id] === option.value
                          return (
                            <button
                              key={option.value}
                              onClick={() => handleAnswer(currentQuestion.id, option.value)}
                              disabled={selectedOption !== null}
                              className={`w-full p-4 text-left rounded-lg transition-all duration-300 group relative overflow-hidden
                                ${isSelected || isPreviousAnswer
                                  ? 'bg-[#F78309]/20 border-2 border-[#F78309] scale-[1.02]'
                                  : 'bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 hover:border-[#F78309]/50'
                                }
                                ${selectedOption && !isSelected ? 'opacity-50' : 'opacity-100'}
                              `}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-zinc-900 dark:text-white font-medium block">{option.label}</span>
                                  {option.sublabel && (
                                    <span className="text-zinc-500 dark:text-zinc-500 text-sm">{option.sublabel}</span>
                                  )}
                                </div>
                                <div className={`transition-all duration-300 ${isSelected || isPreviousAnswer ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                                  <svg className="w-6 h-6 text-[#F78309]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                {!isSelected && !isPreviousAnswer && (
                                  <svg
                                    className="w-5 h-5 text-zinc-400 dark:text-zinc-600 group-hover:text-[#F78309] transition-colors duration-200"
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
                    /* Result View */
                    <div className="text-center">
                      {/* Success icon */}
                      <div className="mb-6">
                        <div
                          className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center"
                          style={{
                            opacity: showResult ? 1 : 0,
                            transform: showResult ? 'scale(1)' : 'scale(0.8)',
                            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                          }}
                        >
                          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>

                      {/* Recommendation */}
                      <h3
                        className="text-2xl font-bold text-zinc-900 dark:text-white mb-2"
                        style={{
                          opacity: showResult ? 1 : 0,
                          transform: showResult ? 'translateY(0)' : 'translateY(20px)',
                          transition: 'all 0.5s ease-out 0.2s',
                        }}
                      >
                        We recommend the {result?.recommendation === 'AUN250' ? 'AUN 250' : result?.recommendation === 'AUN210' ? 'AUN 210' : 'AUN 200'}
                      </h3>
                      <p
                        className="text-zinc-600 dark:text-zinc-400 mb-4"
                        style={{
                          opacity: showResult ? 1 : 0,
                          transform: showResult ? 'translateY(0)' : 'translateY(20px)',
                          transition: 'all 0.5s ease-out 0.3s',
                        }}
                      >
                        {result?.message}
                      </p>

                      {/* Tonneau compatibility */}
                      {answers.hasTonneau === 'yes' && result?.tonneauCompatible && (
                        <div
                          className="mb-4 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-lg inline-block"
                          style={{
                            opacity: showResult ? 1 : 0,
                            transition: 'opacity 0.5s ease-out 0.35s',
                          }}
                        >
                          <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                            ✓ Compatible with your {answers.tonneauType?.replace(/-/g, ' ')} cover
                          </p>
                        </div>
                      )}

                      {/* Notes */}
                      {result?.notes && result.notes.length > 0 && (
                        <div
                          className="mb-6 text-left max-w-md mx-auto"
                          style={{
                            opacity: showResult ? 1 : 0,
                            transition: 'opacity 0.5s ease-out 0.4s',
                          }}
                        >
                          <p className="text-zinc-500 dark:text-zinc-500 text-sm mb-2">Usage notes:</p>
                          {result.notes.map((note, i) => (
                            <p key={i} className="text-amber-600 dark:text-amber-500 text-sm flex items-start gap-2 mb-1">
                              <span className="shrink-0">•</span>
                              <span>{note}</span>
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Price */}
                      {result?.price && (
                        <div
                          className="mb-6"
                          style={{
                            opacity: showResult ? 1 : 0,
                            transform: showResult ? 'scale(1)' : 'scale(0.9)',
                            transition: 'all 0.5s ease-out 0.45s',
                          }}
                        >
                          <span className="text-4xl font-bold text-zinc-900 dark:text-white">
                            <AnimatedPrice value={result.price} show={showResult} />
                          </span>
                          <span className="text-zinc-500 dark:text-zinc-500 ml-2 text-sm">base price</span>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 italic">
                            * Price does not include possible required accessories
                          </p>
                        </div>
                      )}

                      {/* Primary CTA */}
                      <Link
                        href={result?.productUrl || '/shop'}
                        className="inline-flex items-center px-8 py-4 bg-[#F78309] hover:bg-[#e07308] text-white font-bold rounded-lg transition-all duration-300 hover:scale-105"
                        style={{
                          opacity: showResult ? 1 : 0,
                          transform: showResult ? 'translateY(0)' : 'translateY(20px)',
                          transition: 'all 0.5s ease-out 0.5s',
                        }}
                      >
                        View {result?.recommendation === 'AUN250' ? 'AUN 250' : result?.recommendation === 'AUN210' ? 'AUN 210' : 'AUN 200'}
                        <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>

                      {/* Reset */}
                      <button
                        onClick={handleReset}
                        className="block mx-auto mt-6 text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-sm transition-colors duration-200"
                        style={{
                          opacity: showResult ? 1 : 0,
                          transition: 'opacity 0.5s ease-out 0.6s',
                        }}
                      >
                        Start over
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Trust indicator */}
            <p className="text-center mt-6 text-zinc-500 dark:text-zinc-600 text-sm">
              Takes under a minute • No email required
            </p>
          </div>

          {/* Info Panel - Right Column */}
          <div className="lg:col-span-1">
            <InfoPanel />
          </div>
        </div>
      </div>
    </section>
  )
}

export default QuickConfigurator
