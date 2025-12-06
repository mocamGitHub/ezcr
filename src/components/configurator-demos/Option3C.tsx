'use client'

// Option 3C: Measurements at Checkout
// Quick configurator for recommendation, measurements required at checkout

import React, { useState } from 'react'

interface Option {
  value: string
  label: string
}

interface Question {
  id: string
  question: string
  options: Option[]
}

interface Result {
  recommendation: string
  price: number | null
}

interface FormData {
  truckMake: string
  truckModel: string
  truckYear: string
  bedFeet: string
  bedInches: string
  hasTonneau: string
  tonneauType: string
  bikeWeight: string
}

const QUICK_QUESTIONS: Question[] = [
  {
    id: 'bedLength',
    question: 'Truck bed size?',
    options: [
      { value: 'short', label: "Short (5'-5.8')" },
      { value: 'standard', label: "Standard (6'-6.5')" },
      { value: 'long', label: "Long (8'+)" },
      { value: 'unsure', label: 'Not sure' },
    ],
  },
  {
    id: 'bikeWeight',
    question: 'Motorcycle weight?',
    options: [
      { value: 'light', label: 'Under 700 lbs' },
      { value: 'heavy', label: '700-1,200 lbs' },
      { value: 'over', label: 'Over 1,200 lbs' },
    ],
  },
  {
    id: 'tailgate',
    question: 'Tailgate must close?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
]

function calculateRecommendation(answers: Record<string, string>): Result {
  if (answers.bikeWeight === 'over') {
    return { recommendation: 'custom', price: null }
  }

  const needsAUN250 = answers.bedLength === 'short' || answers.tailgate === 'yes' || answers.bedLength === 'unsure'
  return {
    recommendation: needsAUN250 ? 'AUN250' : 'AUN200',
    price: needsAUN250 ? 2795 : 2495,
  }
}

// Quick Configurator (Step 1)
function QuickConfigurator({ onAddToCart }: { onAddToCart: (result: Result) => void }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<Result | null>(null)

  const currentQuestion = QUICK_QUESTIONS[step]

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value }
    setAnswers(newAnswers)

    if (step + 1 >= QUICK_QUESTIONS.length) {
      setResult(calculateRecommendation(newAnswers))
    } else {
      setStep(prev => prev + 1)
    }
  }

  if (result) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-amber-500/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h3 className="text-2xl font-bold text-white mb-2">
          {result.recommendation === 'AUN200' ? 'AUN 200' : result.recommendation === 'AUN250' ? 'AUN 250' : 'Custom Solution'}
        </h3>
        <p className="text-zinc-400 mb-4">is right for your setup</p>

        {result.price && (
          <p className="text-3xl font-bold text-white mb-6">${result.price.toLocaleString()}</p>
        )}

        {/* Product highlights */}
        <div className="grid grid-cols-3 gap-4 mb-6 text-center">
          <div className="p-3 bg-zinc-800 rounded-lg">
            <p className="text-amber-500 font-bold">1,200 lb</p>
            <p className="text-zinc-500 text-xs">Capacity</p>
          </div>
          <div className="p-3 bg-zinc-800 rounded-lg">
            <p className="text-amber-500 font-bold">Electric</p>
            <p className="text-zinc-500 text-xs">Powered</p>
          </div>
          <div className="p-3 bg-zinc-800 rounded-lg">
            <p className="text-amber-500 font-bold">Free</p>
            <p className="text-zinc-500 text-xs">Shipping</p>
          </div>
        </div>

        <button
          onClick={() => onAddToCart(result)}
          className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-all"
        >
          Add to Cart
        </button>

        <p className="text-zinc-500 text-xs mt-4">
          We&apos;ll verify your exact measurements at checkout
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <span className="text-zinc-500 text-sm">Quick recommendation</span>
        <span className="text-zinc-500 text-sm">{step + 1} of {QUICK_QUESTIONS.length}</span>
      </div>

      <h3 className="text-xl text-white font-medium mb-6">{currentQuestion?.question}</h3>

      <div className="grid grid-cols-2 gap-3">
        {currentQuestion?.options.map(option => (
          <button
            key={option.value}
            onClick={() => handleAnswer(option.value)}
            className="p-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-lg transition-all text-center"
          >
            <span className="text-white font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Checkout Fit Verification (Step 2)
function CheckoutFitVerification({ product, onContinue, onBack }: { product: Result; onContinue: () => void; onBack: () => void }) {
  const [formData, setFormData] = useState<FormData>({
    truckMake: '',
    truckModel: '',
    truckYear: '',
    bedFeet: '',
    bedInches: '',
    hasTonneau: '',
    tonneauType: '',
    bikeWeight: '',
  })
  const [fitStatus, setFitStatus] = useState<null | 'checking' | 'verified' | 'mismatch'>(null)

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setFitStatus(null)
  }

  const verifyFit = () => {
    setFitStatus('checking')

    // Simulate verification
    setTimeout(() => {
      const totalInches = (parseInt(formData.bedFeet) * 12) + parseInt(formData.bedInches || '0')
      const weight = parseInt(formData.bikeWeight)

      // Check for issues
      if (weight > 1200) {
        setFitStatus('mismatch')
        return
      }

      if (product.recommendation === 'AUN200' && totalInches < 70) {
        setFitStatus('mismatch')
        return
      }

      setFitStatus('verified')
    }, 1500)
  }

  const isFormValid = formData.truckMake && formData.bedFeet && formData.bikeWeight

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-zinc-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <p className="text-zinc-500 text-sm">Checkout Step 1 of 3</p>
          <h3 className="text-lg font-medium text-white">Verify Your Fit</h3>
        </div>
      </div>

      <p className="text-zinc-400 text-sm mb-6">
        Before we ship your {product.recommendation === 'AUN200' ? 'AUN 200' : 'AUN 250'}, let&apos;s confirm it&apos;s perfect for your truck.
      </p>

      {/* Form */}
      <div className="space-y-4">
        {/* Truck Info */}
        <div className="p-4 bg-zinc-800/50 rounded-lg space-y-3">
          <p className="text-zinc-400 text-sm font-medium">Your Truck</p>

          <div className="grid grid-cols-3 gap-2">
            <select
              value={formData.truckMake}
              onChange={(e) => handleInputChange('truckMake', e.target.value)}
              className="p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:border-amber-500 focus:outline-none"
            >
              <option value="">Make *</option>
              {['Ford', 'Chevrolet', 'RAM', 'Toyota', 'GMC', 'Nissan'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Model"
              value={formData.truckModel}
              onChange={(e) => handleInputChange('truckModel', e.target.value)}
              className="p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:border-amber-500 focus:outline-none"
            />

            <select
              value={formData.truckYear}
              onChange={(e) => handleInputChange('truckYear', e.target.value)}
              className="p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:border-amber-500 focus:outline-none"
            >
              <option value="">Year</option>
              {Array.from({ length: 15 }, (_, i) => 2024 - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-zinc-500 text-xs mb-1">Bed Length (measure inside, bulkhead to tailgate) *</p>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Feet"
                value={formData.bedFeet}
                onChange={(e) => handleInputChange('bedFeet', e.target.value)}
                className="w-24 p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:border-amber-500 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Inches"
                value={formData.bedInches}
                onChange={(e) => handleInputChange('bedInches', e.target.value)}
                className="w-24 p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>
            <button className="text-amber-500 text-xs mt-1 hover:underline">
              How to measure your bed
            </button>
          </div>
        </div>

        {/* Tonneau */}
        <div className="p-4 bg-zinc-800/50 rounded-lg space-y-3">
          <p className="text-zinc-400 text-sm font-medium">Tonneau Cover</p>

          <div className="flex gap-2">
            {['no', 'yes'].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => handleInputChange('hasTonneau', val)}
                className={`flex-1 py-2 rounded text-sm transition-all ${
                  formData.hasTonneau === val
                    ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-500'
                    : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                }`}
              >
                {val === 'no' ? 'No Cover' : 'Has Cover'}
              </button>
            ))}
          </div>

          {formData.hasTonneau === 'yes' && (
            <select
              value={formData.tonneauType}
              onChange={(e) => handleInputChange('tonneauType', e.target.value)}
              className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:border-amber-500 focus:outline-none"
            >
              <option value="">Select type...</option>
              <option value="roll-up">Roll-up</option>
              <option value="tri-fold">Tri-fold</option>
              <option value="bi-fold">Bi-fold</option>
              <option value="hinged">One-piece</option>
              <option value="retractable">Retractable</option>
            </select>
          )}
        </div>

        {/* Motorcycle */}
        <div className="p-4 bg-zinc-800/50 rounded-lg space-y-3">
          <p className="text-zinc-400 text-sm font-medium">Your Motorcycle</p>

          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder="Weight with gear *"
              value={formData.bikeWeight}
              onChange={(e) => handleInputChange('bikeWeight', e.target.value)}
              className="flex-1 p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:border-amber-500 focus:outline-none"
            />
            <span className="text-zinc-500 text-sm">lbs</span>
          </div>
          <button className="text-amber-500 text-xs hover:underline">
            Find your bike&apos;s weight
          </button>
        </div>

        {/* Fit Check */}
        {fitStatus === 'checking' && (
          <div className="p-4 bg-zinc-800 rounded-lg text-center">
            <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-zinc-400 text-sm">Verifying fit...</p>
          </div>
        )}

        {fitStatus === 'verified' && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Fit Verified!</span>
            </div>
            <ul className="space-y-1 text-sm text-zinc-300">
              <li>✓ Bed length: {formData.bedFeet}&apos; {formData.bedInches}&quot; — Compatible</li>
              <li>✓ Bike weight: {formData.bikeWeight} lbs — Within capacity</li>
              {formData.hasTonneau === 'yes' && (
                <li>✓ Tonneau cover: Compatible</li>
              )}
            </ul>
          </div>
        )}

        {fitStatus === 'mismatch' && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <span>⚠️</span>
              <span className="font-medium">Let&apos;s Double-Check</span>
            </div>
            <p className="text-zinc-400 text-sm mb-3">
              Your measurements suggest a different model might be better.
            </p>
            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded text-sm">
                Switch to AUN 250
              </button>
              <button className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm">
                Talk to Expert
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        {!fitStatus && (
          <button
            onClick={verifyFit}
            disabled={!isFormValid}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-lg transition-all"
          >
            Verify Fit
          </button>
        )}

        {fitStatus === 'verified' && (
          <button
            onClick={onContinue}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-all"
          >
            Continue to Shipping →
          </button>
        )}

        {/* Help */}
        <p className="text-center text-zinc-500 text-sm">
          Not sure about measurements?{' '}
          <button className="text-amber-500 hover:underline">Chat with us</button>
        </p>
      </div>
    </div>
  )
}

export default function Option3CMeasurementsAtCheckout() {
  const [stage, setStage] = useState<'configurator' | 'checkout'>('configurator')
  const [selectedProduct, setSelectedProduct] = useState<Result | null>(null)

  const handleAddToCart = (product: Result) => {
    setSelectedProduct(product)
    setStage('checkout')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            {stage === 'configurator' ? 'Find Your Ramp' : 'Checkout'}
          </h2>
          <p className="text-amber-500 text-sm">Option 3C: Measurements at Checkout</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">
          {stage === 'configurator' && (
            <QuickConfigurator onAddToCart={handleAddToCart} />
          )}

          {stage === 'checkout' && selectedProduct && (
            <CheckoutFitVerification
              product={selectedProduct}
              onContinue={() => alert('Continue to shipping step')}
              onBack={() => setStage('configurator')}
            />
          )}
        </div>
      </div>
    </div>
  )
}
