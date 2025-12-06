'use client'

// Option 3D: Hybrid with Confidence Levels
// Single flow with optional measurements that upgrade confidence level

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
  rollDirection: string
  exactWeight: string
  handlebarWidth: string
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

// Confidence meter with visual indicator
function ConfidenceMeter({ level, showUpgrade = false, onUpgrade }: { level: 'likely' | 'verified' | 'expert'; showUpgrade?: boolean; onUpgrade?: () => void }) {
  const levels = {
    likely: { label: 'Likely Fit', percent: 60, color: 'amber' },
    verified: { label: 'Verified Fit', percent: 95, color: 'green' },
    expert: { label: 'Expert Verified', percent: 100, color: 'green' },
  }

  const current = levels[level]

  return (
    <div className="bg-zinc-800/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className={`font-medium ${current.color === 'amber' ? 'text-amber-500' : 'text-green-500'}`}>{current.label}</span>
        <span className="text-zinc-500 text-sm">{current.percent}%</span>
      </div>

      <div className="h-2 bg-zinc-700 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-700 ${current.color === 'amber' ? 'bg-amber-500' : 'bg-green-500'}`}
          style={{ width: `${current.percent}%` }}
        />
      </div>

      {showUpgrade && level === 'likely' && (
        <button
          onClick={onUpgrade}
          className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 text-sm font-medium rounded transition-all"
        >
          Upgrade to Verified Fit
        </button>
      )}

      {level === 'verified' && (
        <p className="text-green-400 text-xs">
          ✓ Measurements confirmed • Fit guarantee unlocked
        </p>
      )}
    </div>
  )
}

// Measurement upgrade form
function MeasurementUpgrade({ onComplete, onSkip }: { onComplete: (data: FormData) => void; onSkip: () => void }) {
  const [formData, setFormData] = useState<FormData>({
    truckMake: '',
    truckModel: '',
    truckYear: '',
    bedFeet: '',
    bedInches: '',
    hasTonneau: '',
    tonneauType: '',
    rollDirection: '',
    exactWeight: '',
    handlebarWidth: '',
  })

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onComplete(formData)
  }

  const isValid = formData.bedFeet && formData.exactWeight
  const showRollDirection = formData.tonneauType?.includes('roll')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Upgrade to Verified Fit</h3>
        <span className="text-zinc-500 text-sm">~60 seconds</span>
      </div>

      <p className="text-zinc-400 text-sm">
        Add your measurements to unlock our fit guarantee and get exact compatibility notes.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Truck */}
        <div className="p-4 bg-zinc-800/30 rounded-lg space-y-3">
          <p className="text-zinc-400 text-xs uppercase tracking-wider">Truck</p>

          <div className="grid grid-cols-3 gap-2">
            <select
              value={formData.truckMake}
              onChange={(e) => handleChange('truckMake', e.target.value)}
              className="p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
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
              onChange={(e) => handleChange('truckModel', e.target.value)}
              className="p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
            />
            <input
              type="number"
              placeholder="Year"
              value={formData.truckYear}
              onChange={(e) => handleChange('truckYear', e.target.value)}
              className="p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-zinc-500 text-xs">Bed length *</label>
              <div className="flex gap-1 mt-1">
                <input
                  type="number"
                  placeholder="ft"
                  value={formData.bedFeet}
                  onChange={(e) => handleChange('bedFeet', e.target.value)}
                  className="w-16 p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                />
                <input
                  type="number"
                  placeholder="in"
                  value={formData.bedInches}
                  onChange={(e) => handleChange('bedInches', e.target.value)}
                  className="w-16 p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tonneau */}
        <div className="p-4 bg-zinc-800/30 rounded-lg space-y-3">
          <p className="text-zinc-400 text-xs uppercase tracking-wider">Tonneau Cover</p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleChange('hasTonneau', 'no')}
              className={`flex-1 py-2 rounded text-sm ${
                formData.hasTonneau === 'no'
                  ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-500'
                  : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
              }`}
            >
              None
            </button>
            <button
              type="button"
              onClick={() => handleChange('hasTonneau', 'yes')}
              className={`flex-1 py-2 rounded text-sm ${
                formData.hasTonneau === 'yes'
                  ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-500'
                  : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
              }`}
            >
              Has Cover
            </button>
          </div>

          {formData.hasTonneau === 'yes' && (
            <>
              <select
                value={formData.tonneauType}
                onChange={(e) => handleChange('tonneauType', e.target.value)}
                className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
              >
                <option value="">Type...</option>
                <option value="roll-up-soft">Roll-up (Soft)</option>
                <option value="roll-up-hard">Roll-up (Hard)</option>
                <option value="tri-fold">Tri-fold</option>
                <option value="bi-fold">Bi-fold</option>
                <option value="hinged">One-piece</option>
                <option value="retractable">Retractable</option>
              </select>

              {showRollDirection && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleChange('rollDirection', 'on-top')}
                    className={`flex-1 py-2 rounded text-xs ${
                      formData.rollDirection === 'on-top'
                        ? 'bg-amber-500/20 border border-amber-500 text-amber-500'
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                    }`}
                  >
                    Rolls on top
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('rollDirection', 'into-bed')}
                    className={`flex-1 py-2 rounded text-xs ${
                      formData.rollDirection === 'into-bed'
                        ? 'bg-amber-500/20 border border-amber-500 text-amber-500'
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                    }`}
                  >
                    Rolls into bed
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Motorcycle */}
        <div className="p-4 bg-zinc-800/30 rounded-lg space-y-3">
          <p className="text-zinc-400 text-xs uppercase tracking-wider">Motorcycle</p>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-zinc-500 text-xs">Weight with gear *</label>
              <div className="flex gap-1 mt-1">
                <input
                  type="number"
                  placeholder="lbs"
                  value={formData.exactWeight}
                  onChange={(e) => handleChange('exactWeight', e.target.value)}
                  className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-zinc-500 text-xs">Handlebar width</label>
              <div className="flex gap-1 mt-1">
                <input
                  type="number"
                  placeholder="inches"
                  value={formData.handlebarWidth}
                  onChange={(e) => handleChange('handlebarWidth', e.target.value)}
                  className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg"
          >
            Skip for now
          </button>
          <button
            type="submit"
            disabled={!isValid}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-lg"
          >
            Verify Fit
          </button>
        </div>
      </form>
    </div>
  )
}

export default function Option3DHybridConfidence() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<Result | null>(null)
  const [confidenceLevel, setConfidenceLevel] = useState<'likely' | 'verified' | 'expert'>('likely')
  const [showMeasurementUpgrade, setShowMeasurementUpgrade] = useState(false)
  const [verifiedData, setVerifiedData] = useState<FormData | null>(null)

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

  const handleMeasurementComplete = (data: FormData) => {
    setVerifiedData(data)
    setConfidenceLevel('verified')
    setShowMeasurementUpgrade(false)
  }

  const handleReset = () => {
    setStep(0)
    setAnswers({})
    setResult(null)
    setConfidenceLevel('likely')
    setShowMeasurementUpgrade(false)
    setVerifiedData(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Find Your Ramp</h2>
          <p className="text-amber-500 text-sm">Option 3D: Hybrid with Confidence Levels</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">

          {/* Quick Questions Phase */}
          {!result && !showMeasurementUpgrade && (
            <>
              <div className="flex items-center justify-between mb-6">
                <span className="text-zinc-500 text-sm">Quick Check</span>
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

          {/* Result Phase */}
          {result && !showMeasurementUpgrade && (
            <div>
              {/* Confidence Meter */}
              <div className="mb-6">
                <ConfidenceMeter
                  level={confidenceLevel}
                  showUpgrade={confidenceLevel === 'likely'}
                  onUpgrade={() => setShowMeasurementUpgrade(true)}
                />
              </div>

              {/* Result Card */}
              <div className={`text-center p-6 rounded-xl mb-6 ${
                confidenceLevel === 'verified'
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-zinc-800/50 border border-zinc-700'
              }`}>
                {/* Verified truck info */}
                {verifiedData?.truckMake && (
                  <p className="text-green-400 text-sm mb-2">
                    Verified for {verifiedData.truckYear} {verifiedData.truckMake} {verifiedData.truckModel}
                  </p>
                )}

                <h3 className="text-2xl font-bold text-white mb-2">
                  {result.recommendation === 'AUN200' ? 'AUN 200' : result.recommendation === 'AUN250' ? 'AUN 250' : 'Custom'}
                </h3>

                <p className={`mb-4 ${confidenceLevel === 'verified' ? 'text-green-400' : 'text-amber-500'}`}>
                  {confidenceLevel === 'verified'
                    ? '✓ Confirmed perfect fit'
                    : 'should work for your setup'
                  }
                </p>

                {result.price && (
                  <p className="text-3xl font-bold text-white">${result.price.toLocaleString()}</p>
                )}
              </div>

              {/* Verified benefits */}
              {confidenceLevel === 'verified' && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-green-400 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="font-medium">Fit Guarantee Unlocked</span>
                  </div>
                  <p className="text-zinc-400 text-sm">
                    If it doesn&apos;t fit your verified setup, we pay return shipping.
                  </p>
                </div>
              )}

              {/* CTA */}
              {confidenceLevel === 'verified' ? (
                <button className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-all">
                  Add to Cart — ${result.price?.toLocaleString()}
                </button>
              ) : (
                <div className="space-y-3">
                  <button className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-all">
                    View Product
                  </button>
                  <button
                    onClick={() => setShowMeasurementUpgrade(true)}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    Get Verified Fit + Guarantee
                  </button>
                </div>
              )}

              {/* Email save for likely fit */}
              {confidenceLevel === 'likely' && (
                <div className="mt-6 p-4 bg-zinc-800/50 rounded-lg">
                  <p className="text-zinc-400 text-sm mb-3">Save this recommendation?</p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                    />
                    <button className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm">
                      Email Me
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleReset}
                className="block mx-auto mt-6 text-zinc-500 hover:text-white text-sm"
              >
                Start over
              </button>
            </div>
          )}

          {/* Measurement Upgrade Phase */}
          {showMeasurementUpgrade && (
            <MeasurementUpgrade
              onComplete={handleMeasurementComplete}
              onSkip={() => setShowMeasurementUpgrade(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
