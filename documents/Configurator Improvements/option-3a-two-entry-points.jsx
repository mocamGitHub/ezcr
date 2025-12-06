// Option 3A: Two Entry Points
// Quick Check for browsers, Exact Fit for buyers

import React, { useState } from 'react';

// Quick Check Questions (simplified)
const QUICK_QUESTIONS = [
  {
    id: 'bedLength',
    question: "What's your truck bed size?",
    options: [
      { value: 'short', label: 'Short bed', sublabel: "5'-5.8'" },
      { value: 'standard', label: 'Standard bed', sublabel: "6'-6.5'" },
      { value: 'long', label: 'Long bed', sublabel: "8'+" },
      { value: 'unsure', label: "Not sure" },
    ],
  },
  {
    id: 'bikeWeight',
    question: "How heavy is your motorcycle?",
    options: [
      { value: 'under700', label: 'Under 700 lbs', sublabel: 'Most bikes' },
      { value: '700to1000', label: '700-1,000 lbs', sublabel: 'Touring bikes' },
      { value: 'over1000', label: 'Over 1,000 lbs', sublabel: 'Trikes, heavy customs' },
    ],
  },
  {
    id: 'tailgate',
    question: "Need to close your tailgate?",
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
];

// Exact Fit Questions (detailed)
const EXACT_QUESTIONS = [
  {
    id: 'truckMake',
    question: "What's your truck make?",
    type: 'select',
    options: ['Ford', 'Chevrolet', 'RAM', 'Toyota', 'GMC', 'Nissan', 'Other'],
  },
  {
    id: 'truckModel',
    question: "What's your truck model?",
    type: 'input',
    placeholder: 'e.g., F-150, Silverado 1500',
  },
  {
    id: 'truckYear',
    question: "What year?",
    type: 'select',
    options: Array.from({ length: 15 }, (_, i) => (2024 - i).toString()),
  },
  {
    id: 'exactBedLength',
    question: "Exact bed length?",
    type: 'measurement',
    helpText: "Measure inside from bulkhead to tailgate",
  },
  {
    id: 'hasTonneau',
    question: "Do you have a tonneau cover?",
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'tonneauType',
    question: "What type of cover?",
    conditional: { field: 'hasTonneau', value: 'yes' },
    options: [
      { value: 'roll-up', label: 'Roll-up' },
      { value: 'tri-fold', label: 'Tri-fold' },
      { value: 'bi-fold', label: 'Bi-fold' },
      { value: 'hinged', label: 'One-piece' },
      { value: 'retractable', label: 'Retractable' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'bikeWeight',
    question: "Motorcycle weight (with gear)?",
    type: 'input',
    placeholder: 'e.g., 750',
    suffix: 'lbs',
  },
  {
    id: 'tailgate',
    question: "Need to close your tailgate?",
    options: [
      { value: 'yes', label: 'Yes, must close' },
      { value: 'no', label: 'No, open is fine' },
    ],
  },
];

function calculateRecommendation(answers, isExact = false) {
  // Weight check
  if (answers.bikeWeight === 'over1000' || (isExact && parseInt(answers.bikeWeight) > 1200)) {
    return {
      recommendation: 'custom',
      message: 'Your bike may exceed our standard capacity. Let\'s discuss custom options.',
      price: null,
      confidence: 'low',
    };
  }

  const needsAUN250 = 
    answers.bedLength === 'short' || 
    answers.tailgate === 'yes' ||
    answers.bedLength === 'unsure';

  return {
    recommendation: needsAUN250 ? 'AUN250' : 'AUN200',
    message: needsAUN250 
      ? 'The AUN 250 Folding Ramp is perfect for your setup.'
      : 'The AUN 200 Standard Ramp is ideal for your truck.',
    price: needsAUN250 ? 2795 : 2495,
    confidence: isExact ? 'verified' : 'preliminary',
  };
}

// Entry point selection screen
function EntrySelection({ onSelectPath }) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-2">Find Your Ramp</h2>
      <p className="text-zinc-400 mb-8">Two ways to discover your perfect fit</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Check */}
        <button
          onClick={() => onSelectPath('quick')}
          className="p-8 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-2xl transition-all text-left group"
        >
          <div className="text-4xl mb-4">🚀</div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-500 transition-colors">
            Quick Check
          </h3>
          <p className="text-zinc-400 mb-4">
            "Will it work for my truck?"
          </p>
          <div className="flex items-center gap-4 text-zinc-500 text-sm">
            <span>⏱️ 30 seconds</span>
            <span>📋 3 questions</span>
          </div>
        </button>

        {/* Exact Fit */}
        <button
          onClick={() => onSelectPath('exact')}
          className="p-8 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-2xl transition-all text-left group"
        >
          <div className="text-4xl mb-4">📐</div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-500 transition-colors">
            Exact Fit
          </h3>
          <p className="text-zinc-400 mb-4">
            "I'm ready to order—configure my ramp"
          </p>
          <div className="flex items-center gap-4 text-zinc-500 text-sm">
            <span>⏱️ 2 minutes</span>
            <span>📏 Measurements</span>
          </div>
        </button>
      </div>

      <p className="text-zinc-600 text-sm mt-6">
        Not sure? Quick Check is a great start.
      </p>
    </div>
  );
}

// Quick Check flow
function QuickCheckFlow({ onComplete, onUpgrade }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const currentQuestion = QUICK_QUESTIONS[step];
  const isComplete = step >= QUICK_QUESTIONS.length;

  const handleAnswer = (value) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    if (step + 1 >= QUICK_QUESTIONS.length) {
      const rec = calculateRecommendation(newAnswers, false);
      setResult(rec);
    } else {
      setStep(prev => prev + 1);
    }
  };

  if (result) {
    return (
      <div className="text-center">
        {/* Preliminary badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-500 text-sm rounded-full mb-4">
          <span>⚡</span>
          <span>Preliminary Recommendation</span>
        </div>

        <h3 className="text-2xl font-bold text-white mb-2">
          {result.recommendation === 'AUN200' ? 'AUN 200' : result.recommendation === 'AUN250' ? 'AUN 250' : 'Custom Solution'}
        </h3>
        <p className="text-zinc-400 mb-2">{result.message}</p>
        
        <p className="text-amber-500/70 text-sm mb-6">
          ⚠️ This is a preliminary recommendation. We'll verify exact fit before shipping.
        </p>

        {result.price && (
          <p className="text-3xl font-bold text-white mb-6">${result.price.toLocaleString()}</p>
        )}

        <div className="space-y-3">
          <button className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-all">
            View {result.recommendation === 'AUN200' ? 'AUN 200' : 'AUN 250'}
          </button>
          
          <button
            onClick={onUpgrade}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-all"
          >
            Get Exact Fit Verification →
          </button>
        </div>

        {/* Email capture */}
        <div className="mt-8 p-4 bg-zinc-800/50 rounded-lg">
          <p className="text-zinc-400 text-sm mb-3">Enter email for $50 off when you're ready:</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
            />
            <button className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg text-sm">
              Get Offer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-zinc-500 text-sm">Quick Check</span>
        <span className="text-zinc-500 text-sm">{step + 1} of {QUICK_QUESTIONS.length}</span>
      </div>

      <h3 className="text-xl text-white font-medium mb-6">{currentQuestion.question}</h3>

      <div className="space-y-3">
        {currentQuestion.options.map(option => (
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
    </div>
  );
}

// Exact Fit flow
function ExactFitFlow({ onComplete, initialAnswers = {} }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
  const [result, setResult] = useState(null);
  const [measurementFeet, setMeasurementFeet] = useState('');
  const [measurementInches, setMeasurementInches] = useState('');

  // Filter questions based on conditional logic
  const activeQuestions = EXACT_QUESTIONS.filter(q => {
    if (!q.conditional) return true;
    return answers[q.conditional.field] === q.conditional.value;
  });

  const currentQuestion = activeQuestions[step];
  const isComplete = step >= activeQuestions.length;

  const handleAnswer = (value) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    // Recalculate active questions
    const newActiveQuestions = EXACT_QUESTIONS.filter(q => {
      if (!q.conditional) return true;
      return newAnswers[q.conditional.field] === q.conditional.value;
    });

    if (step + 1 >= newActiveQuestions.length) {
      const rec = calculateRecommendation(newAnswers, true);
      setResult(rec);
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handleMeasurement = () => {
    const totalInches = (parseInt(measurementFeet) * 12) + parseInt(measurementInches || 0);
    let bedLength = 'standard';
    if (totalInches < 70) bedLength = 'short';
    else if (totalInches >= 90) bedLength = 'long';
    
    handleAnswer(bedLength);
  };

  if (result) {
    return (
      <div className="text-center">
        {/* Verified badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-500 text-sm rounded-full mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Verified Fit</span>
        </div>

        {answers.truckMake && answers.truckModel && (
          <p className="text-amber-500 text-sm mb-2">
            Perfect for your {answers.truckYear} {answers.truckMake} {answers.truckModel}!
          </p>
        )}

        <h3 className="text-2xl font-bold text-white mb-2">
          {result.recommendation === 'AUN200' ? 'AUN 200' : result.recommendation === 'AUN250' ? 'AUN 250' : 'Custom Solution'}
        </h3>
        <p className="text-zinc-400 mb-4">{result.message}</p>

        {/* Verified details */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6 text-left">
          <p className="text-green-400 font-medium mb-2">Verified configuration:</p>
          <ul className="space-y-1 text-sm text-zinc-300">
            <li>✓ Bed length verified</li>
            {answers.hasTonneau === 'yes' && <li>✓ Tonneau cover compatible</li>}
            <li>✓ Weight within capacity</li>
            {answers.tailgate === 'yes' && <li>✓ Tailgate will close</li>}
          </ul>
        </div>

        {/* Guarantee */}
        <div className="bg-zinc-800/50 rounded-lg p-4 mb-6">
          <p className="text-white font-medium">🛡️ Fit Guarantee</p>
          <p className="text-zinc-400 text-sm">Doesn't fit? We pay return shipping.</p>
        </div>

        {result.price && (
          <p className="text-3xl font-bold text-white mb-6">${result.price.toLocaleString()}</p>
        )}

        <button className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-all">
          Add to Cart — ${result.price?.toLocaleString()}
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-zinc-500 text-sm">Exact Fit Configuration</span>
        <span className="text-zinc-500 text-sm">{step + 1} of {activeQuestions.length}</span>
      </div>

      <h3 className="text-xl text-white font-medium mb-2">{currentQuestion?.question}</h3>
      {currentQuestion?.helpText && (
        <p className="text-zinc-500 text-sm mb-4">{currentQuestion.helpText}</p>
      )}

      {/* Different input types */}
      {currentQuestion?.type === 'select' && (
        <select
          onChange={(e) => handleAnswer(e.target.value)}
          className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-amber-500 focus:outline-none"
        >
          <option value="">Select...</option>
          {currentQuestion.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      {currentQuestion?.type === 'input' && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={currentQuestion.placeholder}
            className="flex-1 p-4 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-amber-500 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value) {
                handleAnswer(e.target.value);
              }
            }}
          />
          {currentQuestion.suffix && (
            <span className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-500">
              {currentQuestion.suffix}
            </span>
          )}
        </div>
      )}

      {currentQuestion?.type === 'measurement' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-zinc-500 text-sm mb-1 block">Feet</label>
              <input
                type="number"
                value={measurementFeet}
                onChange={(e) => setMeasurementFeet(e.target.value)}
                placeholder="5"
                className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="text-zinc-500 text-sm mb-1 block">Inches</label>
              <input
                type="number"
                value={measurementInches}
                onChange={(e) => setMeasurementInches(e.target.value)}
                placeholder="6"
                className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={handleMeasurement}
            disabled={!measurementFeet}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-lg transition-all"
          >
            Continue
          </button>
        </div>
      )}

      {currentQuestion?.options && !currentQuestion.type && (
        <div className="space-y-3">
          {currentQuestion.options.map(option => (
            <button
              key={option.value}
              onClick={() => handleAnswer(option.value)}
              className="w-full p-4 text-left bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-lg transition-all"
            >
              <span className="text-white font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Option3ATwoEntryPoints() {
  const [selectedPath, setSelectedPath] = useState(null); // 'quick' | 'exact' | null
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleReset = () => {
    setSelectedPath(null);
    setShowUpgrade(false);
  };

  const handleUpgrade = () => {
    setSelectedPath('exact');
    setShowUpgrade(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-amber-500 text-sm">Option 3A: Two Entry Points</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl">
          {!selectedPath && (
            <EntrySelection onSelectPath={setSelectedPath} />
          )}

          {selectedPath === 'quick' && (
            <QuickCheckFlow 
              onComplete={() => {}} 
              onUpgrade={handleUpgrade}
            />
          )}

          {selectedPath === 'exact' && (
            <ExactFitFlow onComplete={() => {}} />
          )}

          {selectedPath && (
            <button
              onClick={handleReset}
              className="block mx-auto mt-6 text-zinc-500 hover:text-white text-sm"
            >
              ← Start over
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
