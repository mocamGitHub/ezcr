// Option 1A: Polish the Current Architecture
// Premium animations with spring physics, staggered reveals, and satisfying micro-interactions

import React, { useState, useEffect, useCallback } from 'react';

const QUESTIONS = [
  {
    id: 'bedLength',
    question: "What's your truck bed length?",
    helpText: "Check your truck's specs or measure from bulkhead to tailgate",
    options: [
      { value: 'short', label: 'Short bed', sublabel: "5' - 5.8'", icon: '📏' },
      { value: 'standard', label: 'Standard bed', sublabel: "6' - 6.5'", icon: '📐' },
      { value: 'long', label: 'Long bed', sublabel: "8'+", icon: '📏' },
      { value: 'unsure', label: "I'm not sure", sublabel: 'Help me decide', icon: '❓' },
    ],
  },
  {
    id: 'bikeWeight',
    question: 'Approximate weight of your motorcycle?',
    helpText: 'Include gear, bags, and accessories',
    options: [
      { value: 'light', label: 'Under 500 lbs', sublabel: 'Sportster, Street, Dirt bikes', icon: '🏍️' },
      { value: 'medium', label: '500-800 lbs', sublabel: 'Road King, Indian Scout', icon: '🏍️' },
      { value: 'heavy', label: '800-1,200 lbs', sublabel: 'Road Glide, Goldwing', icon: '🏍️' },
      { value: 'over', label: 'Over 1,200 lbs', sublabel: 'Trikes, heavily modified', icon: '⚠️' },
    ],
  },
  {
    id: 'tailgateRequired',
    question: 'Do you need to close your tailgate with the ramp installed?',
    helpText: 'Important for highway driving and security',
    options: [
      { value: 'yes', label: 'Yes, tailgate must close', sublabel: 'For highway trips, parking security', icon: '✅' },
      { value: 'no', label: 'No, open tailgate is fine', sublabel: 'Short trips, trailer use', icon: '➖' },
    ],
  },
];

function calculateRecommendation(answers) {
  if (answers.bikeWeight === 'over') {
    return {
      recommendation: 'custom',
      confidence: 'high',
      message: 'Your bike exceeds our 1,200 lb capacity. Contact us for custom solutions.',
      price: null,
      productUrl: '/contact',
    };
  }

  if (answers.bedLength === 'unsure') {
    return {
      recommendation: 'AUN250',
      confidence: 'medium',
      message: "Not sure about your bed length? The AUN 250 works with most trucks.",
      price: 2795,
      alternateOption: { model: 'AUN 200', reason: 'Better for beds 6.5\' or longer' },
    };
  }

  if (answers.bedLength === 'short' || answers.tailgateRequired === 'yes') {
    return {
      recommendation: 'AUN250',
      confidence: 'high',
      message: 'The AUN 250 Folding Ramp is perfect for your setup.',
      price: 2795,
    };
  }

  return {
    recommendation: 'AUN200',
    confidence: 'high',
    message: 'The AUN 200 Standard Ramp is ideal for your truck.',
    price: 2495,
    alternateOption: { model: 'AUN 250', reason: 'If you want tailgate compatibility' },
  };
}

// Animated checkmark SVG
function AnimatedCheckmark({ show }) {
  return (
    <svg 
      className="w-16 h-16 mx-auto" 
      viewBox="0 0 52 52"
      style={{ 
        opacity: show ? 1 : 0,
        transform: show ? 'scale(1)' : 'scale(0.8)',
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
    >
      <circle 
        cx="26" cy="26" r="25" 
        fill="none" 
        stroke="#f59e0b" 
        strokeWidth="2"
        strokeDasharray="157"
        strokeDashoffset={show ? 0 : 157}
        style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
      />
      <path 
        fill="none" 
        stroke="#f59e0b" 
        strokeWidth="3" 
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 27l7 7 16-16"
        strokeDasharray="40"
        strokeDashoffset={show ? 0 : 40}
        style={{ transition: 'stroke-dashoffset 0.4s ease-out 0.3s' }}
      />
    </svg>
  );
}

// Animated counter for price
function AnimatedPrice({ value, show }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    if (!show) {
      setDisplayValue(0);
      return;
    }
    
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value, show]);
  
  return (
    <span className="tabular-nums">${displayValue.toLocaleString()}</span>
  );
}

export default function Option1APolishedAnimations() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const currentQuestion = QUESTIONS[step];
  const isComplete = step >= QUESTIONS.length;
  const progress = (step / QUESTIONS.length) * 100;

  useEffect(() => {
    if (isComplete && !result) {
      const calculatedResult = calculateRecommendation(answers);
      setResult(calculatedResult);
      setTimeout(() => setShowResult(true), 300);
    }
  }, [isComplete, result, answers]);

  const handleAnswer = useCallback((questionId, value) => {
    setSelectedOption(value);
    
    // Show selection feedback
    setTimeout(() => {
      setIsTransitioning(true);
      setAnswers(prev => ({ ...prev, [questionId]: value }));
      
      // Transition to next step
      setTimeout(() => {
        setStep(prev => prev + 1);
        setSelectedOption(null);
        setIsTransitioning(false);
      }, 400);
    }, 300);
  }, []);

  const handleBack = () => {
    if (step > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setStep(prev => prev - 1);
        setResult(null);
        setShowResult(false);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleReset = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(0);
      setAnswers({});
      setResult(null);
      setShowResult(false);
      setSelectedOption(null);
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black py-16 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Find Your Ramp</h2>
          <p className="text-zinc-400">Answer {QUESTIONS.length} quick questions</p>
          <p className="text-amber-500 text-sm mt-2">Option 1A: Polished Animations</p>
        </div>

        {/* Card */}
        <div 
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl overflow-hidden"
          style={{
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between text-xs text-zinc-500 mb-2">
              <span>Step {Math.min(step + 1, QUESTIONS.length)} of {QUESTIONS.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                style={{
                  width: `${progress}%`,
                  transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)',
                }}
              />
            </div>
          </div>

          {/* Content */}
          <div
            style={{
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? 'translateX(-20px)' : 'translateX(0)',
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {!isComplete ? (
              /* Question View */
              <div>
                {/* Back button */}
                {step > 0 && (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white mb-4 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                )}

                {/* Question */}
                <h3 className="text-xl text-white font-medium mb-2">
                  {currentQuestion?.question}
                </h3>
                {currentQuestion?.helpText && (
                  <p className="text-zinc-500 text-sm mb-6">{currentQuestion.helpText}</p>
                )}

                {/* Options with staggered animation */}
                <div className="space-y-3">
                  {currentQuestion?.options.map((option, index) => {
                    const isSelected = selectedOption === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleAnswer(currentQuestion.id, option.value)}
                        disabled={selectedOption !== null}
                        className={`w-full p-4 text-left rounded-lg transition-all duration-300 group relative overflow-hidden
                          ${isSelected 
                            ? 'bg-amber-500/20 border-2 border-amber-500 scale-[1.02]' 
                            : 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500/50'
                          }
                          ${selectedOption && !isSelected ? 'opacity-50' : 'opacity-100'}
                        `}
                        style={{
                          animationDelay: `${index * 80}ms`,
                          animation: 'slideInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                          transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                        }}
                      >
                        {/* Selection glow effect */}
                        {isSelected && (
                          <div 
                            className="absolute inset-0 bg-amber-500/10 animate-pulse"
                            style={{ animationDuration: '0.5s' }}
                          />
                        )}
                        
                        <div className="flex items-center gap-4 relative z-10">
                          <span 
                            className="text-2xl transition-transform duration-300"
                            style={{ transform: isSelected ? 'scale(1.2)' : 'scale(1)' }}
                          >
                            {option.icon}
                          </span>
                          <div className="flex-1">
                            <span className="text-white font-medium block">{option.label}</span>
                            {option.sublabel && (
                              <span className="text-zinc-500 text-sm">{option.sublabel}</span>
                            )}
                          </div>
                          <div className={`transition-all duration-300 ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                            <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          {!isSelected && (
                            <svg 
                              className="w-5 h-5 text-zinc-600 group-hover:text-amber-500 transition-colors duration-200" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Result View */
              <div className="text-center">
                {/* Success icon */}
                <div className="mb-6">
                  <AnimatedCheckmark show={showResult} />
                </div>

                {/* Recommendation */}
                <h3 
                  className="text-2xl font-bold text-white mb-2"
                  style={{
                    opacity: showResult ? 1 : 0,
                    transform: showResult ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.5s ease-out 0.4s',
                  }}
                >
                  {result?.recommendation === 'custom' 
                    ? 'Custom Solution Needed'
                    : `We recommend the ${result?.recommendation === 'AUN200' ? 'AUN 200' : 'AUN 250'}`
                  }
                </h3>
                <p 
                  className="text-zinc-400 mb-6"
                  style={{
                    opacity: showResult ? 1 : 0,
                    transform: showResult ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.5s ease-out 0.5s',
                  }}
                >
                  {result?.message}
                </p>

                {/* Price */}
                {result?.price && (
                  <div 
                    className="mb-6"
                    style={{
                      opacity: showResult ? 1 : 0,
                      transform: showResult ? 'scale(1)' : 'scale(0.9)',
                      transition: 'all 0.5s ease-out 0.6s',
                    }}
                  >
                    <span className="text-4xl font-bold text-white">
                      <AnimatedPrice value={result.price} show={showResult} />
                    </span>
                    <span className="text-zinc-500 ml-2">+ free shipping</span>
                  </div>
                )}

                {/* Confidence indicator */}
                {result?.confidence === 'medium' && (
                  <p 
                    className="text-amber-500/70 text-sm mb-6"
                    style={{
                      opacity: showResult ? 1 : 0,
                      transition: 'opacity 0.5s ease-out 0.7s',
                    }}
                  >
                    💡 Tip: Measure your truck bed to confirm the best fit
                  </p>
                )}

                {/* Primary CTA */}
                <button
                  className="inline-flex items-center px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/25"
                  style={{
                    opacity: showResult ? 1 : 0,
                    transform: showResult ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.5s ease-out 0.7s',
                  }}
                >
                  {result?.recommendation === 'custom' ? 'Contact Us' : `View ${result?.recommendation === 'AUN200' ? 'AUN 200' : 'AUN 250'}`}
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>

                {/* Alternate option */}
                {result?.alternateOption && (
                  <p 
                    className="mt-4 text-zinc-500 text-sm"
                    style={{
                      opacity: showResult ? 1 : 0,
                      transition: 'opacity 0.5s ease-out 0.8s',
                    }}
                  >
                    Or consider the{' '}
                    <span className="text-amber-500 hover:underline cursor-pointer">
                      {result.alternateOption.model}
                    </span>
                    {' '}— {result.alternateOption.reason}
                  </p>
                )}

                {/* Reset */}
                <button
                  onClick={handleReset}
                  className="block mx-auto mt-6 text-zinc-500 hover:text-white text-sm transition-colors duration-200"
                  style={{
                    opacity: showResult ? 1 : 0,
                    transition: 'opacity 0.5s ease-out 0.9s',
                  }}
                >
                  Start over
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Trust indicators */}
        <p className="text-center mt-6 text-zinc-600 text-sm">
          🔒 No email required • Takes 30 seconds
        </p>
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
