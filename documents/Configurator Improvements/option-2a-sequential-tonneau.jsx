// Option 2A: Sequential Tonneau Cover Steps
// Adds tonneau cover questions as additional conditional steps

import React, { useState, useEffect } from 'react';

const BASE_QUESTIONS = [
  {
    id: 'bedLength',
    question: "What's your truck bed length?",
    helpText: "Measure inside from bulkhead to tailgate",
    options: [
      { value: 'short', label: 'Short bed', sublabel: "5' - 5.8'" },
      { value: 'standard', label: 'Standard bed', sublabel: "6' - 6.5'" },
      { value: 'long', label: 'Long bed', sublabel: "8'+" },
      { value: 'unsure', label: "I'm not sure" },
    ],
  },
  {
    id: 'hasTonneau',
    question: "Does your truck have a tonneau cover?",
    helpText: "Also called a bed cover or truck bed cover",
    options: [
      { value: 'yes', label: 'Yes, I have a tonneau cover', sublabel: 'Any type of bed cover' },
      { value: 'no', label: 'No cover / Open bed', sublabel: 'Nothing covering the bed' },
    ],
  },
];

const TONNEAU_TYPE_QUESTION = {
  id: 'tonneauType',
  question: "What type of tonneau cover do you have?",
  helpText: "Select the style that best matches your cover",
  options: [
    { value: 'roll-up-soft', label: 'Roll-up (Soft)', sublabel: 'Vinyl/fabric that rolls toward cab' },
    { value: 'roll-up-hard', label: 'Roll-up (Hard)', sublabel: 'Aluminum slats that roll up' },
    { value: 'tri-fold-soft', label: 'Tri-fold (Soft)', sublabel: 'Three fabric panels that fold' },
    { value: 'tri-fold-hard', label: 'Tri-fold (Hard)', sublabel: 'Three rigid panels that fold' },
    { value: 'bi-fold', label: 'Bi-fold', sublabel: 'Two panels that fold in half' },
    { value: 'quad-fold', label: 'Quad-fold', sublabel: 'Four accordion-style panels' },
    { value: 'hinged', label: 'One-piece (Hinged)', sublabel: 'Single panel that lifts up' },
    { value: 'retractable', label: 'Retractable', sublabel: 'Slides into canister at cab' },
    { value: 'other', label: 'Other / Not listed', sublabel: 'Different style' },
  ],
};

const ROLL_DIRECTION_QUESTION = {
  id: 'rollDirection',
  question: "When your cover rolls up, where does it go?",
  helpText: "This affects how much bed space is available",
  options: [
    { value: 'on-top', label: 'Rolls ON TOP of the rails', sublabel: 'Toward cab, outside the bed - No bed space lost' },
    { value: 'into-bed', label: 'Rolls INTO the bed', sublabel: 'Takes up space inside - Reduces usable length ~8"' },
  ],
};

const REMAINING_QUESTIONS = [
  {
    id: 'bikeWeight',
    question: 'Approximate weight of your motorcycle?',
    helpText: 'Include gear, bags, and accessories',
    options: [
      { value: 'light', label: 'Under 500 lbs', sublabel: 'Sport bikes, dirt bikes' },
      { value: 'medium', label: '500-800 lbs', sublabel: 'Cruisers, mid-size touring' },
      { value: 'heavy', label: '800-1,200 lbs', sublabel: 'Full dressers, Goldwings' },
      { value: 'over', label: 'Over 1,200 lbs', sublabel: 'Trikes, sidecars' },
    ],
  },
  {
    id: 'tailgateRequired',
    question: 'Do you need to close your tailgate with the ramp installed?',
    helpText: 'Important for highway driving and security',
    options: [
      { value: 'yes', label: 'Yes, tailgate must close', sublabel: 'For highway trips, parking security' },
      { value: 'no', label: 'No, open tailgate is fine', sublabel: 'Short trips, local use' },
    ],
  },
];

function buildQuestionFlow(answers) {
  let questions = [...BASE_QUESTIONS];
  
  // Add tonneau type question if they have a cover
  if (answers.hasTonneau === 'yes') {
    questions.push(TONNEAU_TYPE_QUESTION);
    
    // Add roll direction if it's a roll-up type
    if (answers.tonneauType?.includes('roll-up')) {
      questions.push(ROLL_DIRECTION_QUESTION);
    }
  }
  
  // Add remaining questions
  questions = [...questions, ...REMAINING_QUESTIONS];
  
  return questions;
}

function calculateRecommendation(answers) {
  const issues = [];
  const notes = [];

  // Weight check
  if (answers.bikeWeight === 'over') {
    return {
      recommendation: 'custom',
      message: 'Your bike exceeds our 1,200 lb capacity. Contact us for custom solutions.',
      price: null,
      issues: ['Weight exceeds standard capacity'],
      notes: [],
    };
  }

  // Tonneau cover logic
  if (answers.hasTonneau === 'yes') {
    if (answers.rollDirection === 'into-bed') {
      notes.push('Your rolled cover reduces usable bed length by ~8"');
      if (answers.bedLength === 'short') {
        issues.push('Limited bed space with cover rolled');
      }
    }
    
    if (['tri-fold-soft', 'tri-fold-hard', 'bi-fold', 'quad-fold'].includes(answers.tonneauType)) {
      notes.push('Fold your cover toward the cab before loading');
    }
    
    if (answers.tonneauType === 'hinged') {
      notes.push('Open your cover fully before loading');
    }
    
    if (answers.tonneauType === 'retractable') {
      notes.push('Ensure canister is at least 10" from cab');
    }
  }

  // Recommendation logic
  const needsAUN250 = 
    answers.bedLength === 'short' || 
    answers.tailgateRequired === 'yes' || 
    answers.bedLength === 'unsure' ||
    (answers.rollDirection === 'into-bed' && answers.bedLength === 'short');

  if (needsAUN250) {
    return {
      recommendation: 'AUN250',
      message: 'The AUN 250 Folding Ramp is perfect for your setup.',
      price: 2795,
      issues,
      notes,
      tonneauCompatible: true,
    };
  }

  return {
    recommendation: 'AUN200',
    message: 'The AUN 200 Standard Ramp is ideal for your truck.',
    price: 2495,
    issues,
    notes,
    tonneauCompatible: true,
    alternateOption: { model: 'AUN 250', reason: 'If you want tailgate compatibility' },
  };
}

export default function Option2ASequentialTonneau() {
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const questions = buildQuestionFlow(answers);
  const currentQuestion = questions[step];
  const isComplete = step >= questions.length;
  const progress = (step / questions.length) * 100;

  useEffect(() => {
    if (isComplete && !result) {
      const calculatedResult = calculateRecommendation(answers);
      setResult(calculatedResult);
    }
  }, [isComplete, result, answers]);

  const handleAnswer = (questionId, value) => {
    setIsTransitioning(true);
    
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    setTimeout(() => {
      // Recalculate questions based on new answers
      const newQuestions = buildQuestionFlow(newAnswers);
      
      // Find next step
      const currentIndex = newQuestions.findIndex(q => q.id === questionId);
      setStep(currentIndex + 1);
      setIsTransitioning(false);
    }, 300);
  };

  const handleBack = () => {
    if (step > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setStep(prev => prev - 1);
        setResult(null);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleReset = () => {
    setStep(0);
    setAnswers({});
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black py-16 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Find Your Ramp</h2>
          <p className="text-zinc-400">Complete compatibility check</p>
          <p className="text-amber-500 text-sm mt-2">Option 2A: Sequential Tonneau Steps</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl">
          
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between text-xs text-zinc-500 mb-2">
              <span>Step {Math.min(step + 1, questions.length)} of {questions.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div
            className={`transition-all duration-300 ${isTransitioning ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}
          >
            {!isComplete ? (
              <div>
                {/* Back button */}
                {step > 0 && (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white mb-4 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                )}

                {/* Tonneau indicator */}
                {(currentQuestion?.id === 'tonneauType' || currentQuestion?.id === 'rollDirection') && (
                  <div className="mb-4 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-500 text-sm">
                    🚛 Tonneau Cover Configuration
                  </div>
                )}

                {/* Question */}
                <h3 className="text-xl text-white font-medium mb-2">
                  {currentQuestion?.question}
                </h3>
                {currentQuestion?.helpText && (
                  <p className="text-zinc-500 text-sm mb-6">{currentQuestion.helpText}</p>
                )}

                {/* Options */}
                <div className={`space-y-3 ${currentQuestion?.options?.length > 4 ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : ''}`}>
                  {currentQuestion?.options?.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(currentQuestion.id, option.value)}
                      className="w-full p-4 text-left bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500/50 rounded-lg transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <span className="text-white font-medium block">{option.label}</span>
                          {option.sublabel && (
                            <span className="text-zinc-500 text-sm">{option.sublabel}</span>
                          )}
                        </div>
                        <svg 
                          className="w-5 h-5 text-zinc-600 group-hover:text-amber-500 transition-colors" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Result */
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">
                  {result?.recommendation === 'custom' 
                    ? 'Custom Solution Needed'
                    : `We recommend the ${result?.recommendation === 'AUN200' ? 'AUN 200' : 'AUN 250'}`
                  }
                </h3>
                <p className="text-zinc-400 mb-4">{result?.message}</p>

                {/* Tonneau compatibility */}
                {answers.hasTonneau === 'yes' && result?.tonneauCompatible && (
                  <div className="mb-4 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-green-400 text-sm font-medium">
                      ✓ Compatible with your {answers.tonneauType?.replace(/-/g, ' ')} cover
                    </p>
                  </div>
                )}

                {/* Notes */}
                {result?.notes?.length > 0 && (
                  <div className="mb-6 text-left">
                    <p className="text-zinc-500 text-sm mb-2">Usage notes:</p>
                    {result.notes.map((note, i) => (
                      <p key={i} className="text-amber-500/80 text-sm flex items-start gap-2 mb-1">
                        <span>ℹ️</span>
                        <span>{note}</span>
                      </p>
                    ))}
                  </div>
                )}

                {/* Price */}
                {result?.price && (
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">${result.price.toLocaleString()}</span>
                    <span className="text-zinc-500 ml-2">+ free shipping</span>
                  </div>
                )}

                {/* CTA */}
                <button className="inline-flex items-center px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-all hover:scale-105">
                  {result?.recommendation === 'custom' ? 'Contact Us' : 'View Product'}
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>

                {/* Reset */}
                <button
                  onClick={handleReset}
                  className="block mx-auto mt-6 text-zinc-500 hover:text-white text-sm transition-colors"
                >
                  Start over
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
