// Option 2C: Integrated Truck Bed Configuration
// Visual builder combining bed length and tonneau cover in one step

import React, { useState } from 'react';

const TONNEAU_TYPES = [
  { value: 'none', label: 'No Cover' },
  { value: 'roll-up-soft', label: 'Roll-up (Soft)' },
  { value: 'roll-up-hard', label: 'Roll-up (Hard)' },
  { value: 'tri-fold', label: 'Tri-fold' },
  { value: 'bi-fold', label: 'Bi-fold' },
  { value: 'hinged', label: 'One-piece' },
  { value: 'retractable', label: 'Retractable' },
];

// Interactive truck bed SVG
function TruckBedVisual({ bedLength, tonneauType, rollDirection }) {
  const bedWidths = { short: 100, standard: 130, long: 170 };
  const width = bedWidths[bedLength] || 130;
  
  // Calculate cover position
  const showCover = tonneauType && tonneauType !== 'none';
  const isRollUp = tonneauType?.includes('roll-up');
  const rollsIntoBed = rollDirection === 'into-bed';
  
  return (
    <svg viewBox="0 0 250 120" className="w-full h-48">
      {/* Background */}
      <rect x="0" y="0" width="250" height="120" fill="transparent"/>
      
      {/* Cab */}
      <rect x="15" y="50" width="30" height="40" fill="#3f3f46" stroke="#52525b" strokeWidth="2" rx="4"/>
      <rect x="20" y="55" width="20" height="15" fill="#52525b" stroke="#71717a" strokeWidth="1" rx="2"/>
      
      {/* Bed - dynamic width */}
      <rect 
        x="45" 
        y="50" 
        width={width} 
        height="40" 
        fill="#27272a" 
        stroke="#52525b" 
        strokeWidth="2" 
        rx="2"
      />
      
      {/* Bed rails */}
      <rect x="45" y="48" width={width} height="4" fill="#3f3f46" stroke="#52525b" strokeWidth="1"/>
      <rect x="45" y="88" width={width} height="4" fill="#3f3f46" stroke="#52525b" strokeWidth="1"/>
      
      {/* Tailgate */}
      <rect x={45 + width} y="50" width="8" height="40" fill="#3f3f46" stroke="#52525b" strokeWidth="2" rx="1"/>
      
      {/* Tonneau cover visualization */}
      {showCover && (
        <>
          {isRollUp && rollsIntoBed ? (
            // Rolled into bed - shows canister taking space
            <g>
              <rect x="50" y="55" width="20" height="30" fill="#71717a" stroke="#a1a1aa" strokeWidth="2" rx="4"/>
              <text x="60" y="105" fill="#ef4444" fontSize="8" textAnchor="middle">-8"</text>
            </g>
          ) : isRollUp ? (
            // Rolled on top
            <circle cx="60" cy="45" r="8" fill="#71717a" stroke="#a1a1aa" strokeWidth="2"/>
          ) : tonneauType === 'tri-fold' ? (
            // Tri-fold shown folded
            <g>
              <rect x="50" y="40" width={width/3} height="12" fill="#52525b" stroke="#71717a" strokeWidth="1" rx="1"/>
              <rect x={50 + width/3} y="38" width={width/3} height="12" fill="#52525b" stroke="#71717a" strokeWidth="1" rx="1"/>
              <rect x={50 + (width*2/3)} y="40" width={width/3 - 10} height="12" fill="#52525b" stroke="#71717a" strokeWidth="1" rx="1"/>
            </g>
          ) : tonneauType === 'hinged' ? (
            // Hinged - lifted
            <rect x="50" y="20" width={width - 10} height="25" fill="#52525b" stroke="#71717a" strokeWidth="2" rx="2" transform="rotate(-10 50 45)"/>
          ) : (
            // Generic cover representation
            <rect x="50" y="42" width={width - 10} height="10" fill="#52525b" stroke="#71717a" strokeWidth="2" rx="2"/>
          )}
        </>
      )}
      
      {/* Dimension label */}
      <g>
        <line x1="45" y1="100" x2={45 + width} y2="100" stroke="#f59e0b" strokeWidth="1"/>
        <line x1="45" y1="97" x2="45" y2="103" stroke="#f59e0b" strokeWidth="1"/>
        <line x1={45 + width} y1="97" x2={45 + width} y2="103" stroke="#f59e0b" strokeWidth="1"/>
        <text x={45 + width/2} y="115" fill="#f59e0b" fontSize="10" textAnchor="middle">
          {bedLength === 'short' ? "5'-5.8'" : bedLength === 'long' ? "8'+" : "6'-6.5'"}
        </text>
      </g>
      
      {/* Wheels */}
      <circle cx="30" cy="95" r="8" fill="#27272a" stroke="#52525b" strokeWidth="2"/>
      <circle cx={45 + width - 15} cy="95" r="8" fill="#27272a" stroke="#52525b" strokeWidth="2"/>
    </svg>
  );
}

// Bed length selector
function BedLengthSelector({ value, onChange }) {
  const options = [
    { value: 'short', label: 'Short', sublabel: "5'-5.8'" },
    { value: 'standard', label: 'Standard', sublabel: "6'-6.5'" },
    { value: 'long', label: 'Long', sublabel: "8'+" },
  ];
  
  return (
    <div>
      <label className="text-zinc-400 text-sm mb-2 block">Bed Length</label>
      <div className="flex gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-3 px-2 rounded-lg border-2 transition-all ${
              value === opt.value
                ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
            }`}
          >
            <span className="font-medium block">{opt.label}</span>
            <span className="text-xs opacity-70">{opt.sublabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Tonneau cover selector
function TonneauSelector({ value, onChange }) {
  return (
    <div>
      <label className="text-zinc-400 text-sm mb-2 block">Tonneau Cover</label>
      <select
        value={value || 'none'}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-amber-500 focus:outline-none"
      >
        {TONNEAU_TYPES.map(type => (
          <option key={type.value} value={type.value}>{type.label}</option>
        ))}
      </select>
    </div>
  );
}

// Roll direction selector
function RollDirectionSelector({ value, onChange }) {
  return (
    <div className="mt-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
      <label className="text-zinc-400 text-sm mb-3 block">When rolled up, where does it go?</label>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onChange('on-top')}
          className={`p-3 rounded-lg border-2 transition-all text-sm ${
            value === 'on-top'
              ? 'border-amber-500 bg-amber-500/10 text-amber-500'
              : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
          }`}
        >
          <span className="block font-medium">On Top of Rails</span>
          <span className="text-xs opacity-70">No space lost</span>
        </button>
        <button
          onClick={() => onChange('into-bed')}
          className={`p-3 rounded-lg border-2 transition-all text-sm ${
            value === 'into-bed'
              ? 'border-amber-500 bg-amber-500/10 text-amber-500'
              : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
          }`}
        >
          <span className="block font-medium">Into the Bed</span>
          <span className="text-xs opacity-70">-8" space</span>
        </button>
      </div>
    </div>
  );
}

// Compatibility status
function CompatibilityStatus({ bedLength, tonneauType, rollDirection }) {
  const issues = [];
  const notes = [];
  
  if (rollDirection === 'into-bed') {
    if (bedLength === 'short') {
      issues.push('Rolled cover significantly reduces space in short bed');
    } else {
      notes.push('Rolled cover reduces usable length by ~8"');
    }
  }
  
  if (['tri-fold', 'bi-fold'].includes(tonneauType)) {
    notes.push('Fold cover toward cab before loading');
  }
  
  if (tonneauType === 'hinged') {
    notes.push('Open cover fully before loading');
  }
  
  let recommendation = 'AUN200';
  if (bedLength === 'short' || (rollDirection === 'into-bed' && bedLength !== 'long')) {
    recommendation = 'AUN250';
  }

  return (
    <div className="mt-4 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-white font-medium">
          Compatible with {recommendation === 'AUN250' ? 'AUN 250' : 'both models'}
        </span>
      </div>
      
      {notes.length > 0 && (
        <div className="mt-2 space-y-1">
          {notes.map((note, i) => (
            <p key={i} className="text-amber-500/80 text-sm flex items-start gap-2">
              <span>ℹ️</span>
              <span>{note}</span>
            </p>
          ))}
        </div>
      )}
      
      {issues.length > 0 && (
        <div className="mt-2 space-y-1">
          {issues.map((issue, i) => (
            <p key={i} className="text-red-400 text-sm flex items-start gap-2">
              <span>⚠️</span>
              <span>{issue}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Option2CIntegratedBedConfig() {
  const [step, setStep] = useState(0); // 0: bed config, 1: bike, 2: tailgate, 3: result
  const [bedConfig, setBedConfig] = useState({
    bedLength: 'standard',
    tonneauType: 'none',
    rollDirection: null,
  });
  const [bikeWeight, setBikeWeight] = useState(null);
  const [tailgateRequired, setTailgateRequired] = useState(null);
  const [result, setResult] = useState(null);

  const showRollDirection = bedConfig.tonneauType?.includes('roll-up');

  const handleBedConfigContinue = () => {
    setStep(1);
  };

  const handleBikeWeight = (weight) => {
    setBikeWeight(weight);
    if (weight === 'over') {
      setResult({ recommendation: 'custom', message: 'Contact us for custom solutions.', price: null });
      setStep(3);
    } else {
      setStep(2);
    }
  };

  const handleTailgate = (required) => {
    setTailgateRequired(required);
    
    // Calculate result
    const needsAUN250 = 
      bedConfig.bedLength === 'short' || 
      required === 'yes' ||
      (bedConfig.rollDirection === 'into-bed' && bedConfig.bedLength !== 'long');
    
    setResult({
      recommendation: needsAUN250 ? 'AUN250' : 'AUN200',
      message: needsAUN250 
        ? 'The AUN 250 Folding Ramp is perfect for your setup.'
        : 'The AUN 200 Standard Ramp is ideal for your truck.',
      price: needsAUN250 ? 2795 : 2495,
    });
    setStep(3);
  };

  const handleReset = () => {
    setStep(0);
    setBedConfig({ bedLength: 'standard', tonneauType: 'none', rollDirection: null });
    setBikeWeight(null);
    setTailgateRequired(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Configure Your Setup</h2>
          <p className="text-amber-500 text-sm">Option 2C: Integrated Bed Configuration</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['Truck Bed', 'Motorcycle', 'Tailgate', 'Result'].map((label, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-2 ${step >= i ? 'text-amber-500' : 'text-zinc-600'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step > i ? 'bg-amber-500 text-black' : step === i ? 'bg-amber-500/20 text-amber-500 border-2 border-amber-500' : 'bg-zinc-800'
                }`}>
                  {step > i ? '✓' : i + 1}
                </div>
                <span className="text-sm hidden sm:inline">{label}</span>
              </div>
              {i < 3 && <div className={`w-8 h-0.5 ${step > i ? 'bg-amber-500' : 'bg-zinc-700'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">
          {/* Step 0: Bed Configuration */}
          {step === 0 && (
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Tell us about your truck bed</h3>
              
              {/* Visual */}
              <div className="bg-zinc-950 rounded-lg p-4 mb-6 border border-zinc-800">
                <TruckBedVisual 
                  bedLength={bedConfig.bedLength}
                  tonneauType={bedConfig.tonneauType}
                  rollDirection={bedConfig.rollDirection}
                />
              </div>

              {/* Controls */}
              <div className="space-y-4">
                <BedLengthSelector 
                  value={bedConfig.bedLength}
                  onChange={(v) => setBedConfig(prev => ({ ...prev, bedLength: v }))}
                />
                
                <TonneauSelector
                  value={bedConfig.tonneauType}
                  onChange={(v) => setBedConfig(prev => ({ ...prev, tonneauType: v, rollDirection: null }))}
                />
                
                {showRollDirection && (
                  <RollDirectionSelector
                    value={bedConfig.rollDirection}
                    onChange={(v) => setBedConfig(prev => ({ ...prev, rollDirection: v }))}
                  />
                )}
                
                <CompatibilityStatus 
                  bedLength={bedConfig.bedLength}
                  tonneauType={bedConfig.tonneauType}
                  rollDirection={bedConfig.rollDirection}
                />
              </div>

              <button
                onClick={handleBedConfigContinue}
                disabled={showRollDirection && !bedConfig.rollDirection}
                className="w-full mt-6 py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-lg transition-all"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 1: Bike Weight */}
          {step === 1 && (
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

          {/* Step 2: Tailgate */}
          {step === 2 && (
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

          {/* Step 3: Result */}
          {step === 3 && result && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-amber-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">
                {result.recommendation === 'AUN200' ? 'AUN 200' : result.recommendation === 'AUN250' ? 'AUN 250' : 'Custom Solution'}
              </h3>
              <p className="text-zinc-400 mb-4">{result.message}</p>
              
              {/* Summary */}
              <div className="bg-zinc-800/50 rounded-lg p-4 mb-6 text-left">
                <p className="text-zinc-400 text-sm mb-2">Your configuration:</p>
                <ul className="space-y-1 text-sm">
                  <li className="text-zinc-300">✓ {bedConfig.bedLength.charAt(0).toUpperCase() + bedConfig.bedLength.slice(1)} bed</li>
                  <li className="text-zinc-300">✓ {bedConfig.tonneauType === 'none' ? 'No cover' : TONNEAU_TYPES.find(t => t.value === bedConfig.tonneauType)?.label}</li>
                  {bedConfig.rollDirection && (
                    <li className="text-zinc-300">✓ Rolls {bedConfig.rollDirection === 'on-top' ? 'on top' : 'into bed'}</li>
                  )}
                </ul>
              </div>
              
              {result.price && (
                <p className="text-3xl font-bold text-white mb-6">${result.price.toLocaleString()}</p>
              )}
              
              <button className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-all">
                {result.recommendation === 'custom' ? 'Contact Us' : 'View Product'}
              </button>
              
              <button onClick={handleReset} className="mt-4 text-zinc-500 hover:text-white text-sm">
                Start over
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
