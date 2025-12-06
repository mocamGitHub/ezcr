// Option 1D: Conversational Chat Interface
// Questions appear as chat messages with quick-reply buttons

import React, { useState, useEffect, useRef } from 'react';

const CONVERSATION_FLOW = [
  {
    id: 'greeting',
    type: 'bot',
    message: "Hey! 👋 I'm here to help you find the perfect ramp for your setup. Let's start with your truck – what's your bed length?",
    quickReplies: [
      { value: 'short', label: "Short (5'-5.8')" },
      { value: 'standard', label: "Standard (6'-6.5')" },
      { value: 'long', label: "Long (8'+)" },
      { value: 'unsure', label: "I'm not sure" },
    ],
    answerKey: 'bedLength',
  },
  {
    id: 'bedLengthResponse',
    type: 'bot',
    getMessage: (answers) => {
      if (answers.bedLength === 'short') return "Got it – short beds need our folding design for the best fit. Now, how much does your motorcycle weigh? 🏍️";
      if (answers.bedLength === 'unsure') return "No worries, we can figure it out! The AUN 250 works with most bed sizes. How about your motorcycle's weight? 🏍️";
      return "Nice! You've got good space to work with. How much does your bike weigh? 🏍️";
    },
    quickReplies: [
      { value: 'light', label: 'Under 500 lbs' },
      { value: 'medium', label: '500-800 lbs' },
      { value: 'heavy', label: '800-1,200 lbs' },
      { value: 'over', label: 'Over 1,200 lbs' },
    ],
    answerKey: 'bikeWeight',
  },
  {
    id: 'bikeWeightResponse',
    type: 'bot',
    getMessage: (answers) => {
      if (answers.bikeWeight === 'over') return null; // Will show custom result
      if (answers.bikeWeight === 'heavy') return "That's a nice touring bike! 💪 Last question – do you need to close your tailgate with the ramp installed?";
      return "Perfect! Last question – do you need your tailgate to close with the ramp in place?";
    },
    quickReplies: [
      { value: 'yes', label: 'Yes, must close' },
      { value: 'no', label: 'No, open is fine' },
    ],
    answerKey: 'tailgateRequired',
  },
];

function calculateRecommendation(answers) {
  if (answers.bikeWeight === 'over') {
    return {
      recommendation: 'custom',
      message: "That's a big machine! 💪 Your bike exceeds our standard 1,200 lb capacity. Let's get you connected with our team for a custom solution.",
      price: null,
      cta: 'Contact Our Team',
    };
  }

  if (answers.bedLength === 'short' || answers.tailgateRequired === 'yes' || answers.bedLength === 'unsure') {
    return {
      recommendation: 'AUN250',
      message: "Great news! 🎉 Based on your setup, the AUN 250 Folding Ramp is your perfect match. It'll handle your bike with ease and lets you close that tailgate!",
      price: 2795,
      features: ['Folds for tailgate closure', 'Fits beds 5\' and up', '1,200 lb capacity'],
      cta: 'View AUN 250',
    };
  }

  return {
    recommendation: 'AUN200',
    message: "Awesome! 🎉 The AUN 200 Standard Ramp is ideal for your setup. Full-length design gives you the smoothest loading angle.",
    price: 2495,
    features: ['Full-length design', 'Best for 6.5\'+ beds', '1,200 lb capacity'],
    cta: 'View AUN 200',
  };
}

// Typing indicator component
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-zinc-800 rounded-2xl rounded-bl-md w-fit">
      <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

// Bot message component
function BotMessage({ message, isNew }) {
  return (
    <div 
      className={`flex gap-3 transition-all duration-500 ${isNew ? 'opacity-100 translate-y-0' : 'opacity-100 translate-y-0'}`}
      style={{
        animation: isNew ? 'slideInLeft 0.4s ease-out' : 'none',
      }}
    >
      {/* Avatar */}
      <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-black">
        EZ
      </div>
      
      {/* Message bubble */}
      <div className="bg-zinc-800 text-white px-4 py-3 rounded-2xl rounded-bl-md max-w-[80%]">
        {message}
      </div>
    </div>
  );
}

// User message component
function UserMessage({ message }) {
  return (
    <div 
      className="flex justify-end"
      style={{ animation: 'slideInRight 0.3s ease-out' }}
    >
      <div className="bg-amber-500 text-black px-4 py-3 rounded-2xl rounded-br-md max-w-[80%] font-medium">
        {message}
      </div>
    </div>
  );
}

// Quick replies component
function QuickReplies({ options, onSelect, disabled }) {
  return (
    <div 
      className="flex flex-wrap gap-2 ml-11"
      style={{ animation: 'fadeInUp 0.4s ease-out' }}
    >
      {options.map((option, index) => (
        <button
          key={option.value}
          onClick={() => onSelect(option)}
          disabled={disabled}
          className={`px-4 py-2 bg-zinc-800 border border-zinc-700 hover:border-amber-500 hover:bg-zinc-700 
            text-white rounded-full text-sm transition-all duration-200
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          style={{
            animationDelay: `${index * 80}ms`,
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Result card in chat
function ResultCard({ result }) {
  return (
    <div 
      className="ml-11 bg-gradient-to-br from-zinc-800 to-zinc-900 border border-amber-500/30 rounded-2xl p-6 max-w-[90%]"
      style={{ animation: 'scaleIn 0.5s ease-out' }}
    >
      {/* Success indicator */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h4 className="text-white font-bold">
            {result.recommendation === 'custom' ? 'Custom Solution' : result.recommendation}
          </h4>
          <p className="text-zinc-400 text-sm">Your perfect match</p>
        </div>
      </div>

      {/* Features */}
      {result.features && (
        <div className="flex flex-wrap gap-2 mb-4">
          {result.features.map((feature, i) => (
            <span key={i} className="px-2 py-1 bg-zinc-700 text-zinc-300 text-xs rounded-full">
              ✓ {feature}
            </span>
          ))}
        </div>
      )}

      {/* Price */}
      {result.price && (
        <div className="mb-4">
          <span className="text-2xl font-bold text-white">${result.price.toLocaleString()}</span>
          <span className="text-zinc-500 ml-2 text-sm">+ free shipping</span>
        </div>
      )}

      {/* CTA */}
      <button className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all hover:scale-[1.02]">
        {result.cta}
      </button>
    </div>
  );
}

export default function Option1DConversational() {
  const [messages, setMessages] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [result, setResult] = useState(null);
  
  const chatEndRef = useRef(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, showQuickReplies]);

  // Initialize conversation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTyping(false);
      setMessages([{ type: 'bot', content: CONVERSATION_FLOW[0].message }]);
      setTimeout(() => setShowQuickReplies(true), 300);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleQuickReply = (option) => {
    const currentFlow = CONVERSATION_FLOW[currentStep];
    
    // Add user message
    setMessages(prev => [...prev, { type: 'user', content: option.label }]);
    setShowQuickReplies(false);
    
    // Update answers
    const newAnswers = { ...answers, [currentFlow.answerKey]: option.value };
    setAnswers(newAnswers);

    // Check if over weight - special handling
    if (currentFlow.answerKey === 'bikeWeight' && option.value === 'over') {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const calculatedResult = calculateRecommendation(newAnswers);
        setResult(calculatedResult);
        setMessages(prev => [...prev, { type: 'bot', content: calculatedResult.message }]);
        setTimeout(() => {
          setMessages(prev => [...prev, { type: 'result', content: calculatedResult }]);
        }, 500);
      }, 1000);
      return;
    }

    // Check if conversation is complete
    if (currentStep >= CONVERSATION_FLOW.length - 1) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const calculatedResult = calculateRecommendation(newAnswers);
        setResult(calculatedResult);
        setMessages(prev => [...prev, { type: 'bot', content: calculatedResult.message }]);
        setTimeout(() => {
          setMessages(prev => [...prev, { type: 'result', content: calculatedResult }]);
        }, 500);
      }, 1000);
      return;
    }

    // Move to next step
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const nextFlow = CONVERSATION_FLOW[nextStep];
      const message = typeof nextFlow.getMessage === 'function' 
        ? nextFlow.getMessage(newAnswers) 
        : nextFlow.message;
      
      if (message) {
        setMessages(prev => [...prev, { type: 'bot', content: message }]);
        setTimeout(() => setShowQuickReplies(true), 300);
      }
    }, 800 + Math.random() * 400);
  };

  const handleReset = () => {
    setMessages([]);
    setAnswers({});
    setCurrentStep(0);
    setIsTyping(true);
    setShowQuickReplies(false);
    setResult(null);

    setTimeout(() => {
      setIsTyping(false);
      setMessages([{ type: 'bot', content: CONVERSATION_FLOW[0].message }]);
      setTimeout(() => setShowQuickReplies(true), 300);
    }, 1000);
  };

  const currentQuickReplies = !result && CONVERSATION_FLOW[currentStep]?.quickReplies;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center font-bold text-black">
            EZ
          </div>
          <div>
            <h2 className="text-white font-bold">EZ Cycle Ramp</h2>
            <p className="text-zinc-400 text-sm">Ramp Finder Assistant</p>
          </div>
          <span className="ml-auto text-amber-500 text-xs">Option 1D</span>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-md mx-auto space-y-4">
          {messages.map((msg, index) => (
            <div key={index}>
              {msg.type === 'bot' && (
                <BotMessage message={msg.content} isNew={index === messages.length - 1} />
              )}
              {msg.type === 'user' && (
                <UserMessage message={msg.content} />
              )}
              {msg.type === 'result' && (
                <ResultCard result={msg.content} />
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-black">
                EZ
              </div>
              <TypingIndicator />
            </div>
          )}

          {/* Quick replies */}
          {showQuickReplies && currentQuickReplies && (
            <QuickReplies 
              options={currentQuickReplies} 
              onSelect={handleQuickReply}
              disabled={isTyping}
            />
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-zinc-900 border-t border-zinc-800 px-4 py-4">
        <div className="max-w-md mx-auto">
          {result ? (
            <button
              onClick={handleReset}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
            >
              Start New Conversation
            </button>
          ) : (
            <p className="text-center text-zinc-600 text-sm">
              Tap a quick reply above to continue
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
