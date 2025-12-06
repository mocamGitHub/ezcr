'use client'

// Option 3B: Progressive Disclosure
// Start quick, offer optional measurement refinement on result screen

import React, { useState, FormEvent } from 'react'

interface Option {
  value: string
  label: string
  sublabel?: string
}

interface Question {
  id: string
  question: string
  options: Option[]
}

interface Result {
  recommendation: string
  message: string
  price: number | null
}

interface MeasurementData {
  truckMake: string
  truckModel: string
  truckYear: string
  bedFeet: string
  bedInches: string
  hasTonneau: string
  tonneauType: string
  exactWeight: string
}

const QUICK_QUESTIONS: Question[] = [
  {
    id: 'bedLength',
    question: "What's your truck bed length?",
    options: [
      { value: 'short', label: 'Short bed', sublabel: "5'-5.8'" },
      { value: 'standard', label: 'Standard bed', sublabel: "6'-6.5'" },
      { value: 'long', label: 'Long bed', sublabel: "8'+" },
      { value: 'unsure', label: 'Not sure' },
    ],
  },
  {
    id: 'bikeWeight',
    question: 'Motorcycle weight?',
    options: [
      { value: 'light', label: 'Under 500 lbs' },
      { value: 'medium', label: '500-800 lbs' },
      { value: 'heavy', label: '800-1,200 lbs' },
      { value: 'over', label: 'Over 1,200 lbs' },
    ],
  },
  {
    id: 'tailgate',
    question: 'Need tailgate to close?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
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

  const needsAUN250 = answers.bedLength === 'short' || answers.tailgate === 'yes' || answers.bedLength === 'unsure'

  return {
    recommendation: needsAUN250 ? 'AUN250' : 'AUN200',
    message: needsAUN250
      ? 'The AUN 250 Folding Ramp should work for your setup.'
      : 'The AUN 200 Standard Ramp should work for your setup.',
    price: needsAUN250 ? 2795 : 2495,
  }
}

// Confidence meter component
function ConfidenceMeter({ level }: { level: 'likely' | 'verified' }) {
  const levels: ('likely' | 'verified')[] = ['likely', 'verified']
  const currentIndex = levels.indexOf(level)

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {levels.map((l, i) => (
          <div
            key={l}
            className={`w-8 h-2 rounded-full transition-all ${
              i <= currentIndex
                ? level === 'verified' ? 'bg-green-500' : 'bg-amber-500'
                : 'bg-zinc-700'
            }`}
          />
        ))}
      </div>
      <span className={`text-sm font-medium ${level === 'verified' ? 'text-green-500' : 'text-amber-500'}`}>
        {level === 'verified' ? 'Verified Fit' : 'Likely Fit'}
      </span>
    </div>
  )
}

// Measurement expansion form
function MeasurementForm({ onSubmit, onCancel }: { onSubmit: (data: MeasurementData) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState<MeasurementData>({
    truckMake: '',
    truckModel: '',
    truckYear: '',
    bedFeet: '',
    bedInches: '',
    hasTonneau: '',
    tonneauType: '',
    exactWeight: '',
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const isValid = formData.bedFeet && formData.exactWeight

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Truck Details */}
      <div className="p-4 bg-zinc-800/50 rounded-lg space-y-3">
        <p className="text-zinc-400 text-sm font-medium">Truck Details</p>

        <div className="grid grid-cols-3 gap-2">
          <select
            value={formData.truckMake}
            onChange={(e) => setFormData(prev => ({ ...prev, truckMake: e.target.value }))}
            className="p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:border-amber-500 focus:outline-none"
          >
            <option value="">Make</option>
            {['Ford', 'Chevrolet', 'RAM', 'Toyota', 'GMC', 'Nissan'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Model"
            value={formData.truckModel}
            onChange={(e) => setFormData(prev => ({ ...prev, truckModel: e.target.value }))}
            className="p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:border-amber-500 focus:outline-none"
          />

          <select
            value={formData.truckYear}
            onChange={(e) => setFormData(prev => ({ ...prev, truckYear: e.target.value }))}
            className="p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:border-amber-500 focus:outline-none"
          >
            <option value="">Year</option>
            {Array.from({ length: 10 }, (_, i) => 2024 - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-zinc-500 text-xs mb-1">Exact bed length (measure inside)</p>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Feet"
              value={formData.bedFeet}
              onChange={(e) => setFormData(prev => ({ ...prev, bedFeet: e.target.value }))}
              className="w-20 p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:border-amber-500 focus:outline-none"
            />
            <input
              type="number"
              placeholder="Inches"
              value={formData.bedInches}
              onChange={(e) => setFormData(prev => ({ ...prev, bedInches: e.target.value }))}
              className="w-20 p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tonneau Cover */}
      <div className="p-4 bg-zinc-800/50 rounded-lg space-y-3">
        <p className="text-zinc-400 text-sm font-medium">Tonneau Cover</p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, hasTonneau: 'no' }))}
            className={`flex-1 py-2 rounded text-sm transition-all ${
              formData.hasTonneau === 'no'
                ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-500'
                : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
            }`}
          >
            No Cover
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, hasTonneau: 'yes' }))}
            className={`flex-1 py-2 rounded text-sm transition-all ${
              formData.hasTonneau === 'yes'
                ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-500'
                : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
            }`}
          >
            Has Cover
          </button>
        </div>

        {formData.hasTonneau === 'yes' && (
          <select
            value={formData.tonneauType}
            onChange={(e) => setFormData(prev => ({ ...prev, tonneauType: e.target.value }))}
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
        <p className="text-zinc-400 text-sm font-medium">Motorcycle</p>

        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Weight with gear"
            value={formData.exactWeight}
            onChange={(e) => setFormData(prev => ({ ...prev, exactWeight: e.target.value }))}
            className="flex-1 p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:border-amber-500 focus:outline-none"
          />
          <span className="text-zinc-500 text-sm">lbs</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid}
          className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-lg transition-all"
        >
          Verify Fit
        </button>
      </div>
    </form>
  )
}

export default function Option3BProgressiveDisclosure() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<Result | null>(null)
  const [showMeasurements, setShowMeasurements] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [verifiedData, setVerifiedData] = useState<MeasurementData | null>(null)

  const currentQuestion = QUICK_QUESTIONS[step]

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value }
    setAnswers(newAnswers)

    if (step + 1 >= QUICK_QUESTIONS.length) {
      const rec = calculateRecommendation(newAnswers)
      setResult(rec)
    } else {
      setStep(prev => prev + 1)
    }
  }

  const handleMeasurementSubmit = (data: MeasurementData) => {
    setVerifiedData(data)
    setIsVerified(true)
    setShowMeasurements(false)
  }

  const handleReset = () => {
    setStep(0)
    setAnswers({})
    setResult(null)
    setShowMeasurements(false)
    setIsVerified(false)
    setVerifiedData(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Find Your Ramp</h2>
          <p className="text-amber-500 text-sm">Option 3B: Progressive Disclosure</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">

          {/* Questions phase */}
          {!result && (
            <>
              <div className="flex items-center justify-between mb-6">
                <span className="text-zinc-500 text-sm">Quick questions</span>
                <span className="text-zinc-500 text-sm">{step + 1} of {QUICK_QUESTIONS.length}</span>
              </div>

              <h3 className="text-xl text-white font-medium mb-6">{currentQuestion?.question}</h3>

              <div className="space-y-3">
                {currentQuestion?.options.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(option.value)}
                    className="w-full p-4 text-left bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-lg transition-all"
                  >
                    <span className="text-white font-medium">{option.label}</span>
                    {option.sublabel && (
                      <span className="text-zinc-500 text-sm ml-2">{option.sublabel}</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Result phase */}
          {result && !showMeasurements && (
            <div>
              {/* Confidence indicator */}
              <div className="flex justify-center mb-6">
                <ConfidenceMeter level={isVerified ? 'verified' : 'likely'} />
              </div>

              {/* Result card */}
              <div className={`text-center p-6 rounded-xl mb-6 ${
                isVerified
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-zinc-800/50 border border-zinc-700'
              }`}>
                {verifiedData?.truckMake && (
                  <p className="text-green-400 text-sm mb-2">
                    ✓ Verified for {verifiedData.truckYear} {verifiedData.truckMake} {verifiedData.truckModel}
                  </p>
                )}

                <h3 className="text-2xl font-bold text-white mb-2">
                  {result.recommendation === 'AUN200' ? 'AUN 200' : result.recommendation === 'AUN250' ? 'AUN 250' : 'Custom Solution'}
                </h3>

                <p className={`mb-4 ${isVerified ? 'text-green-400' : 'text-zinc-400'}`}>
                  {isVerified
                    ? 'is a perfect fit for your setup'
                    : 'should work for your setup'
                  }
                </p>

                {result.price && (
                  <p className="text-3xl font-bold text-white">${result.price.toLocaleString()}</p>
                )}
              </div>

              {/* Verified benefits */}
              {isVerified && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                  <p className="text-green-400 font-medium mb-2">Measurement-backed guarantee</p>
                  <p className="text-zinc-400 text-sm">If it doesn&apos;t fit, we pay return shipping</p>
                </div>
              )}

              {/* CTA buttons */}
              <div className="space-y-3">
                {isVerified ? (
                  <button className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-all">
                    Add to Cart — ${result.price?.toLocaleString()}
                  </button>
                ) : (
                  <>
                    <button className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-all">
                      View Product
                    </button>
                  </>
                )}
              </div>

              {/* Measurement expansion prompt */}
              {!isVerified && (
                <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📐</span>
                    <div className="flex-1">
                      <p className="text-white font-medium">Want to verify exact fit?</p>
                      <p className="text-zinc-400 text-sm mt-1">
                        Add measurements for guaranteed compatibility and unlock our fit guarantee.
                      </p>
                      <button
                        onClick={() => setShowMeasurements(true)}
                        className="mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg text-sm transition-all"
                      >
                        Add My Measurements (60 sec)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Email save option */}
              {!isVerified && (
                <div className="mt-6 p-4 bg-zinc-800/50 rounded-lg">
                  <p className="text-zinc-400 text-sm mb-3">Save your configuration?</p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:border-amber-500 focus:outline-none"
                    />
                    <button className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm">
                      Email Me
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Measurement form */}
          {showMeasurements && (
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Verify Your Exact Fit</h3>
              <p className="text-zinc-500 text-sm mb-6">Takes about 60 seconds</p>

              <MeasurementForm
                onSubmit={handleMeasurementSubmit}
                onCancel={() => setShowMeasurements(false)}
              />
            </div>
          )}

          {/* Reset */}
          {result && (
            <button
              onClick={handleReset}
              className="block mx-auto mt-6 text-zinc-500 hover:text-white text-sm"
            >
              Start over
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
