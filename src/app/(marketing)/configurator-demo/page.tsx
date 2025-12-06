'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ExternalLink, Check, X } from 'lucide-react'

// ============================================
// SHARED TYPES AND DATA
// ============================================

const QUESTIONS = [
  {
    id: 'bedLength',
    question: "What's your truck bed length?",
    helpText: "Measure inside from bulkhead to tailgate",
    options: [
      { value: 'short', label: 'Short bed', sublabel: "5'-5.8'" },
      { value: 'standard', label: 'Standard bed', sublabel: "6'-6.5'" },
      { value: 'long', label: 'Long bed', sublabel: "8'+" },
      { value: 'unsure', label: "I'm not sure" },
    ],
  },
  {
    id: 'bikeWeight',
    question: 'Motorcycle weight?',
    helpText: 'Include gear, bags, and accessories',
    options: [
      { value: 'light', label: 'Under 500 lbs', sublabel: 'Sport bikes, dirt bikes' },
      { value: 'medium', label: '500-800 lbs', sublabel: 'Cruisers' },
      { value: 'heavy', label: '800-1,200 lbs', sublabel: 'Touring bikes' },
      { value: 'over', label: 'Over 1,200 lbs', sublabel: 'Trikes' },
    ],
  },
  {
    id: 'tailgate',
    question: 'Need tailgate to close?',
    options: [
      { value: 'yes', label: 'Yes, must close' },
      { value: 'no', label: 'No, open is fine' },
    ],
  },
]

function calculateRecommendation(answers: Record<string, string>) {
  if (answers.bikeWeight === 'over') {
    return { recommendation: 'custom', message: 'Contact us for custom solutions.', price: null }
  }
  const needsAUN250 = answers.bedLength === 'short' || answers.tailgate === 'yes' || answers.bedLength === 'unsure'
  return {
    recommendation: needsAUN250 ? 'AUN250' : 'AUN200',
    message: needsAUN250 ? 'The AUN 250 is perfect for your setup.' : 'The AUN 200 is ideal for your truck.',
    price: needsAUN250 ? 2795 : 2495,
  }
}

// ============================================
// OPTION 1A: POLISHED ANIMATIONS
// ============================================

function Option1APolishedAnimations() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [result, setResult] = useState<ReturnType<typeof calculateRecommendation> | null>(null)

  const currentQuestion = QUESTIONS[step]
  const isComplete = step >= QUESTIONS.length
  const progress = (step / QUESTIONS.length) * 100

  const handleAnswer = (value: string) => {
    setSelectedOption(value)
    setTimeout(() => {
      setIsTransitioning(true)
      const newAnswers = { ...answers, [currentQuestion.id]: value }
      setAnswers(newAnswers)
      setTimeout(() => {
        if (step + 1 >= QUESTIONS.length) {
          setResult(calculateRecommendation(newAnswers))
        }
        setStep(prev => prev + 1)
        setSelectedOption(null)
        setIsTransitioning(false)
      }, 300)
    }, 200)
  }

  const handleReset = () => {
    setStep(0)
    setAnswers({})
    setResult(null)
    setSelectedOption(null)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-zinc-500 mb-2">
          <span>Step {Math.min(step + 1, QUESTIONS.length)} of {QUESTIONS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)' }}
          />
        </div>
      </div>

      <div style={{ opacity: isTransitioning ? 0 : 1, transform: isTransitioning ? 'translateX(-20px)' : 'translateX(0)', transition: 'all 0.3s ease-out' }}>
        {!isComplete ? (
          <div>
            <h3 className="text-lg text-white font-medium mb-2">{currentQuestion?.question}</h3>
            {currentQuestion?.helpText && <p className="text-zinc-500 text-sm mb-4">{currentQuestion.helpText}</p>}
            <div className="space-y-2">
              {currentQuestion?.options.map((option, index) => {
                const isSelected = selectedOption === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(option.value)}
                    disabled={selectedOption !== null}
                    className={`w-full p-3 text-left rounded-lg transition-all duration-300
                      ${isSelected ? 'bg-amber-500/20 border-2 border-amber-500 scale-[1.02]' : 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700'}
                      ${selectedOption && !isSelected ? 'opacity-50' : ''}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <span className="text-white font-medium">{option.label}</span>
                    {option.sublabel && <span className="text-zinc-500 text-sm ml-2">{option.sublabel}</span>}
                    {isSelected && <Check className="inline w-5 h-5 text-amber-500 float-right" />}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-amber-500/20 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {result?.recommendation === 'AUN200' ? 'AUN 200' : result?.recommendation === 'AUN250' ? 'AUN 250' : 'Custom Solution'}
            </h3>
            <p className="text-zinc-400 mb-4">{result?.message}</p>
            {result?.price && <p className="text-2xl font-bold text-white mb-4">${result.price.toLocaleString()}</p>}
            <button onClick={handleReset} className="text-zinc-500 hover:text-white text-sm">Start over</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// OPTION 1B: SINGLE PAGE FLOW
// ============================================

function Option1BSinglePageFlow() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [activeStep, setActiveStep] = useState(0)
  const [result, setResult] = useState<ReturnType<typeof calculateRecommendation> | null>(null)

  const handleAnswer = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value }
    setAnswers(newAnswers)

    if (activeStep + 1 >= QUESTIONS.length) {
      setResult(calculateRecommendation(newAnswers))
    } else {
      setActiveStep(prev => prev + 1)
    }
  }

  const handleReset = () => {
    setAnswers({})
    setActiveStep(0)
    setResult(null)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
      {QUESTIONS.map((question, index) => {
        const isCompleted = !!answers[question.id]
        const isActive = index === activeStep && !result
        const isUpcoming = index > activeStep && !result

        return (
          <div
            key={question.id}
            className={`rounded-lg border p-4 transition-all ${
              isActive ? 'bg-zinc-800 border-amber-500/50' :
              isCompleted ? 'bg-zinc-800/50 border-zinc-700' :
              'bg-zinc-900/30 border-zinc-800 opacity-40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`font-medium ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                {question.question}
              </span>
              {isCompleted && (
                <span className="px-3 py-1 bg-amber-500/20 text-amber-500 text-xs rounded-full">
                  {question.options.find(o => o.value === answers[question.id])?.label}
                </span>
              )}
            </div>
            {isActive && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {question.options.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(question.id, option.value)}
                    className="p-2 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 hover:border-amber-500 rounded text-sm text-white text-left"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {result && (
        <div className="rounded-lg border border-amber-500 bg-amber-500/10 p-4 text-center">
          <h3 className="text-lg font-bold text-white mb-1">
            {result.recommendation === 'AUN200' ? 'AUN 200' : result.recommendation === 'AUN250' ? 'AUN 250' : 'Custom'}
          </h3>
          {result.price && <p className="text-xl font-bold text-amber-500">${result.price.toLocaleString()}</p>}
          <button onClick={handleReset} className="mt-2 text-zinc-400 text-xs hover:text-white">Reset</button>
        </div>
      )}
    </div>
  )
}

// ============================================
// OPTION 1C: CARD STACK
// ============================================

function Option1CCardStack() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ReturnType<typeof calculateRecommendation> | null>(null)

  const handleAnswer = (value: string) => {
    const question = QUESTIONS[currentIndex]
    const newAnswers = { ...answers, [question.id]: value }
    setAnswers(newAnswers)

    if (currentIndex + 1 >= QUESTIONS.length) {
      setResult(calculateRecommendation(newAnswers))
    }
    setCurrentIndex(prev => prev + 1)
  }

  const handleReset = () => {
    setCurrentIndex(0)
    setAnswers({})
    setResult(null)
  }

  const isComplete = currentIndex >= QUESTIONS.length

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-4">
        {QUESTIONS.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full transition-all ${
              index < currentIndex ? 'w-6 bg-amber-500' :
              index === currentIndex ? 'w-6 bg-amber-500/50' :
              'w-2 bg-zinc-700'
            }`}
          />
        ))}
      </div>

      <div className="relative h-[280px]">
        {!isComplete ? (
          QUESTIONS.slice(currentIndex, currentIndex + 2).map((question, idx) => {
            const behindOffset = idx * 8
            const scale = 1 - (idx * 0.03)
            return (
              <div
                key={question.id}
                className="absolute inset-0 bg-zinc-800 border border-zinc-700 rounded-xl p-5"
                style={{
                  transform: `translateY(${-behindOffset}px) scale(${scale})`,
                  opacity: 1 - (idx * 0.3),
                  zIndex: 10 - idx,
                }}
              >
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-white">{question.question}</h3>
                </div>
                <div className="space-y-2">
                  {question.options.map(option => (
                    <button
                      key={option.value}
                      onClick={() => idx === 0 && handleAnswer(option.value)}
                      disabled={idx !== 0}
                      className="w-full p-3 bg-zinc-700 hover:bg-amber-500 hover:text-black rounded-lg text-left text-white transition-colors"
                    >
                      <span className="font-medium">{option.label}</span>
                      {option.sublabel && <span className="text-zinc-400 text-sm ml-2">{option.sublabel}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center pt-8">
            <div className="w-14 h-14 mx-auto mb-4 bg-amber-500/20 rounded-full flex items-center justify-center">
              <Check className="w-7 h-7 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {result?.recommendation === 'AUN200' ? 'AUN 200' : result?.recommendation === 'AUN250' ? 'AUN 250' : 'Custom'}
            </h3>
            {result?.price && <p className="text-2xl font-bold text-white mb-4">${result.price.toLocaleString()}</p>}
            <button onClick={handleReset} className="text-zinc-500 hover:text-white text-sm">Start over</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// OPTION 1D: CONVERSATIONAL
// ============================================

function Option1DConversational() {
  const [messages, setMessages] = useState<Array<{type: string, content: string}>>([
    { type: 'bot', content: "Hey! I'm here to help you find the perfect ramp. What's your truck bed length?" }
  ])
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ReturnType<typeof calculateRecommendation> | null>(null)

  const handleReply = (label: string, value: string) => {
    const question = QUESTIONS[currentStep]
    const newAnswers = { ...answers, [question.id]: value }
    setAnswers(newAnswers)

    setMessages(prev => [...prev, { type: 'user', content: label }])

    setTimeout(() => {
      if (currentStep + 1 >= QUESTIONS.length) {
        const rec = calculateRecommendation(newAnswers)
        setResult(rec)
        setMessages(prev => [...prev, {
          type: 'bot',
          content: `Perfect! I recommend the ${rec.recommendation === 'AUN200' ? 'AUN 200' : rec.recommendation === 'AUN250' ? 'AUN 250' : 'custom solution'}. ${rec.message}`
        }])
      } else {
        setCurrentStep(prev => prev + 1)
        setMessages(prev => [...prev, { type: 'bot', content: QUESTIONS[currentStep + 1].question }])
      }
    }, 500)
  }

  const handleReset = () => {
    setMessages([{ type: 'bot', content: "Hey! I'm here to help you find the perfect ramp. What's your truck bed length?" }])
    setCurrentStep(0)
    setAnswers({})
    setResult(null)
  }

  const currentQuestion = result ? null : QUESTIONS[currentStep]

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-zinc-800 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-xs font-bold text-black">EZ</div>
        <div>
          <p className="text-white text-sm font-medium">EZ Ramp Finder</p>
          <p className="text-zinc-500 text-xs">Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="h-[220px] overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
              msg.type === 'user' ? 'bg-amber-500 text-black rounded-br-md' : 'bg-zinc-800 text-white rounded-bl-md'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Quick replies */}
      <div className="border-t border-zinc-800 p-3">
        {currentQuestion ? (
          <div className="flex flex-wrap gap-2">
            {currentQuestion.options.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleReply(opt.label, opt.value)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-full text-xs text-white"
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : (
          <button onClick={handleReset} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg">
            Start New Conversation
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================
// OPTION 2A: SEQUENTIAL TONNEAU
// ============================================

const TONNEAU_TYPES = [
  { value: 'none', label: 'No Cover' },
  { value: 'roll-up-soft', label: 'Roll-up (Soft)' },
  { value: 'roll-up-hard', label: 'Roll-up (Hard)' },
  { value: 'tri-fold', label: 'Tri-fold' },
  { value: 'bi-fold', label: 'Bi-fold' },
  { value: 'hinged', label: 'One-piece (Hinged)' },
  { value: 'retractable', label: 'Retractable' },
]

function Option2ASequentialTonneau() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ReturnType<typeof calculateRecommendation> | null>(null)

  const allQuestions = [
    QUESTIONS[0], // bed length
    {
      id: 'tonneauType',
      question: 'Do you have a tonneau cover?',
      options: TONNEAU_TYPES,
    },
    ...(answers.tonneauType?.includes('roll-up') ? [{
      id: 'rollDirection',
      question: 'When rolled up, where does it go?',
      options: [
        { value: 'on-top', label: 'On top of rails', sublabel: 'No space lost' },
        { value: 'into-bed', label: 'Into the bed', sublabel: '-8" space' },
      ],
    }] : []),
    QUESTIONS[1], // bike weight
    QUESTIONS[2], // tailgate
  ]

  const currentQuestion = allQuestions[step]

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value }
    setAnswers(newAnswers)

    // Recalculate questions after tonneau answer
    const updatedQuestions = [
      QUESTIONS[0],
      { id: 'tonneauType', question: 'Do you have a tonneau cover?', options: TONNEAU_TYPES },
      ...(newAnswers.tonneauType?.includes('roll-up') ? [{
        id: 'rollDirection',
        question: 'When rolled up, where does it go?',
        options: [
          { value: 'on-top', label: 'On top of rails' },
          { value: 'into-bed', label: 'Into the bed' },
        ],
      }] : []),
      QUESTIONS[1],
      QUESTIONS[2],
    ]

    if (step + 1 >= updatedQuestions.length) {
      setResult(calculateRecommendation(newAnswers))
    } else {
      setStep(prev => prev + 1)
    }
  }

  const handleReset = () => {
    setStep(0)
    setAnswers({})
    setResult(null)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex justify-between text-xs text-zinc-500 mb-4">
        <span>With Tonneau Support</span>
        <span>{step + 1}/{allQuestions.length}</span>
      </div>

      {!result ? (
        <>
          <h3 className="text-lg text-white font-medium mb-4">{currentQuestion?.question}</h3>
          <div className="space-y-2">
            {currentQuestion?.options.map((option: { value: string; label: string; sublabel?: string }) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className="w-full p-3 text-left bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-lg text-white"
              >
                <span className="font-medium">{option.label}</span>
                {option.sublabel && <span className="text-zinc-500 text-sm ml-2">{option.sublabel}</span>}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center">
          <Check className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-white mb-1">
            {result.recommendation === 'AUN200' ? 'AUN 200' : result.recommendation === 'AUN250' ? 'AUN 250' : 'Custom'}
          </h3>
          {answers.tonneauType && answers.tonneauType !== 'none' && (
            <p className="text-green-400 text-sm mb-2">Compatible with your {TONNEAU_TYPES.find(t => t.value === answers.tonneauType)?.label}</p>
          )}
          {result.price && <p className="text-2xl font-bold text-white mb-3">${result.price.toLocaleString()}</p>}
          <button onClick={handleReset} className="text-zinc-500 hover:text-white text-sm">Start over</button>
        </div>
      )}
    </div>
  )
}

// ============================================
// OPTION 2B: VISUAL TONNEAU
// ============================================

function Option2BVisualTonneau() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ReturnType<typeof calculateRecommendation> | null>(null)

  const tonneauVisuals = [
    { value: 'none', label: 'No Cover', icon: '▭' },
    { value: 'roll-up', label: 'Roll-up', icon: '◎' },
    { value: 'tri-fold', label: 'Tri-fold', icon: '▤' },
    { value: 'bi-fold', label: 'Bi-fold', icon: '◫' },
    { value: 'hinged', label: 'One-piece', icon: '▬' },
    { value: 'retractable', label: 'Retractable', icon: '↔' },
  ]

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [step === 0 ? 'bedLength' : step === 1 ? 'tonneauType' : step === 2 ? 'bikeWeight' : 'tailgate']: value }
    setAnswers(newAnswers)

    if (step + 1 >= 4) {
      setResult(calculateRecommendation(newAnswers))
    } else {
      setStep(prev => prev + 1)
    }
  }

  const handleReset = () => {
    setStep(0)
    setAnswers({})
    setResult(null)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      {!result ? (
        <>
          {step === 0 && (
            <>
              <h3 className="text-lg text-white font-medium mb-4">Truck bed length?</h3>
              <div className="grid grid-cols-3 gap-2">
                {QUESTIONS[0].options.slice(0, 3).map(opt => (
                  <button key={opt.value} onClick={() => handleAnswer(opt.value)} className="p-3 bg-zinc-800 hover:bg-amber-500 hover:text-black rounded-lg text-center text-white">
                    <span className="block text-2xl mb-1">{opt.value === 'short' ? '5ft' : opt.value === 'standard' ? '6ft' : '8ft'}</span>
                    <span className="text-xs">{opt.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <h3 className="text-lg text-white font-medium mb-4">Tonneau cover type?</h3>
              <div className="grid grid-cols-3 gap-2">
                {tonneauVisuals.map(opt => (
                  <button key={opt.value} onClick={() => handleAnswer(opt.value)} className="p-3 bg-zinc-800 hover:bg-amber-500 hover:text-black rounded-lg text-center text-white">
                    <span className="block text-2xl mb-1">{opt.icon}</span>
                    <span className="text-xs">{opt.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h3 className="text-lg text-white font-medium mb-4">Motorcycle weight?</h3>
              <div className="space-y-2">
                {QUESTIONS[1].options.map(opt => (
                  <button key={opt.value} onClick={() => handleAnswer(opt.value)} className="w-full p-3 text-left bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-lg text-white">
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h3 className="text-lg text-white font-medium mb-4">Tailgate must close?</h3>
              <div className="grid grid-cols-2 gap-3">
                {QUESTIONS[2].options.map(opt => (
                  <button key={opt.value} onClick={() => handleAnswer(opt.value)} className="p-4 bg-zinc-800 hover:bg-amber-500 hover:text-black rounded-lg text-center text-white">
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="text-center">
          <Check className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-white mb-1">
            {result.recommendation === 'AUN200' ? 'AUN 200' : result.recommendation === 'AUN250' ? 'AUN 250' : 'Custom'}
          </h3>
          {result.price && <p className="text-2xl font-bold text-white mb-3">${result.price.toLocaleString()}</p>}
          <button onClick={handleReset} className="text-zinc-500 hover:text-white text-sm">Start over</button>
        </div>
      )}
    </div>
  )
}

// ============================================
// OPTION 2C: INTEGRATED BED CONFIG
// ============================================

function Option2CIntegratedBed() {
  const [bedLength, setBedLength] = useState<string>('')
  const [tonneau, setTonneau] = useState<string>('')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ReturnType<typeof calculateRecommendation> | null>(null)

  const handleBedConfig = () => {
    if (bedLength) {
      setAnswers({ bedLength, tonneauType: tonneau || 'none' })
      setStep(1)
    }
  }

  const handleAnswer = (value: string) => {
    const key = step === 1 ? 'bikeWeight' : 'tailgate'
    const newAnswers = { ...answers, [key]: value }
    setAnswers(newAnswers)

    if (step >= 2) {
      setResult(calculateRecommendation(newAnswers))
    } else {
      setStep(prev => prev + 1)
    }
  }

  const handleReset = () => {
    setBedLength('')
    setTonneau('')
    setStep(0)
    setAnswers({})
    setResult(null)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      {step === 0 && !result && (
        <>
          <h3 className="text-lg text-white font-medium mb-4">Configure your truck bed</h3>
          {/* Visual bed representation */}
          <div className="bg-zinc-800 rounded-lg p-4 mb-4">
            <div className="relative h-24 border-2 border-zinc-600 rounded flex items-center justify-center">
              <div className={`absolute inset-2 rounded transition-all ${tonneau ? 'bg-amber-500/20 border border-amber-500/50' : 'bg-zinc-700/50'}`}>
                {tonneau && <span className="absolute top-1 left-2 text-xs text-amber-500">{tonneau}</span>}
              </div>
              <span className="text-zinc-400 text-sm z-10">{bedLength ? `${bedLength === 'short' ? "5'" : bedLength === 'standard' ? "6'" : "8'"} bed` : 'Select size'}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">Bed Length</label>
              <div className="grid grid-cols-3 gap-2">
                {['short', 'standard', 'long'].map(size => (
                  <button key={size} onClick={() => setBedLength(size)} className={`p-2 rounded text-sm ${bedLength === size ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-white'}`}>
                    {size === 'short' ? "5'" : size === 'standard' ? "6'" : "8'"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">Tonneau Cover (optional)</label>
              <select value={tonneau} onChange={(e) => setTonneau(e.target.value)} className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm">
                <option value="">No cover</option>
                <option value="roll-up">Roll-up</option>
                <option value="tri-fold">Tri-fold</option>
                <option value="bi-fold">Bi-fold</option>
                <option value="hinged">One-piece</option>
              </select>
            </div>
          </div>
          <button onClick={handleBedConfig} disabled={!bedLength} className="w-full mt-4 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-lg">
            Continue
          </button>
        </>
      )}

      {step >= 1 && !result && (
        <>
          <h3 className="text-lg text-white font-medium mb-4">{step === 1 ? 'Motorcycle weight?' : 'Tailgate must close?'}</h3>
          <div className="space-y-2">
            {(step === 1 ? QUESTIONS[1] : QUESTIONS[2]).options.map(opt => (
              <button key={opt.value} onClick={() => handleAnswer(opt.value)} className="w-full p-3 text-left bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-lg text-white">
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}

      {result && (
        <div className="text-center">
          <Check className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-white mb-1">
            {result.recommendation === 'AUN200' ? 'AUN 200' : result.recommendation === 'AUN250' ? 'AUN 250' : 'Custom'}
          </h3>
          {result.price && <p className="text-2xl font-bold text-white mb-3">${result.price.toLocaleString()}</p>}
          <button onClick={handleReset} className="text-zinc-500 hover:text-white text-sm">Start over</button>
        </div>
      )}
    </div>
  )
}

// ============================================
// OPTION 2D: SMART DETECTION
// ============================================

const TRUCK_DATABASE: Record<string, string[]> = {
  Ford: ['F-150', 'F-250', 'F-350', 'Ranger'],
  Chevrolet: ['Silverado 1500', 'Silverado 2500', 'Colorado'],
  RAM: ['1500', '2500', '3500'],
  Toyota: ['Tundra', 'Tacoma'],
  GMC: ['Sierra 1500', 'Sierra 2500', 'Canyon'],
  Nissan: ['Titan', 'Frontier'],
}

function Option2DSmartDetection() {
  const [truckMake, setTruckMake] = useState('')
  const [truckModel, setTruckModel] = useState('')
  const [truckYear, setTruckYear] = useState('')
  const [bedLength, setBedLength] = useState('')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ReturnType<typeof calculateRecommendation> | null>(null)

  const models = truckMake ? TRUCK_DATABASE[truckMake] || [] : []
  const years = Array.from({ length: 12 }, (_, i) => (2024 - i).toString())
  const beds = [
    { value: 'short', label: "5.5' Short" },
    { value: 'standard', label: "6.5' Standard" },
    { value: 'long', label: "8' Long" },
  ]

  const handleTruckContinue = () => {
    if (bedLength) {
      setAnswers({ bedLength, truckMake, truckModel, truckYear })
      setStep(1)
    }
  }

  const handleAnswer = (value: string) => {
    const key = step === 1 ? 'bikeWeight' : 'tailgate'
    const newAnswers = { ...answers, [key]: value }
    setAnswers(newAnswers)

    if (step >= 2) {
      setResult(calculateRecommendation(newAnswers))
    } else {
      setStep(prev => prev + 1)
    }
  }

  const handleReset = () => {
    setTruckMake('')
    setTruckModel('')
    setTruckYear('')
    setBedLength('')
    setStep(0)
    setAnswers({})
    setResult(null)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      {step === 0 && !result && (
        <>
          <h3 className="text-lg text-white font-medium mb-4">Tell us about your truck</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <select value={truckYear} onChange={(e) => setTruckYear(e.target.value)} className="p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm">
                <option value="">Year</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={truckMake} onChange={(e) => { setTruckMake(e.target.value); setTruckModel('') }} className="p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm">
                <option value="">Make</option>
                {Object.keys(TRUCK_DATABASE).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={truckModel} onChange={(e) => setTruckModel(e.target.value)} disabled={!truckMake} className="p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm disabled:opacity-50">
                <option value="">Model</option>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {truckModel && (
              <div>
                <label className="text-zinc-400 text-xs mb-2 block">Bed Length for your {truckModel}</label>
                <div className="grid grid-cols-3 gap-2">
                  {beds.map(bed => (
                    <button key={bed.value} onClick={() => setBedLength(bed.value)} className={`p-2 rounded text-sm ${bedLength === bed.value ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>
                      {bed.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={handleTruckContinue} disabled={!bedLength} className="w-full mt-4 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-lg">
            Continue
          </button>
        </>
      )}

      {step >= 1 && !result && (
        <>
          <p className="text-amber-500 text-xs mb-2">Configuring for {truckYear} {truckMake} {truckModel}</p>
          <h3 className="text-lg text-white font-medium mb-4">{step === 1 ? 'Motorcycle weight?' : 'Tailgate must close?'}</h3>
          <div className="space-y-2">
            {(step === 1 ? QUESTIONS[1] : QUESTIONS[2]).options.map(opt => (
              <button key={opt.value} onClick={() => handleAnswer(opt.value)} className="w-full p-3 text-left bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-lg text-white">
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}

      {result && (
        <div className="text-center">
          <p className="text-green-400 text-sm mb-2">Perfect for your {truckYear} {truckMake} {truckModel}!</p>
          <h3 className="text-xl font-bold text-white mb-1">
            {result.recommendation === 'AUN200' ? 'AUN 200' : result.recommendation === 'AUN250' ? 'AUN 250' : 'Custom'}
          </h3>
          {result.price && <p className="text-2xl font-bold text-white mb-3">${result.price.toLocaleString()}</p>}
          <button onClick={handleReset} className="text-zinc-500 hover:text-white text-sm">Start over</button>
        </div>
      )}
    </div>
  )
}

// ============================================
// OPTION 3A: TWO ENTRY POINTS
// ============================================

function Option3ATwoEntryPoints() {
  const [path, setPath] = useState<'quick' | 'exact' | null>(null)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ReturnType<typeof calculateRecommendation> | null>(null)

  const handleAnswer = (value: string) => {
    const question = QUESTIONS[step]
    const newAnswers = { ...answers, [question.id]: value }
    setAnswers(newAnswers)

    if (step + 1 >= QUESTIONS.length) {
      setResult(calculateRecommendation(newAnswers))
    } else {
      setStep(prev => prev + 1)
    }
  }

  const handleReset = () => {
    setPath(null)
    setStep(0)
    setAnswers({})
    setResult(null)
  }

  if (!path) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg text-white font-medium text-center mb-4">Find Your Ramp</h3>
        <div className="space-y-3">
          <button onClick={() => setPath('quick')} className="w-full p-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-lg text-left">
            <span className="text-xl mr-2">🚀</span>
            <span className="text-white font-medium">Quick Check</span>
            <span className="text-zinc-500 text-sm block ml-7">30 seconds • 3 questions</span>
          </button>
          <button onClick={() => setPath('exact')} className="w-full p-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-lg text-left">
            <span className="text-xl mr-2">📐</span>
            <span className="text-white font-medium">Exact Fit</span>
            <span className="text-zinc-500 text-sm block ml-7">2 minutes • Measurements</span>
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = QUESTIONS[step]

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      {!result ? (
        <>
          <div className="flex justify-between items-center text-xs mb-4">
            <span className={path === 'quick' ? 'text-amber-500' : 'text-green-500'}>{path === 'quick' ? 'Quick Check' : 'Exact Fit'}</span>
            <span className="text-zinc-500">{step + 1}/{QUESTIONS.length}</span>
          </div>
          <h3 className="text-lg text-white font-medium mb-4">{currentQuestion?.question}</h3>
          <div className="space-y-2">
            {currentQuestion?.options.map(option => (
              <button key={option.value} onClick={() => handleAnswer(option.value)} className="w-full p-3 text-left bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-lg text-white">
                {option.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center">
          <span className={`inline-block px-3 py-1 rounded-full text-xs mb-3 ${path === 'quick' ? 'bg-amber-500/20 text-amber-500' : 'bg-green-500/20 text-green-500'}`}>
            {path === 'quick' ? 'Preliminary' : 'Verified Fit'}
          </span>
          <h3 className="text-xl font-bold text-white mb-1">
            {result.recommendation === 'AUN200' ? 'AUN 200' : result.recommendation === 'AUN250' ? 'AUN 250' : 'Custom'}
          </h3>
          {result.price && <p className="text-2xl font-bold text-white mb-3">${result.price.toLocaleString()}</p>}
          {path === 'quick' && <button className="w-full py-2 bg-amber-500/20 text-amber-500 rounded-lg text-sm mb-3">Get Exact Fit →</button>}
          <button onClick={handleReset} className="text-zinc-500 hover:text-white text-sm">Start over</button>
        </div>
      )}
    </div>
  )
}

// ============================================
// OPTION 3B: PROGRESSIVE DISCLOSURE
// ============================================

function Option3BProgressiveDisclosure() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ReturnType<typeof calculateRecommendation> | null>(null)
  const [showMeasurements, setShowMeasurements] = useState(false)
  const [verified, setVerified] = useState(false)

  const currentQuestion = QUESTIONS[step]

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value }
    setAnswers(newAnswers)

    if (step + 1 >= QUESTIONS.length) {
      setResult(calculateRecommendation(newAnswers))
    } else {
      setStep(prev => prev + 1)
    }
  }

  const handleReset = () => {
    setStep(0)
    setAnswers({})
    setResult(null)
    setShowMeasurements(false)
    setVerified(false)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      {!result && !showMeasurements && (
        <>
          <div className="flex justify-between text-xs text-zinc-500 mb-4">
            <span>Quick questions</span>
            <span>{step + 1}/{QUESTIONS.length}</span>
          </div>
          <h3 className="text-lg text-white font-medium mb-4">{currentQuestion?.question}</h3>
          <div className="space-y-2">
            {currentQuestion?.options.map(option => (
              <button key={option.value} onClick={() => handleAnswer(option.value)} className="w-full p-3 text-left bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-lg text-white">
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}

      {result && !showMeasurements && (
        <div>
          <div className="flex justify-center gap-2 mb-4">
            <div className={`h-2 w-8 rounded-full ${verified ? 'bg-green-500' : 'bg-amber-500'}`} />
            <div className={`h-2 w-8 rounded-full ${verified ? 'bg-green-500' : 'bg-zinc-700'}`} />
          </div>
          <div className={`text-center p-4 rounded-lg mb-4 ${verified ? 'bg-green-500/10 border border-green-500/30' : 'bg-zinc-800'}`}>
            <p className={`text-sm mb-1 ${verified ? 'text-green-400' : 'text-amber-500'}`}>{verified ? 'Verified Fit' : 'Likely Fit'}</p>
            <h3 className="text-xl font-bold text-white">{result.recommendation === 'AUN200' ? 'AUN 200' : 'AUN 250'}</h3>
            {result.price && <p className="text-2xl font-bold text-white">${result.price.toLocaleString()}</p>}
          </div>
          {!verified && (
            <button onClick={() => { setShowMeasurements(true) }} className="w-full py-3 bg-amber-500/20 text-amber-500 rounded-lg text-sm mb-3">
              📐 Add measurements for Verified Fit
            </button>
          )}
          <button onClick={handleReset} className="w-full text-zinc-500 hover:text-white text-sm">Start over</button>
        </div>
      )}

      {showMeasurements && (
        <div>
          <h3 className="text-lg text-white font-medium mb-4">Add your measurements</h3>
          <div className="space-y-3 mb-4">
            <input type="text" placeholder="Bed length (e.g., 5' 6&quot;)" className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm" />
            <input type="text" placeholder="Bike weight (lbs)" className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm" />
          </div>
          <button onClick={() => { setShowMeasurements(false); setVerified(true) }} className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg">
            Verify Fit
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================
// OPTION 3C: CHECKOUT MEASUREMENTS
// ============================================

function Option3CCheckoutMeasurements() {
  const [stage, setStage] = useState<'config' | 'checkout'>('config')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ReturnType<typeof calculateRecommendation> | null>(null)
  const [fitVerified, setFitVerified] = useState(false)

  const currentQuestion = QUESTIONS[step]

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value }
    setAnswers(newAnswers)

    if (step + 1 >= QUESTIONS.length) {
      setResult(calculateRecommendation(newAnswers))
    } else {
      setStep(prev => prev + 1)
    }
  }

  const handleReset = () => {
    setStage('config')
    setStep(0)
    setAnswers({})
    setResult(null)
    setFitVerified(false)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      {stage === 'config' && !result && (
        <>
          <div className="flex justify-between text-xs text-zinc-500 mb-4">
            <span>Quick recommendation</span>
            <span>{step + 1}/{QUESTIONS.length}</span>
          </div>
          <h3 className="text-lg text-white font-medium mb-4">{currentQuestion?.question}</h3>
          <div className="space-y-2">
            {currentQuestion?.options.map(option => (
              <button key={option.value} onClick={() => handleAnswer(option.value)} className="w-full p-3 text-left bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-lg text-white">
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}

      {stage === 'config' && result && (
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-1">{result.recommendation === 'AUN200' ? 'AUN 200' : 'AUN 250'}</h3>
          {result.price && <p className="text-2xl font-bold text-white mb-3">${result.price.toLocaleString()}</p>}
          <button onClick={() => setStage('checkout')} className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg mb-2">
            Add to Cart
          </button>
          <p className="text-zinc-500 text-xs">We&apos;ll verify measurements at checkout</p>
        </div>
      )}

      {stage === 'checkout' && (
        <div>
          <p className="text-zinc-500 text-xs mb-2">Checkout Step 1 of 3</p>
          <h3 className="text-lg text-white font-medium mb-4">Verify Your Fit</h3>
          {!fitVerified ? (
            <>
              <div className="space-y-3 mb-4">
                <input type="text" placeholder="Exact bed length" className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm" />
                <input type="text" placeholder="Bike weight (lbs)" className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm" />
              </div>
              <button onClick={() => setFitVerified(true)} className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg">
                Verify Fit
              </button>
            </>
          ) : (
            <div className="text-center">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                <Check className="w-6 h-6 text-green-500 mx-auto mb-1" />
                <p className="text-green-400 text-sm">Fit Verified!</p>
              </div>
              <button className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg mb-2">
                Continue to Shipping →
              </button>
              <button onClick={handleReset} className="text-zinc-500 hover:text-white text-sm">Start over</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// OPTION 3E: CONSULTANT APPROACH
// ============================================

function Option3EConsultant() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [qualified, setQualified] = useState<boolean | null>(null)
  const [showScheduler, setShowScheduler] = useState(false)

  const qualQuestions = [
    { id: 'truckType', question: 'What type of truck?', options: [{ value: 'full', label: 'Full-size' }, { value: 'mid', label: 'Mid-size' }, { value: 'compact', label: 'Compact' }] },
    { id: 'bikeType', question: 'Motorcycle type?', options: [{ value: 'cruiser', label: 'Cruiser' }, { value: 'touring', label: 'Touring' }, { value: 'sport', label: 'Sport' }] },
    { id: 'timeline', question: 'Purchase timeline?', options: [{ value: 'ready', label: 'Ready now' }, { value: 'soon', label: '1-3 months' }, { value: 'later', label: 'Just looking' }] },
  ]

  const currentQuestion = qualQuestions[step]

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value }
    setAnswers(newAnswers)

    if (step + 1 >= qualQuestions.length) {
      // Simple qualification: ready + full-size + touring = high intent
      const isQualified = newAnswers.timeline === 'ready' || newAnswers.timeline === 'soon'
      setQualified(isQualified)
    } else {
      setStep(prev => prev + 1)
    }
  }

  const handleReset = () => {
    setStep(0)
    setAnswers({})
    setQualified(null)
    setShowScheduler(false)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      {qualified === null && (
        <>
          <div className="flex justify-between text-xs text-zinc-500 mb-4">
            <span>Quick assessment</span>
            <span>{step + 1}/{qualQuestions.length}</span>
          </div>
          <h3 className="text-lg text-white font-medium mb-4">{currentQuestion?.question}</h3>
          <div className="space-y-2">
            {currentQuestion?.options.map(option => (
              <button key={option.value} onClick={() => handleAnswer(option.value)} className="w-full p-3 text-left bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-lg text-white">
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}

      {qualified === true && !showScheduler && (
        <div className="text-center">
          <p className="text-green-400 text-sm mb-2">EZ Cycle Ramp looks like a great fit!</p>
          <h3 className="text-lg text-white font-medium mb-4">Schedule a Free Consultation</h3>
          <div className="bg-zinc-800 rounded-lg p-3 text-left text-sm text-zinc-400 mb-4">
            <p>In 5 minutes, we&apos;ll:</p>
            <ul className="mt-2 space-y-1">
              <li>✓ Verify compatibility</li>
              <li>✓ Recommend the right model</li>
              <li>✓ Answer your questions</li>
            </ul>
          </div>
          <button onClick={() => setShowScheduler(true)} className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg mb-2">
            Schedule Consultation
          </button>
          <button onClick={handleReset} className="text-zinc-500 hover:text-white text-sm">Start over</button>
        </div>
      )}

      {qualified === true && showScheduler && (
        <div className="text-center">
          <Check className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg text-white font-medium mb-2">You&apos;re Booked!</h3>
          <p className="text-zinc-400 text-sm mb-4">We&apos;ll call you soon.</p>
          <button onClick={handleReset} className="text-zinc-500 hover:text-white text-sm">Start over</button>
        </div>
      )}

      {qualified === false && (
        <div className="text-center">
          <h3 className="text-lg text-white font-medium mb-4">Explore at Your Own Pace</h3>
          <div className="space-y-2 mb-4">
            <button className="w-full p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white text-left text-sm">📖 How it works</button>
            <button className="w-full p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white text-left text-sm">🎥 Watch demo</button>
            <button className="w-full p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white text-left text-sm">❓ FAQ</button>
          </div>
          <button onClick={handleReset} className="text-zinc-500 hover:text-white text-sm">Start over</button>
        </div>
      )}
    </div>
  )
}

// ============================================
// OPTION 3D: HYBRID CONFIDENCE (Simplified)
// ============================================

function Option3DHybridConfidence() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ReturnType<typeof calculateRecommendation> | null>(null)
  const [confidence, setConfidence] = useState<'likely' | 'verified'>('likely')

  const currentQuestion = QUESTIONS[step]

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value }
    setAnswers(newAnswers)

    if (step + 1 >= QUESTIONS.length) {
      setResult(calculateRecommendation(newAnswers))
    } else {
      setStep(prev => prev + 1)
    }
  }

  const handleReset = () => {
    setStep(0)
    setAnswers({})
    setResult(null)
    setConfidence('likely')
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      {!result ? (
        <>
          <div className="flex justify-between text-xs text-zinc-500 mb-4">
            <span>Quick Check</span>
            <span>{step + 1}/{QUESTIONS.length}</span>
          </div>
          <h3 className="text-lg text-white font-medium mb-4">{currentQuestion?.question}</h3>
          <div className="space-y-2">
            {currentQuestion?.options.map(option => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className="w-full p-3 text-left bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-lg text-white"
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div>
          {/* Confidence meter */}
          <div className="bg-zinc-800 rounded-lg p-3 mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className={confidence === 'verified' ? 'text-green-500' : 'text-amber-500'}>
                {confidence === 'verified' ? 'Verified Fit' : 'Likely Fit'}
              </span>
              <span className="text-zinc-500">{confidence === 'verified' ? '95%' : '60%'}</span>
            </div>
            <div className="h-2 bg-zinc-700 rounded-full">
              <div className={`h-full rounded-full transition-all ${confidence === 'verified' ? 'w-[95%] bg-green-500' : 'w-[60%] bg-amber-500'}`} />
            </div>
          </div>

          <div className={`text-center p-4 rounded-lg mb-4 ${confidence === 'verified' ? 'bg-green-500/10 border border-green-500/30' : 'bg-zinc-800'}`}>
            <h3 className="text-xl font-bold text-white mb-1">
              {result.recommendation === 'AUN200' ? 'AUN 200' : result.recommendation === 'AUN250' ? 'AUN 250' : 'Custom'}
            </h3>
            {result.price && <p className="text-2xl font-bold text-white">${result.price.toLocaleString()}</p>}
          </div>

          {confidence === 'likely' && (
            <button
              onClick={() => setConfidence('verified')}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg mb-3"
            >
              Upgrade to Verified Fit
            </button>
          )}

          {confidence === 'verified' && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-3">
              <p className="text-green-400 text-sm font-medium">Fit Guarantee Unlocked</p>
              <p className="text-zinc-400 text-xs">If it doesn&apos;t fit, we pay return shipping.</p>
            </div>
          )}

          <button onClick={handleReset} className="w-full text-zinc-500 hover:text-white text-sm">Start over</button>
        </div>
      )}
    </div>
  )
}

// ============================================
// DEMO OPTIONS DATA
// ============================================

const DEMO_OPTIONS = [
  // Category 1: UI Polish
  {
    id: '1a',
    category: 'UI Polish',
    name: 'Polished Animations',
    description: 'Spring physics, staggered reveals, animated progress bar with glow effect',
    pros: ['Smooth micro-interactions', 'Premium feel', 'Clear visual feedback'],
    cons: ['More complex code', 'Potential performance on low-end devices'],
    component: Option1APolishedAnimations,
  },
  {
    id: '1b',
    category: 'UI Polish',
    name: 'Single Page Flow',
    description: 'All questions visible, completed sections collapse to chips',
    pros: ['See all progress at once', 'Easy to edit previous answers', 'Good for comparison'],
    cons: ['Can feel overwhelming', 'Less focused'],
    component: Option1BSinglePageFlow,
  },
  {
    id: '1c',
    category: 'UI Polish',
    name: 'Card Stack',
    description: 'Stacked cards with depth, swipe/tap to progress',
    pros: ['Mobile-friendly', 'Gamified feel', 'Clean focused UI'],
    cons: ['Limited space for content', 'Less visible progress'],
    component: Option1CCardStack,
  },
  {
    id: '1d',
    category: 'UI Polish',
    name: 'Conversational',
    description: 'Chat-style interface with quick-reply buttons',
    pros: ['Familiar pattern', 'Personal feel', 'Good for support integration'],
    cons: ['Takes more vertical space', 'May feel slow'],
    component: Option1DConversational,
  },
  // Category 2: Tonneau Integration
  {
    id: '2a',
    category: 'Tonneau',
    name: 'Sequential Tonneau',
    description: 'Adds conditional tonneau type and roll direction questions',
    pros: ['Captures tonneau compatibility', 'Conditional questions', 'Shows compatibility in result'],
    cons: ['More questions', 'May slow down quick users'],
    component: Option2ASequentialTonneau,
  },
  {
    id: '2b',
    category: 'Tonneau',
    name: 'Visual Tonneau',
    description: 'Icon-based visual selection for tonneau cover types',
    pros: ['Visual identification', 'Quick selection', 'Modern UI'],
    cons: ['Icons may confuse some users', 'Less detail'],
    component: Option2BVisualTonneau,
  },
  {
    id: '2c',
    category: 'Tonneau',
    name: 'Integrated Bed',
    description: 'Visual truck bed builder with tonneau overlay',
    pros: ['All bed config in one step', 'Visual feedback', 'Intuitive'],
    cons: ['More complex UI', 'Requires more clicks'],
    component: Option2CIntegratedBed,
  },
  {
    id: '2d',
    category: 'Tonneau',
    name: 'Smart Detection',
    description: 'Year/Make/Model dropdown auto-populates bed sizes',
    pros: ['Reduces user uncertainty', 'Professional feel', 'Data-driven'],
    cons: ['Requires truck database', 'More upfront choices'],
    component: Option2DSmartDetection,
  },
  // Category 3: Measurement Confidence
  {
    id: '3a',
    category: 'Confidence',
    name: 'Two Entry Points',
    description: 'Quick Check (30 sec) vs Exact Fit (2 min) paths',
    pros: ['Serves all user intents', 'Clear value prop', 'Captures browsers'],
    cons: ['Decision paralysis risk', 'More to maintain'],
    component: Option3ATwoEntryPoints,
  },
  {
    id: '3b',
    category: 'Confidence',
    name: 'Progressive Disclosure',
    description: 'Quick quiz then optional measurement upgrade on result',
    pros: ['Low friction start', 'Upgrade path clear', 'Shows benefit'],
    cons: ['May miss measurements', 'Two-step feel'],
    component: Option3BProgressiveDisclosure,
  },
  {
    id: '3c',
    category: 'Confidence',
    name: 'Checkout Measurements',
    description: 'Quick recommendation, measurements required at checkout',
    pros: ['Fast to cart', 'Catches misconfigs', 'Ensures accuracy'],
    cons: ['Checkout friction', 'May surprise users'],
    component: Option3CCheckoutMeasurements,
  },
  {
    id: '3d',
    category: 'Confidence',
    name: 'Hybrid Confidence',
    description: 'Visual confidence meter with optional verification upgrade',
    pros: ['Shows value of measurements', 'Unlocks fit guarantee', 'Clear progression'],
    cons: ['Two-step process', 'May delay purchase'],
    component: Option3DHybridConfidence,
  },
  {
    id: '3e',
    category: 'Confidence',
    name: 'Consultant',
    description: 'Qualification quiz leads to consultation scheduling',
    pros: ['High-touch for serious buyers', 'Captures leads', 'Personal service'],
    cons: ['Delays conversion', 'Not for all users'],
    component: Option3EConsultant,
  },
]

// ============================================
// MAIN COMPARISON PAGE
// ============================================

export default function ConfiguratorDemoPage() {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(['1a', '1d'])
  const [viewMode, setViewMode] = useState<'comparison' | 'single'>('comparison')
  const [singleView, setSingleView] = useState('1a')

  const toggleOption = (id: string) => {
    setSelectedOptions(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id)
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id]
      }
      return [...prev, id]
    })
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/configure" className="text-amber-500 hover:text-amber-400 text-sm mb-4 inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Back to Configurator
          </Link>
          <h1 className="text-3xl font-bold text-white mt-2">Configurator UX Options</h1>
          <p className="text-zinc-400 mt-2">Compare different configurator designs side-by-side. Select up to 3 options.</p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setViewMode('comparison')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'comparison' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Side-by-Side
          </button>
          <button
            onClick={() => setViewMode('single')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'single' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Single View
          </button>
        </div>

        {/* Option Selector */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-8">
          <p className="text-zinc-400 text-sm mb-3">Select options to compare:</p>
          <div className="flex flex-wrap gap-2">
            {DEMO_OPTIONS.map(opt => {
              const isSelected = viewMode === 'comparison'
                ? selectedOptions.includes(opt.id)
                : singleView === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => viewMode === 'comparison' ? toggleOption(opt.id) : setSingleView(opt.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-black'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  <span className="opacity-50 mr-1">{opt.id.toUpperCase()}</span>
                  {opt.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Comparison Grid */}
        {viewMode === 'comparison' && (
          <div className={`grid gap-6 ${selectedOptions.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : selectedOptions.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
            {selectedOptions.map(id => {
              const option = DEMO_OPTIONS.find(o => o.id === id)!
              const Component = option.component
              return (
                <div key={id} className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded">{option.category}</span>
                      <h2 className="text-lg font-bold text-white">{option.id.toUpperCase()}: {option.name}</h2>
                    </div>
                    <p className="text-zinc-500 text-sm">{option.description}</p>
                  </div>
                  <Component />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-green-500/10 border border-green-500/20 rounded p-2">
                      <p className="text-green-400 font-medium mb-1">Pros</p>
                      <ul className="text-zinc-400 space-y-0.5">
                        {option.pros.map((pro, i) => <li key={i}>+ {pro}</li>)}
                      </ul>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded p-2">
                      <p className="text-red-400 font-medium mb-1">Cons</p>
                      <ul className="text-zinc-400 space-y-0.5">
                        {option.cons.map((con, i) => <li key={i}>- {con}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Single View */}
        {viewMode === 'single' && (
          <div className="max-w-lg mx-auto">
            {(() => {
              const option = DEMO_OPTIONS.find(o => o.id === singleView)!
              const Component = option.component
              return (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded">{option.category}</span>
                      <h2 className="text-xl font-bold text-white">{option.id.toUpperCase()}: {option.name}</h2>
                    </div>
                    <p className="text-zinc-400">{option.description}</p>
                  </div>
                  <Component />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <p className="text-green-400 font-medium mb-2">Pros</p>
                      <ul className="text-zinc-300 space-y-1">
                        {option.pros.map((pro, i) => <li key={i} className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> {pro}</li>)}
                      </ul>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <p className="text-red-400 font-medium mb-2">Cons</p>
                      <ul className="text-zinc-300 space-y-1">
                        {option.cons.map((con, i) => <li key={i} className="flex items-start gap-2"><X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" /> {con}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* Feature Combination Guide */}
        <div className="mt-12 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Recommended Combinations</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <h3 className="text-amber-500 font-bold mb-2">Quick Polish</h3>
              <p className="text-zinc-400 text-sm mb-3">Enhance current flow with minimal changes</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-500/20 text-amber-500 rounded text-xs flex items-center justify-center font-bold">1A</span>
                  <span className="text-white">Polished animations</span>
                </div>
              </div>
              <p className="text-zinc-500 text-xs mt-3">Effort: Low | Impact: Medium</p>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-4 ring-2 ring-amber-500">
              <h3 className="text-amber-500 font-bold mb-2">Recommended</h3>
              <p className="text-zinc-400 text-sm mb-3">Best balance of UX and conversion</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-500/20 text-amber-500 rounded text-xs flex items-center justify-center font-bold">1A</span>
                  <span className="text-white">Polished animations</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-500/20 text-amber-500 rounded text-xs flex items-center justify-center font-bold">2A</span>
                  <span className="text-white">Tonneau questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-500/20 text-amber-500 rounded text-xs flex items-center justify-center font-bold">3D</span>
                  <span className="text-white">Confidence meter</span>
                </div>
              </div>
              <p className="text-zinc-500 text-xs mt-3">Effort: Medium | Impact: High</p>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-4">
              <h3 className="text-amber-500 font-bold mb-2">Full Rebuild</h3>
              <p className="text-zinc-400 text-sm mb-3">Complete reimagining for max conversion</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-500/20 text-amber-500 rounded text-xs flex items-center justify-center font-bold">2D</span>
                  <span className="text-white">Smart truck detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-500/20 text-amber-500 rounded text-xs flex items-center justify-center font-bold">3A</span>
                  <span className="text-white">Two entry points</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-500/20 text-amber-500 rounded text-xs flex items-center justify-center font-bold">3C</span>
                  <span className="text-white">Checkout verification</span>
                </div>
              </div>
              <p className="text-zinc-500 text-xs mt-3">Effort: High | Impact: Very High</p>
            </div>
          </div>
        </div>

        {/* Link to full analysis */}
        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm mb-2">Full JSX source files available in:</p>
          <code className="text-amber-500 bg-zinc-900 px-3 py-1 rounded text-sm">documents/Configurator Improvements/</code>
        </div>
      </div>
    </div>
  )
}
