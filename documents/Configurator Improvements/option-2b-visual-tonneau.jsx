// Option 2B: Visual Tonneau Selection with Illustrations
// Visual identification of tonneau cover types with SVG illustrations

import React, { useState, useEffect } from 'react';

// SVG illustrations for tonneau types
const TonneauIllustrations = {
  'roll-up-soft': (
    <svg viewBox="0 0 120 60" className="w-full h-full">
      <rect x="10" y="30" width="100" height="25" fill="#3f3f46" stroke="#52525b" strokeWidth="2" rx="2"/>
      <circle cx="25" cy="35" r="8" fill="#71717a" stroke="#52525b" strokeWidth="1"/>
      <path d="M25 27 Q35 25 35 35 Q35 45 25 43" fill="none" stroke="#a1a1aa" strokeWidth="1.5"/>
      <text x="60" y="47" fill="#a1a1aa" fontSize="8" textAnchor="middle">Rolled fabric</text>
    </svg>
  ),
  'roll-up-hard': (
    <svg viewBox="0 0 120 60" className="w-full h-full">
      <rect x="10" y="30" width="100" height="25" fill="#3f3f46" stroke="#52525b" strokeWidth="2" rx="2"/>
      <circle cx="25" cy="38" r="10" fill="#52525b" stroke="#71717a" strokeWidth="2"/>
      <line x1="18" y1="32" x2="32" y2="32" stroke="#a1a1aa" strokeWidth="1"/>
      <line x1="18" y1="35" x2="32" y2="35" stroke="#a1a1aa" strokeWidth="1"/>
      <line x1="18" y1="38" x2="32" y2="38" stroke="#a1a1aa" strokeWidth="1"/>
      <text x="70" y="47" fill="#a1a1aa" fontSize="8" textAnchor="middle">Metal slats</text>
    </svg>
  ),
  'tri-fold-soft': (
    <svg viewBox="0 0 120 60" className="w-full h-full">
      <rect x="10" y="30" width="100" height="25" fill="#3f3f46" stroke="#52525b" strokeWidth="2" rx="2"/>
      <rect x="15" y="20" width="25" height="12" fill="#52525b" stroke="#71717a" rx="1" transform="rotate(-5 15 20)"/>
      <rect x="42" y="18" width="25" height="12" fill="#52525b" stroke="#71717a" rx="1"/>
      <rect x="68" y="20" width="25" height="12" fill="#52525b" stroke="#71717a" rx="1" transform="rotate(5 93 20)"/>
      <text x="60" y="55" fill="#a1a1aa" fontSize="7" textAnchor="middle">3 fabric panels</text>
    </svg>
  ),
  'tri-fold-hard': (
    <svg viewBox="0 0 120 60" className="w-full h-full">
      <rect x="10" y="30" width="100" height="25" fill="#3f3f46" stroke="#52525b" strokeWidth="2" rx="2"/>
      <rect x="15" y="18" width="28" height="14" fill="#71717a" stroke="#a1a1aa" strokeWidth="2" rx="1"/>
      <rect x="45" y="16" width="28" height="14" fill="#71717a" stroke="#a1a1aa" strokeWidth="2" rx="1"/>
      <rect x="75" y="18" width="28" height="14" fill="#71717a" stroke="#a1a1aa" strokeWidth="2" rx="1"/>
      <text x="60" y="55" fill="#a1a1aa" fontSize="7" textAnchor="middle">3 rigid panels</text>
    </svg>
  ),
  'bi-fold': (
    <svg viewBox="0 0 120 60" className="w-full h-full">
      <rect x="10" y="30" width="100" height="25" fill="#3f3f46" stroke="#52525b" strokeWidth="2" rx="2"/>
      <rect x="15" y="15" width="42" height="16" fill="#71717a" stroke="#a1a1aa" strokeWidth="2" rx="1"/>
      <rect x="60" y="15" width="42" height="16" fill="#71717a" stroke="#a1a1aa" strokeWidth="2" rx="1"/>
      <text x="60" y="55" fill="#a1a1aa" fontSize="7" textAnchor="middle">2 panels</text>
    </svg>
  ),
  'quad-fold': (
    <svg viewBox="0 0 120 60" className="w-full h-full">
      <rect x="10" y="30" width="100" height="25" fill="#3f3f46" stroke="#52525b" strokeWidth="2" rx="2"/>
      <rect x="15" y="18" width="20" height="13" fill="#52525b" stroke="#71717a" rx="1"/>
      <rect x="37" y="16" width="20" height="13" fill="#52525b" stroke="#71717a" rx="1"/>
      <rect x="59" y="16" width="20" height="13" fill="#52525b" stroke="#71717a" rx="1"/>
      <rect x="81" y="18" width="20" height="13" fill="#52525b" stroke="#71717a" rx="1"/>
      <text x="60" y="55" fill="#a1a1aa" fontSize="7" textAnchor="middle">4 accordion panels</text>
    </svg>
  ),
  'hinged': (
    <svg viewBox="0 0 120 60" className="w-full h-full">
      <rect x="10" y="30" width="100" height="25" fill="#3f3f46" stroke="#52525b" strokeWidth="2" rx="2"/>
      <rect x="15" y="5" width="90" height="20" fill="#71717a" stroke="#a1a1aa" strokeWidth="2" rx="2" transform="rotate(15 15 25)"/>
      <circle cx="18" cy="28" r="3" fill="#52525b" stroke="#71717a"/>
      <text x="60" y="55" fill="#a1a1aa" fontSize="7" textAnchor="middle">Lifts up</text>
    </svg>
  ),
  'retractable': (
    <svg viewBox="0 0 120 60" className="w-full h-full">
      <rect x="10" y="30" width="100" height="25" fill="#3f3f46" stroke="#52525b" strokeWidth="2" rx="2"/>
      <rect x="12" y="28" width="15" height="18" fill="#52525b" stroke="#71717a" strokeWidth="2" rx="2"/>
      <line x1="30" y1="38" x2="105" y2="38" stroke="#71717a" strokeWidth="2" strokeDasharray="4"/>
      <text x="70" y="47" fill="#a1a1aa" fontSize="7" textAnchor="middle">Slides into canister</text>
    </svg>
  ),
  'other': (
    <svg viewBox="0 0 120 60" className="w-full h-full">
      <rect x="10" y="30" width="100" height="25" fill="#3f3f46" stroke="#52525b" strokeWidth="2" rx="2"/>
      <text x="60" y="25" fill="#71717a" fontSize="24" textAnchor="middle">?</text>
      <text x="60" y="47" fill="#a1a1aa" fontSize="8" textAnchor="middle">Other style</text>
    </svg>
  ),
};

const TONNEAU_TYPES = [
  { value: 'roll-up-soft', label: 'Roll-up (Soft)', sublabel: 'Vinyl/fabric' },
  { value: 'roll-up-hard', label: 'Roll-up (Hard)', sublabel: 'Aluminum slats' },
  { value: 'tri-fold-soft', label: 'Tri-fold (Soft)', sublabel: 'Fabric panels' },
  { value: 'tri-fold-hard', label: 'Tri-fold (Hard)', sublabel: 'Rigid panels' },
  { value: 'bi-fold', label: 'Bi-fold', sublabel: '2 panels' },
  { value: 'quad-fold', label: 'Quad-fold', sublabel: 'Accordion style' },
  { value: 'hinged', label: 'One-piece', sublabel: 'Lifts up' },
  { value: 'retractable', label: 'Retractable', sublabel: 'Slides into canister' },
  { value: 'other', label: 'Other', sublabel: 'Not listed' },
];

// Roll direction animated illustration
function RollDirectionOption({ direction, selected, onClick }) {
  const isOnTop = direction === 'on-top';
  
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
        selected 
          ? 'border-amber-500 bg-amber-500/10' 
          : 'border-zinc-700 bg-zinc-800 hover:border-amber-500/50'
      }`}
    >
      <div className="h-24 mb-3">
        <svg viewBox="0 0 150 80" className="w-full h-full">
          {/* Truck bed */}
          <rect x="20" y="45" width="110" height="30" fill="#3f3f46" stroke="#52525b" strokeWidth="2" rx="2"/>
          {/* Cab */}
          <rect x="20" y="35" width="25" height="12" fill="#52525b" stroke="#71717a" strokeWidth="1" rx="2"/>
          
          {/* Rolled cover */}
          {isOnTop ? (
            // On top of rails
            <g>
              <circle cx="50" cy="42" r="10" fill="#71717a" stroke="#a1a1aa" strokeWidth="2"/>
              <path d="M42 42 L50 35 L58 42" fill="none" stroke="#f59e0b" strokeWidth="2"/>
              <text x="50" y="25" fill="#f59e0b" fontSize="8" textAnchor="middle">↑ On rails</text>
            </g>
          ) : (
            // Into bed
            <g>
              <circle cx="50" cy="55" r="10" fill="#71717a" stroke="#a1a1aa" strokeWidth="2"/>
              <path d="M42 55 L50 62 L58 55" fill="none" stroke="#f59e0b" strokeWidth="2"/>
              <text x="50" y="25" fill="#f59e0b" fontSize="8" textAnchor="middle">↓ In bed</text>
              <line x1="62" y1="55" x2="125" y2="55" stroke="#ef4444" strokeWidth="1" strokeDasharray="3"/>
              <text x="95" y="62" fill="#ef4444" fontSize="6" textAnchor="middle">-8" space</text>
            </g>
          )}
        </svg>
      </div>
      
      <div className="text-center">
        <p className={`font-medium ${selected ? 'text-amber-500' : 'text-white'}`}>
          {isOnTop ? 'On top of rails' : 'Into the bed'}
        </p>
        <p className="text-zinc-500 text-xs mt-1">
          {isOnTop ? 'No bed space lost' : 'Reduces length ~8"'}
        </p>
      </div>
      
      {selected && (
        <div className="mt-2 flex justify-center">
          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
}

// Compatibility panel
function CompatibilityPanel({ answers, currentStep }) {
  const items = [];
  
  if (answers.bedLength) {
    const labels = { short: "Short bed (5'-5.8')", standard: "Standard (6'-6.5')", long: "Long (8'+)", unsure: "Bed length: Unknown" };
    items.push({ label: labels[answers.bedLength], complete: true });
  }
  
  if (answers.hasTonneau === 'yes' && answers.tonneauType) {
    const type = TONNEAU_TYPES.find(t => t.value === answers.tonneauType);
    items.push({ label: `Cover: ${type?.label}`, complete: true });
  } else if (answers.hasTonneau === 'no') {
    items.push({ label: 'No tonneau cover', complete: true });
  }
  
  if (answers.bikeWeight) {
    const labels = { light: 'Under 500 lbs', medium: '500-800 lbs', heavy: '800-1,200 lbs', over: 'Over 1,200 lbs' };
    items.push({ label: `Bike: ${labels[answers.bikeWeight]}`, complete: true });
  }

  if (items.length === 0) return null;

  return (
    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-6">
      <p className="text-zinc-400 text-xs uppercase tracking-wider mb-3">Your Setup</p>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-zinc-300">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Option2BVisualTonneau() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const steps = ['bedLength', 'hasTonneau', 'tonneauType', 'rollDirection', 'bikeWeight', 'tailgateRequired'];
  
  // Determine which steps to show based on answers
  const getActiveSteps = () => {
    let active = ['bedLength', 'hasTonneau'];
    if (answers.hasTonneau === 'yes') {
      active.push('tonneauType');
      if (answers.tonneauType?.includes('roll-up')) {
        active.push('rollDirection');
      }
    }
    active.push('bikeWeight', 'tailgateRequired');
    return active;
  };

  const activeSteps = getActiveSteps();
  const currentStepId = activeSteps[step];
  const progress = ((step + 1) / activeSteps.length) * 100;

  const handleAnswer = (value) => {
    const newAnswers = { ...answers, [currentStepId]: value };
    setAnswers(newAnswers);

    // Calculate new active steps with new answers
    let newActiveSteps = ['bedLength', 'hasTonneau'];
    if (newAnswers.hasTonneau === 'yes') {
      newActiveSteps.push('tonneauType');
      if (newAnswers.tonneauType?.includes('roll-up')) {
        newActiveSteps.push('rollDirection');
      }
    }
    newActiveSteps.push('bikeWeight', 'tailgateRequired');

    const nextStep = step + 1;
    if (nextStep >= newActiveSteps.length) {
      // Complete - calculate result
      const rec = calculateRecommendation(newAnswers);
      setResult(rec);
    } else {
      setStep(nextStep);
    }
  };

  const calculateRecommendation = (ans) => {
    if (ans.bikeWeight === 'over') {
      return { recommendation: 'custom', message: 'Contact us for custom solutions.', price: null };
    }
    if (ans.bedLength === 'short' || ans.tailgateRequired === 'yes' || ans.bedLength === 'unsure') {
      return { recommendation: 'AUN250', message: 'The AUN 250 is perfect for your setup.', price: 2795 };
    }
    return { recommendation: 'AUN200', message: 'The AUN 200 is ideal for your truck.', price: 2495 };
  };

  const handleReset = () => {
    setStep(0);
    setAnswers({});
    setResult(null);
  };

  const renderStep = () => {
    switch (currentStepId) {
      case 'bedLength':
        return (
          <div>
            <h3 className="text-xl text-white font-medium mb-6">What's your truck bed length?</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'short', label: 'Short', sublabel: "5'-5.8'" },
                { value: 'standard', label: 'Standard', sublabel: "6'-6.5'" },
                { value: 'long', label: 'Long', sublabel: "8'+" },
                { value: 'unsure', label: 'Not sure', sublabel: 'Help me' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(opt.value)}
                  className="p-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-lg transition-all"
                >
                  <span className="text-white font-medium block">{opt.label}</span>
                  <span className="text-zinc-500 text-sm">{opt.sublabel}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 'hasTonneau':
        return (
          <div>
            <h3 className="text-xl text-white font-medium mb-6">Do you have a tonneau cover?</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleAnswer('yes')}
                className="p-6 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-xl transition-all text-center"
              >
                <span className="text-3xl mb-2 block">🛡️</span>
                <span className="text-white font-medium block">Yes</span>
                <span className="text-zinc-500 text-sm">I have a cover</span>
              </button>
              <button
                onClick={() => handleAnswer('no')}
                className="p-6 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-xl transition-all text-center"
              >
                <span className="text-3xl mb-2 block">🛻</span>
                <span className="text-white font-medium block">No</span>
                <span className="text-zinc-500 text-sm">Open bed</span>
              </button>
            </div>
          </div>
        );

      case 'tonneauType':
        return (
          <div>
            <h3 className="text-xl text-white font-medium mb-2">What type of cover?</h3>
            <p className="text-zinc-500 text-sm mb-6">Tap the one that matches yours</p>
            <div className="grid grid-cols-3 gap-3">
              {TONNEAU_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => handleAnswer(type.value)}
                  className="p-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-lg transition-all group"
                >
                  <div className="h-16 mb-2 opacity-70 group-hover:opacity-100 transition-opacity">
                    {TonneauIllustrations[type.value]}
                  </div>
                  <span className="text-white text-xs font-medium block">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 'rollDirection':
        return (
          <div>
            <h3 className="text-xl text-white font-medium mb-2">When rolled up, where does it go?</h3>
            <p className="text-zinc-500 text-sm mb-6">This affects available bed space</p>
            <div className="grid grid-cols-2 gap-4">
              <RollDirectionOption 
                direction="on-top" 
                selected={false}
                onClick={() => handleAnswer('on-top')}
              />
              <RollDirectionOption 
                direction="into-bed" 
                selected={false}
                onClick={() => handleAnswer('into-bed')}
              />
            </div>
          </div>
        );

      case 'bikeWeight':
        return (
          <div>
            <h3 className="text-xl text-white font-medium mb-6">Motorcycle weight?</h3>
            <div className="space-y-3">
              {[
                { value: 'light', label: 'Under 500 lbs', sublabel: 'Sport, dirt bikes' },
                { value: 'medium', label: '500-800 lbs', sublabel: 'Cruisers' },
                { value: 'heavy', label: '800-1,200 lbs', sublabel: 'Touring bikes' },
                { value: 'over', label: 'Over 1,200 lbs', sublabel: 'Trikes' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(opt.value)}
                  className="w-full p-4 text-left bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-lg transition-all"
                >
                  <span className="text-white font-medium">{opt.label}</span>
                  <span className="text-zinc-500 text-sm ml-2">{opt.sublabel}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 'tailgateRequired':
        return (
          <div>
            <h3 className="text-xl text-white font-medium mb-6">Need tailgate to close?</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleAnswer('yes')}
                className="p-6 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-xl transition-all text-center"
              >
                <span className="text-white font-medium block">Yes</span>
                <span className="text-zinc-500 text-sm">Must close</span>
              </button>
              <button
                onClick={() => handleAnswer('no')}
                className="p-6 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-xl transition-all text-center"
              >
                <span className="text-white font-medium block">No</span>
                <span className="text-zinc-500 text-sm">Open is fine</span>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Find Your Ramp</h2>
          <p className="text-amber-500 text-sm">Option 2B: Visual Tonneau Selection</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">
          {/* Progress */}
          <div className="mb-6">
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Compatibility panel */}
          <CompatibilityPanel answers={answers} currentStep={step} />

          {/* Content */}
          {!result ? (
            renderStep()
          ) : (
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
              {result.price && (
                <p className="text-3xl font-bold text-white mb-6">${result.price.toLocaleString()}</p>
              )}
              <button className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg">
                View Product
              </button>
              <button onClick={handleReset} className="block mx-auto mt-4 text-zinc-500 hover:text-white text-sm">
                Start over
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
