'use client'

// Option 1C: Card Stack / Swipe Design
// Questions appear as stacked cards with depth and physics-based animations

import React, { useState } from 'react'

interface Option {
  value: string
  label: string
  sublabel?: string
}

interface Question {
  id: string
  question: string
  icon: string
  options: Option[]
}

interface Result {
  recommendation: string
  message: string
  price: number | null
}

const QUESTIONS: Question[] = [
  {
    id: 'bedLength',
    question: "What's your truck bed length?",
    icon: '🛻',
    options: [
      { value: 'short', label: 'Short bed', sublabel: "5' - 5.8'" },
      { value: 'standard', label: 'Standard', sublabel: "6' - 6.5'" },
      { value: 'long', label: 'Long bed', sublabel: "8'+" },
      { value: 'unsure', label: "Not sure" },
    ],
  },
  {
    id: 'bikeWeight',
    question: 'Motorcycle weight?',
    icon: '🏍️',
    options: [
      { value: 'light', label: 'Under 500 lbs', sublabel: 'Sport, dirt bikes' },
      { value: 'medium', label: '500-800 lbs', sublabel: 'Cruisers' },
      { value: 'heavy', label: '800-1,200 lbs', sublabel: 'Touring bikes' },
      { value: 'over', label: 'Over 1,200 lbs', sublabel: 'Trikes' },
    ],
  },
  {
    id: 'tailgateRequired',
    question: 'Need tailgate to close?',
    icon: '🚪',
    options: [
      { value: 'yes', label: 'Yes, must close', sublabel: 'Highway, security' },
      { value: 'no', label: 'No, open is fine', sublabel: 'Local trips' },
    ],
  },
]

function calculateRecommendation(answers: Record<string, string>): Result {
  if (answers.bikeWeight === 'over') {
    return {
      recommendation: 'custom',
      message: 'Your bike exceeds our 1,200 lb capacity.',
      price: null,
    }
  }

  if (answers.bedLength === 'short' || answers.tailgateRequired === 'yes' || answers.bedLength === 'unsure') {
    return {
      recommendation: 'AUN250',
      message: 'The AUN 250 Folding Ramp is perfect for your setup.',
      price: 2795,
    }
  }

  return {
    recommendation: 'AUN200',
    message: 'The AUN 200 Standard Ramp is ideal for your truck.',
    price: 2495,
  }
}

// Individual card component
interface QuestionCardProps {
  question: Question
  behindIndex: number
  onAnswer: (questionId: string, value: string) => void
  isExiting: boolean
  exitDirection: 'left' | 'right'
}

function QuestionCard({ question, behindIndex, onAnswer, isExiting, exitDirection }: QuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)

  const handleOptionClick = (value: string) => {
    setSelectedOption(value)
    setIsSelecting(true)

    setTimeout(() => {
      onAnswer(question.id, value)
    }, 400)
  }

  // Calculate stack position
  const stackOffset = behindIndex * 12
  const stackScale = 1 - (behindIndex * 0.05)
  const stackOpacity = 1 - (behindIndex * 0.25)

  // Exit animation
  const exitTransform = isExiting
    ? `translateX(${exitDirection === 'left' ? '-120%' : '120%'}) rotate(${exitDirection === 'left' ? '-15deg' : '15deg'})`
    : ''

  return (
    <div
      className={`absolute inset-0 transition-all duration-500 ease-out ${isExiting ? 'pointer-events-none' : ''}`}
      style={{
        transform: isExiting
          ? exitTransform
          : `translateY(${-stackOffset}px) scale(${stackScale})`,
        opacity: isExiting ? 0 : stackOpacity,
        zIndex: 10 - behindIndex,
        transitionTimingFunction: isExiting ? 'cubic-bezier(0.4, 0, 0.2, 1)' : 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl h-full
        ${behindIndex === 0 ? 'shadow-amber-500/10' : ''}`}
      >
        {/* Card header */}
        <div className="text-center mb-6">
          <span className="text-5xl mb-4 block">{question.icon}</span>
          <h3 className="text-xl font-bold text-white">{question.question}</h3>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, optIndex) => {
            const isSelected = selectedOption === option.value
            return (
              <button
                key={option.value}
                onClick={() => handleOptionClick(option.value)}
                disabled={isSelecting}
                className={`w-full p-4 rounded-xl transition-all duration-300 text-left
                  ${isSelected
                    ? 'bg-amber-500 text-black scale-[1.02] shadow-lg shadow-amber-500/30'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white hover:scale-[1.01]'
                  }
                  ${isSelecting && !isSelected ? 'opacity-50 scale-95' : ''}
                `}
                style={{
                  transitionDelay: isSelecting && !isSelected ? `${optIndex * 30}ms` : '0ms',
                }}
              >
                <span className="font-medium block">{option.label}</span>
                <span className={`text-sm ${isSelected ? 'text-black/70' : 'text-zinc-500'}`}>
                  {option.sublabel}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Result card component
interface ResultCardProps {
  result: Result | null
  show: boolean
}

function ResultCard({ result, show }: ResultCardProps) {
  if (!result || !show) return null

  return (
    <div
      className={`transition-all duration-700 ease-out ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
    >
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-800 border border-amber-500/50 rounded-2xl p-8 shadow-2xl shadow-amber-500/20">
        {/* Success animation */}
        <div className="text-center mb-6">
          <div className={`w-20 h-20 mx-auto bg-amber-500/20 rounded-full flex items-center justify-center
            transition-transform duration-500 ${show ? 'scale-100' : 'scale-0'}`}
          >
            <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Recommendation */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-2">
            {result.recommendation === 'custom'
              ? 'Custom Solution Needed'
              : `${result.recommendation === 'AUN200' ? 'AUN 200' : 'AUN 250'} Recommended`
            }
          </h3>
          <p className="text-zinc-400 mb-6">{result.message}</p>

          {result.price && (
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">${result.price.toLocaleString()}</span>
              <span className="text-zinc-500 ml-2">+ free shipping</span>
            </div>
          )}

          <button className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all hover:scale-[1.02]">
            {result.recommendation === 'custom' ? 'Contact Us' : 'View Product'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Option1CCardStack() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [exitingIndex, setExitingIndex] = useState<number | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [showResult, setShowResult] = useState(false)

  const handleAnswer = (questionId: string, value: string) => {
    setExitingIndex(currentIndex)

    const newAnswers = { ...answers, [questionId]: value }
    setAnswers(newAnswers)

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setExitingIndex(null)

      // Check if all questions answered
      if (currentIndex === QUESTIONS.length - 1) {
        const calculatedResult = calculateRecommendation(newAnswers)
        setResult(calculatedResult)
        setTimeout(() => setShowResult(true), 300)
      }
    }, 400)
  }

  const handleReset = () => {
    setCurrentIndex(0)
    setAnswers({})
    setResult(null)
    setShowResult(false)
    setExitingIndex(null)
  }

  const isComplete = currentIndex >= QUESTIONS.length

  // Get cards to render (current + next 2)
  const visibleCards = QUESTIONS.slice(currentIndex, currentIndex + 3)

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black py-16 px-4">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Find Your Ramp</h2>
          <p className="text-zinc-400">Tap your answer on each card</p>
          <p className="text-amber-500 text-sm mt-2">Option 1C: Card Stack</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {QUESTIONS.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index < currentIndex
                  ? 'bg-amber-500'
                  : index === currentIndex
                    ? 'bg-amber-500/50 w-6'
                    : 'bg-zinc-700'
              }`}
            />
          ))}
        </div>

        {/* Card stack container */}
        <div className="relative h-[420px]">
          {!isComplete ? (
            <>
              {/* Background cards (rendered first so they're behind) */}
              {visibleCards.slice().reverse().map((question, reverseIndex) => {
                const actualIndex = currentIndex + (visibleCards.length - 1 - reverseIndex)
                const behindIndex = actualIndex - currentIndex

                if (actualIndex < currentIndex) return null

                return (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    behindIndex={behindIndex}
                    onAnswer={handleAnswer}
                    isExiting={exitingIndex === actualIndex}
                    exitDirection="left"
                  />
                )
              })}
            </>
          ) : (
            <ResultCard result={result} show={showResult} />
          )}
        </div>

        {/* Stack indicator */}
        {!isComplete && (
          <div className="text-center mt-4">
            <span className="text-zinc-600 text-sm">
              {QUESTIONS.length - currentIndex} card{QUESTIONS.length - currentIndex !== 1 ? 's' : ''} remaining
            </span>
          </div>
        )}

        {/* Reset */}
        {(isComplete || currentIndex > 0) && (
          <div className="text-center mt-6">
            <button
              onClick={handleReset}
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
