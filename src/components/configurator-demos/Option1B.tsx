'use client'

// Option 1B: Single-Page Flow Design
// All questions visible with progressive disclosure - completed sections collapse to chips

import React, { useState, useEffect, useRef } from 'react'

interface Option {
  value: string
  label: string
  sublabel?: string
}

interface Question {
  id: string
  question: string
  helpText: string
  icon: string
  options: Option[]
}

interface Result {
  recommendation: string
  message: string
  price: number | null
  features?: string[]
}

type StepState = 'completed' | 'active' | 'upcoming'

const QUESTIONS: Question[] = [
  {
    id: 'bedLength',
    question: "What's your truck bed length?",
    helpText: "Check your truck's specs or measure from bulkhead to tailgate",
    icon: '🛻',
    options: [
      { value: 'short', label: 'Short bed', sublabel: "5' - 5.8'" },
      { value: 'standard', label: 'Standard bed', sublabel: "6' - 6.5'" },
      { value: 'long', label: 'Long bed', sublabel: "8'+" },
      { value: 'unsure', label: "I'm not sure" },
    ],
  },
  {
    id: 'bikeWeight',
    question: 'Tell us about your motorcycle',
    helpText: 'Include gear, bags, and accessories in weight estimate',
    icon: '🏍️',
    options: [
      { value: 'light', label: 'Under 500 lbs', sublabel: 'Sport bikes, dirt bikes' },
      { value: 'medium', label: '500-800 lbs', sublabel: 'Cruisers, mid-size touring' },
      { value: 'heavy', label: '800-1,200 lbs', sublabel: 'Full dressers, Goldwings' },
      { value: 'over', label: 'Over 1,200 lbs', sublabel: 'Trikes, sidecars' },
    ],
  },
  {
    id: 'tailgateRequired',
    question: 'Tailgate requirements?',
    helpText: 'Important for highway driving and parking security',
    icon: '🚪',
    options: [
      { value: 'yes', label: 'Tailgate must close', sublabel: 'For highway trips, security' },
      { value: 'no', label: 'Open tailgate OK', sublabel: 'Short trips, local use' },
    ],
  },
]

function calculateRecommendation(answers: Record<string, string>): Result {
  if (answers.bikeWeight === 'over') {
    return {
      recommendation: 'custom',
      message: 'Your bike exceeds our 1,200 lb capacity. Contact us for custom solutions.',
      price: null,
    }
  }

  if (answers.bedLength === 'short' || answers.tailgateRequired === 'yes' || answers.bedLength === 'unsure') {
    return {
      recommendation: 'AUN250',
      message: 'The AUN 250 Folding Ramp is perfect for your setup.',
      price: 2795,
      features: ['Folds for tailgate closure', 'Fits all bed sizes', '1,200 lb capacity'],
    }
  }

  return {
    recommendation: 'AUN200',
    message: 'The AUN 200 Standard Ramp is ideal for your truck.',
    price: 2495,
    features: ['Full-length design', "Best for 6.5'+ beds", '1,200 lb capacity'],
  }
}

function getChipLabel(questionId: string, value: string): string {
  const question = QUESTIONS.find(q => q.id === questionId)
  const option = question?.options.find(o => o.value === value)
  return option?.label || value
}

// Collapsed answer chip component
interface AnswerChipProps {
  questionId: string
  value: string
  icon: string
  onClick: () => void
  isEditing: boolean
}

function AnswerChip({ questionId, value, icon, onClick, isEditing }: AnswerChipProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
        ${isEditing
          ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-400'
          : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-amber-500/50 hover:text-white'
        }`}
    >
      <span>{icon}</span>
      <span>{getChipLabel(questionId, value)}</span>
      <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>
  )
}

// Section component for each question
interface QuestionSectionProps {
  question: Question
  index: number
  state: StepState
  answer?: string
  onAnswer: (questionId: string, value: string) => void
  onEdit: () => void
  sectionRef: (el: HTMLDivElement | null) => void
}

function QuestionSection({ question, index, state, answer, onAnswer, onEdit, sectionRef }: QuestionSectionProps) {
  const isCompleted = state === 'completed'
  const isActive = state === 'active'
  const isUpcoming = state === 'upcoming'

  return (
    <div
      ref={sectionRef}
      className={`transition-all duration-500 ease-out ${isUpcoming ? 'opacity-40' : 'opacity-100'}`}
    >
      <div
        className={`rounded-xl border transition-all duration-500 overflow-hidden
          ${isActive
            ? 'bg-zinc-900 border-amber-500/50 shadow-lg shadow-amber-500/10'
            : isCompleted
              ? 'bg-zinc-900/50 border-zinc-800'
              : 'bg-zinc-900/30 border-zinc-800/50 border-dashed'
          }`}
      >
        {/* Header - always visible */}
        <div className={`p-4 ${isActive ? 'pb-0' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`text-2xl transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}
              >
                {question.icon}
              </span>
              <div>
                <h3 className={`font-medium transition-colors duration-300 ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                  {question.question}
                </h3>
                {isUpcoming && (
                  <p className="text-zinc-600 text-sm mt-1">Answer previous questions to unlock</p>
                )}
              </div>
            </div>

            {/* Completed chip */}
            {isCompleted && answer && (
              <AnswerChip
                questionId={question.id}
                value={answer}
                icon={question.icon}
                onClick={onEdit}
                isEditing={false}
              />
            )}

            {/* Step indicator */}
            {isActive && (
              <span className="px-3 py-1 bg-amber-500/20 text-amber-500 text-xs font-medium rounded-full">
                Step {index + 1}
              </span>
            )}
          </div>
        </div>

        {/* Expanded content - only for active */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-out`}
          style={{
            maxHeight: isActive ? '400px' : '0px',
            opacity: isActive ? 1 : 0,
          }}
        >
          <div className="p-4 pt-2">
            {question.helpText && (
              <p className="text-zinc-500 text-sm mb-4 ml-11">{question.helpText}</p>
            )}

            {/* Options grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-11">
              {question.options.map((option, optIndex) => (
                <button
                  key={option.value}
                  onClick={() => onAnswer(question.id, option.value)}
                  className="p-4 text-left bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-lg transition-all duration-200 group"
                  style={{
                    animationDelay: `${optIndex * 50}ms`,
                  }}
                >
                  <span className="text-white font-medium block">{option.label}</span>
                  {option.sublabel && (
                    <span className="text-zinc-500 text-sm">{option.sublabel}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Result section
interface ResultSectionProps {
  result: Result | null
  show: boolean
}

function ResultSection({ result, show }: ResultSectionProps) {
  if (!result) return null

  return (
    <div
      className={`rounded-xl border transition-all duration-700 overflow-hidden
        ${show
          ? 'bg-gradient-to-b from-zinc-900 to-zinc-900/80 border-amber-500 shadow-lg shadow-amber-500/20 opacity-100 translate-y-0'
          : 'bg-zinc-900/50 border-zinc-800 opacity-0 translate-y-8'
        }`}
    >
      <div className="p-8 text-center">
        {/* Success indicator */}
        <div
          className={`w-16 h-16 mx-auto mb-6 bg-amber-500/20 rounded-full flex items-center justify-center transition-all duration-500 delay-200
            ${show ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
        >
          <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Recommendation */}
        <h3
          className={`text-2xl font-bold text-white mb-2 transition-all duration-500 delay-300
            ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          {result.recommendation === 'custom'
            ? 'Custom Solution Needed'
            : `We recommend the ${result.recommendation === 'AUN200' ? 'AUN 200' : 'AUN 250'}`
          }
        </h3>

        <p
          className={`text-zinc-400 mb-6 transition-all duration-500 delay-400
            ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          {result.message}
        </p>

        {/* Features */}
        {result.features && (
          <div
            className={`flex flex-wrap justify-center gap-2 mb-6 transition-all duration-500 delay-500
              ${show ? 'opacity-100' : 'opacity-0'}`}
          >
            {result.features.map((feature, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-zinc-800 text-zinc-300 text-sm rounded-full"
              >
                ✓ {feature}
              </span>
            ))}
          </div>
        )}

        {/* Price */}
        {result.price && (
          <div
            className={`mb-6 transition-all duration-500 delay-500
              ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
          >
            <span className="text-4xl font-bold text-white">${result.price.toLocaleString()}</span>
            <span className="text-zinc-500 ml-2">+ free shipping</span>
          </div>
        )}

        {/* CTA */}
        <button
          className={`inline-flex items-center px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-all duration-300 hover:scale-105
            ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: show ? '600ms' : '0ms' }}
        >
          {result.recommendation === 'custom' ? 'Contact Us' : 'Add to Cart'}
          <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function Option1BSinglePageFlow() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [activeStep, setActiveStep] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [showResult, setShowResult] = useState(false)

  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])

  const allAnswered = QUESTIONS.every(q => answers[q.id])

  useEffect(() => {
    if (allAnswered && !result) {
      const calculatedResult = calculateRecommendation(answers)
      setResult(calculatedResult)
      setTimeout(() => setShowResult(true), 200)
    }
  }, [allAnswered, result, answers])

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))

    // Move to next step
    const nextStep = activeStep + 1
    if (nextStep < QUESTIONS.length) {
      setActiveStep(nextStep)

      // Scroll to next section
      setTimeout(() => {
        sectionRefs.current[nextStep]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }, 100)
    } else {
      // Scroll to result
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }, 300)
    }
  }

  const handleEdit = (stepIndex: number) => {
    setActiveStep(stepIndex)
    setResult(null)
    setShowResult(false)

    // Clear answers from this step onwards
    const newAnswers = { ...answers }
    for (let i = stepIndex; i < QUESTIONS.length; i++) {
      delete newAnswers[QUESTIONS[i].id]
    }
    setAnswers(newAnswers)

    // Scroll to section
    setTimeout(() => {
      sectionRefs.current[stepIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }, 100)
  }

  const getStepState = (index: number): StepState => {
    if (answers[QUESTIONS[index].id]) return 'completed'
    if (index === activeStep) return 'active'
    return 'upcoming'
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-2">Configure Your Ramp</h2>
          <p className="text-zinc-400">Complete each section to get your recommendation</p>
          <p className="text-amber-500 text-sm mt-2">Option 1B: Single-Page Flow</p>
        </div>

        {/* Progress overview */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {QUESTIONS.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                answers[QUESTIONS[index].id]
                  ? 'w-8 bg-amber-500'
                  : index === activeStep
                    ? 'w-8 bg-amber-500/50'
                    : 'w-2 bg-zinc-700'
              }`}
            />
          ))}
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              showResult ? 'w-8 bg-green-500' : 'w-2 bg-zinc-700'
            }`}
          />
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {QUESTIONS.map((question, index) => (
            <QuestionSection
              key={question.id}
              question={question}
              index={index}
              state={getStepState(index)}
              answer={answers[question.id]}
              onAnswer={handleAnswer}
              onEdit={() => handleEdit(index)}
              sectionRef={el => { sectionRefs.current[index] = el }}
            />
          ))}

          {/* Result Section */}
          <div id="result-section">
            <ResultSection
              result={result}
              show={showResult}
            />
          </div>
        </div>

        {/* Reset button */}
        {Object.keys(answers).length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={() => {
                setAnswers({})
                setActiveStep(0)
                setResult(null)
                setShowResult(false)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="text-zinc-500 hover:text-white text-sm transition-colors"
            >
              Start over
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
