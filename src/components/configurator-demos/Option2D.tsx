'use client'

// Option 2D: Smart Detection with Truck Make/Model
// Auto-populates specs based on truck selection

import React, { useState, useMemo } from 'react'

interface BedSize {
  length: string
  label: string
  inches: number
}

interface TruckModel {
  years: number[]
  beds: BedSize[]
  popularCovers?: string[]
}

interface TruckMake {
  [model: string]: TruckModel
}

interface TruckDatabase {
  [make: string]: TruckMake
}

interface TonneauType {
  value: string
  label: string
}

interface TruckSelection {
  make: string
  model: string
  year: string
  bedLength: string
}

interface Result {
  recommendation: string
  message: string
  price: number | null
}

// Truck database
const TRUCK_DATABASE: TruckDatabase = {
  Ford: {
    'F-150': {
      years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      beds: [
        { length: 'short', label: "5.5' Short Bed", inches: 67 },
        { length: 'standard', label: "6.5' Standard Bed", inches: 78 },
        { length: 'long', label: "8' Long Bed", inches: 97 },
      ],
      popularCovers: ['BakFlip MX4', 'TruXedo TruXport', 'Extang Trifecta'],
    },
    'F-250': {
      years: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      beds: [
        { length: 'standard', label: "6.75' Standard Bed", inches: 81 },
        { length: 'long', label: "8' Long Bed", inches: 98 },
      ],
    },
    'Ranger': {
      years: [2019, 2020, 2021, 2022, 2023, 2024],
      beds: [
        { length: 'short', label: "5' Short Bed", inches: 61 },
        { length: 'standard', label: "6' Standard Bed", inches: 72 },
      ],
    },
  },
  Chevrolet: {
    'Silverado 1500': {
      years: [2019, 2020, 2021, 2022, 2023, 2024],
      beds: [
        { length: 'short', label: "5.8' Short Bed", inches: 69.9 },
        { length: 'standard', label: "6.5' Standard Bed", inches: 79.4 },
        { length: 'long', label: "8' Long Bed", inches: 98 },
      ],
    },
    'Colorado': {
      years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      beds: [
        { length: 'short', label: "5' Short Bed", inches: 61.7 },
        { length: 'standard', label: "6.2' Long Bed", inches: 74.4 },
      ],
    },
  },
  RAM: {
    '1500': {
      years: [2019, 2020, 2021, 2022, 2023, 2024],
      beds: [
        { length: 'short', label: "5.7' Short Bed", inches: 67.4 },
        { length: 'standard', label: "6.4' Standard Bed", inches: 76.3 },
      ],
    },
    '2500': {
      years: [2019, 2020, 2021, 2022, 2023, 2024],
      beds: [
        { length: 'standard', label: "6.4' Standard Bed", inches: 76.3 },
        { length: 'long', label: "8' Long Bed", inches: 98.3 },
      ],
    },
  },
  Toyota: {
    'Tundra': {
      years: [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      beds: [
        { length: 'short', label: "5.5' Short Bed", inches: 66.7 },
        { length: 'standard', label: "6.5' Standard Bed", inches: 78.7 },
        { length: 'long', label: "8.1' Long Bed", inches: 97.6 },
      ],
    },
    'Tacoma': {
      years: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      beds: [
        { length: 'short', label: "5' Short Bed", inches: 60.5 },
        { length: 'standard', label: "6' Long Bed", inches: 73.7 },
      ],
    },
  },
  GMC: {
    'Sierra 1500': {
      years: [2019, 2020, 2021, 2022, 2023, 2024],
      beds: [
        { length: 'short', label: "5.8' Short Bed", inches: 69.9 },
        { length: 'standard', label: "6.5' Standard Bed", inches: 79.4 },
        { length: 'long', label: "8' Long Bed", inches: 98 },
      ],
    },
  },
  Nissan: {
    'Titan': {
      years: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      beds: [
        { length: 'short', label: "5.5' Short Bed", inches: 67 },
        { length: 'standard', label: "6.5' Standard Bed", inches: 78.7 },
      ],
    },
    'Frontier': {
      years: [2022, 2023, 2024],
      beds: [
        { length: 'short', label: "5' Short Bed", inches: 59.5 },
        { length: 'standard', label: "6' Long Bed", inches: 73.2 },
      ],
    },
  },
}

const MAKES = Object.keys(TRUCK_DATABASE)

const TONNEAU_TYPES: TonneauType[] = [
  { value: 'none', label: 'No Cover' },
  { value: 'roll-up-soft', label: 'Roll-up (Soft)' },
  { value: 'roll-up-hard', label: 'Roll-up (Hard)' },
  { value: 'tri-fold-soft', label: 'Tri-fold (Soft)' },
  { value: 'tri-fold-hard', label: 'Tri-fold (Hard)' },
  { value: 'bi-fold', label: 'Bi-fold' },
  { value: 'hinged', label: 'One-piece (Hinged)' },
  { value: 'retractable', label: 'Retractable' },
]

export default function Option2DSmartDetection() {
  const [step, setStep] = useState(0)
  const [truckSelection, setTruckSelection] = useState<TruckSelection>({
    make: '',
    model: '',
    year: '',
    bedLength: '',
  })
  const [manualEntry, setManualEntry] = useState(false)
  const [tonneauType, setTonneauType] = useState('none')
  const [rollDirection, setRollDirection] = useState<string | null>(null)
  const [bikeWeight, setBikeWeight] = useState<string | null>(null)
  const [tailgateRequired, setTailgateRequired] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  // Derived data
  const models = useMemo(() => {
    if (!truckSelection.make) return []
    return Object.keys(TRUCK_DATABASE[truckSelection.make] || {})
  }, [truckSelection.make])

  const truckData = useMemo(() => {
    if (!truckSelection.make || !truckSelection.model) return null
    return TRUCK_DATABASE[truckSelection.make]?.[truckSelection.model]
  }, [truckSelection.make, truckSelection.model])

  const beds = truckData?.beds || []
  const popularCovers = truckData?.popularCovers || []

  const showRollDirection = tonneauType?.includes('roll-up')

  const handleTruckContinue = () => {
    setStep(1)
  }

  const handleTonneauContinue = () => {
    setStep(2)
  }

  const handleBikeWeight = (weight: string) => {
    setBikeWeight(weight)
    if (weight === 'over') {
      setResult({ recommendation: 'custom', message: 'Contact us for custom solutions.', price: null })
      setStep(4)
    } else {
      setStep(3)
    }
  }

  const handleTailgate = (required: string) => {
    setTailgateRequired(required)

    const selectedBed = beds.find(b => b.length === truckSelection.bedLength)
    const isShortBed = truckSelection.bedLength === 'short' || (selectedBed?.inches || 0) < 70
    const needsAUN250 = isShortBed || required === 'yes' || (rollDirection === 'into-bed' && truckSelection.bedLength !== 'long')

    setResult({
      recommendation: needsAUN250 ? 'AUN250' : 'AUN200',
      message: needsAUN250
        ? 'The AUN 250 Folding Ramp is perfect for your setup.'
        : 'The AUN 200 Standard Ramp is ideal for your truck.',
      price: needsAUN250 ? 2795 : 2495,
    })
    setStep(4)
  }

  const handleReset = () => {
    setStep(0)
    setTruckSelection({ make: '', model: '', year: '', bedLength: '' })
    setManualEntry(false)
    setTonneauType('none')
    setRollDirection(null)
    setBikeWeight(null)
    setTailgateRequired(null)
    setResult(null)
  }

  const truckDescription = truckSelection.year && truckSelection.make && truckSelection.model
    ? `${truckSelection.year} ${truckSelection.make} ${truckSelection.model}`
    : ''

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Find Your Perfect Ramp</h2>
          <p className="text-amber-500 text-sm">Option 2D: Smart Truck Detection</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">

          {/* Step 0: Truck Selection */}
          {step === 0 && (
            <div>
              <h3 className="text-lg font-medium text-white mb-6">Tell us about your truck</h3>

              {!manualEntry ? (
                <>
                  {/* Make/Model/Year selectors */}
                  <div className="space-y-4">
                    {/* Year */}
                    <div>
                      <label className="text-zinc-400 text-sm mb-2 block">Year</label>
                      <select
                        value={truckSelection.year}
                        onChange={(e) => setTruckSelection(prev => ({ ...prev, year: e.target.value }))}
                        className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value="">Select year...</option>
                        {Array.from({ length: 15 }, (_, i) => 2024 - i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>

                    {/* Make */}
                    <div>
                      <label className="text-zinc-400 text-sm mb-2 block">Make</label>
                      <select
                        value={truckSelection.make}
                        onChange={(e) => setTruckSelection(prev => ({
                          ...prev,
                          make: e.target.value,
                          model: '',
                          bedLength: ''
                        }))}
                        className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value="">Select make...</option>
                        {MAKES.map(make => (
                          <option key={make} value={make}>{make}</option>
                        ))}
                      </select>
                    </div>

                    {/* Model */}
                    <div>
                      <label className="text-zinc-400 text-sm mb-2 block">Model</label>
                      <select
                        value={truckSelection.model}
                        onChange={(e) => setTruckSelection(prev => ({
                          ...prev,
                          model: e.target.value,
                          bedLength: ''
                        }))}
                        disabled={!truckSelection.make}
                        className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-amber-500 focus:outline-none disabled:opacity-50"
                      >
                        <option value="">Select model...</option>
                        {models.map(model => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    </div>

                    {/* Bed Length - auto-populated */}
                    {beds.length > 0 && (
                      <div>
                        <label className="text-zinc-400 text-sm mb-2 block">
                          Bed Length
                          <span className="text-amber-500 ml-2">← Select yours</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {beds.map(bed => (
                            <button
                              key={bed.length}
                              onClick={() => setTruckSelection(prev => ({ ...prev, bedLength: bed.length }))}
                              className={`p-3 rounded-lg border-2 transition-all text-sm ${
                                truckSelection.bedLength === bed.length
                                  ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                                  : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                              }`}
                            >
                              <span className="font-medium block">{bed.label}</span>
                            </button>
                          ))}
                        </div>
                        {truckDescription && (
                          <p className="text-zinc-500 text-xs mt-2">
                            💡 {truckDescription}s come in {beds.length} bed size{beds.length > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setManualEntry(true)}
                      className="text-zinc-500 hover:text-white text-sm"
                    >
                      My truck isn&apos;t listed / Enter manually
                    </button>
                  </div>
                </>
              ) : (
                /* Manual entry fallback */
                <div className="space-y-4">
                  <p className="text-zinc-400 text-sm mb-4">Enter your bed length manually:</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'short', label: 'Short', sublabel: "5'-5.8'" },
                      { value: 'standard', label: 'Standard', sublabel: "6'-6.5'" },
                      { value: 'long', label: 'Long', sublabel: "8'+" },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setTruckSelection(prev => ({
                          ...prev,
                          bedLength: opt.value,
                          make: 'Other',
                          model: 'Manual Entry',
                          year: new Date().getFullYear().toString()
                        }))}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          truckSelection.bedLength === opt.value
                            ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                            : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                        }`}
                      >
                        <span className="font-medium block">{opt.label}</span>
                        <span className="text-xs opacity-70">{opt.sublabel}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setManualEntry(false)}
                    className="text-zinc-500 hover:text-white text-sm"
                  >
                    ← Back to truck selection
                  </button>
                </div>
              )}

              <button
                onClick={handleTruckContinue}
                disabled={!truckSelection.bedLength}
                className="w-full mt-6 py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-lg transition-all"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 1: Tonneau Cover */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Do you have a tonneau cover?</h3>
              {truckDescription && (
                <p className="text-zinc-500 text-sm mb-6">Configuring for your {truckDescription}</p>
              )}

              {/* Popular covers suggestion */}
              {popularCovers.length > 0 && tonneauType === 'none' && (
                <div className="mb-4 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <p className="text-zinc-400 text-xs mb-2">Popular covers for your {truckSelection.model}:</p>
                  <div className="flex flex-wrap gap-2">
                    {popularCovers.map(cover => (
                      <span key={cover} className="px-2 py-1 bg-zinc-700 text-zinc-300 text-xs rounded">
                        {cover}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {TONNEAU_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setTonneauType(type.value)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      tonneauType === type.value
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <span className={`font-medium ${tonneauType === type.value ? 'text-amber-500' : 'text-white'}`}>
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Roll direction if needed */}
              {showRollDirection && (
                <div className="mt-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <label className="text-zinc-400 text-sm mb-3 block">When rolled up, where does it go?</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'on-top', label: 'On top of rails', sublabel: 'No space lost' },
                      { value: 'into-bed', label: 'Into the bed', sublabel: '-8" space' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setRollDirection(opt.value)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          rollDirection === opt.value
                            ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                            : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        <span className="font-medium block text-sm">{opt.label}</span>
                        <span className="text-xs opacity-70">{opt.sublabel}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleTonneauContinue}
                disabled={showRollDirection && !rollDirection}
                className="w-full mt-6 py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-lg transition-all"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Bike Weight */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-medium text-white mb-6">Motorcycle weight?</h3>
              <div className="space-y-3">
                {[
                  { value: 'light', label: 'Under 500 lbs', sublabel: 'Sport, dirt bikes' },
                  { value: 'medium', label: '500-800 lbs', sublabel: 'Cruisers' },
                  { value: 'heavy', label: '800-1,200 lbs', sublabel: 'Touring bikes' },
                  { value: 'over', label: 'Over 1,200 lbs', sublabel: 'Trikes' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleBikeWeight(opt.value)}
                    className="w-full p-4 text-left bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-lg transition-all"
                  >
                    <span className="text-white font-medium">{opt.label}</span>
                    <span className="text-zinc-500 text-sm ml-2">{opt.sublabel}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Tailgate */}
          {step === 3 && (
            <div>
              <h3 className="text-lg font-medium text-white mb-6">Need tailgate to close?</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleTailgate('yes')}
                  className="p-6 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-xl transition-all text-center"
                >
                  <span className="text-white font-medium block text-lg">Yes</span>
                  <span className="text-zinc-500 text-sm">Must close</span>
                </button>
                <button
                  onClick={() => handleTailgate('no')}
                  className="p-6 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-xl transition-all text-center"
                >
                  <span className="text-white font-medium block text-lg">No</span>
                  <span className="text-zinc-500 text-sm">Open is fine</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Result */}
          {step === 4 && result && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-amber-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {truckDescription && (
                <p className="text-amber-500 text-sm mb-2">Perfect match for your {truckDescription}!</p>
              )}

              <h3 className="text-2xl font-bold text-white mb-2">
                {result.recommendation === 'AUN200' ? 'AUN 200' : result.recommendation === 'AUN250' ? 'AUN 250' : 'Custom Solution'}
              </h3>
              <p className="text-zinc-400 mb-4">{result.message}</p>

              {/* Verified fit */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6 text-left">
                <p className="text-green-400 font-medium mb-2">✓ Verified Fit</p>
                <ul className="space-y-1 text-sm text-zinc-300">
                  <li>✓ Fits your {beds.find(b => b.length === truckSelection.bedLength)?.label || truckSelection.bedLength + ' bed'}</li>
                  {tonneauType !== 'none' && (
                    <li>✓ Compatible with {TONNEAU_TYPES.find(t => t.value === tonneauType)?.label}</li>
                  )}
                  <li>✓ Handles your {bikeWeight === 'light' ? '<500' : bikeWeight === 'medium' ? '500-800' : '800-1,200'} lb bike</li>
                </ul>
              </div>

              {result.price && (
                <p className="text-3xl font-bold text-white mb-6">${result.price.toLocaleString()}</p>
              )}

              <button className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-all">
                {result.recommendation === 'custom' ? 'Contact Us' : 'Add to Cart'}
              </button>

              <button onClick={handleReset} className="mt-4 text-zinc-500 hover:text-white text-sm">
                Start over
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
