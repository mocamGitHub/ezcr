// Option 3E: The Consultant Approach
// Quick quiz qualifies leads, then directs to schedule consultation

import React, { useState } from 'react';

const QUALIFICATION_QUESTIONS = [
  {
    id: 'truckType',
    question: "What type of truck do you drive?",
    options: [
      { value: 'full-size', label: 'Full-size', sublabel: 'F-150, Silverado, RAM 1500, Tundra', icon: '🛻' },
      { value: 'mid-size', label: 'Mid-size', sublabel: 'Tacoma, Ranger, Colorado, Frontier', icon: '🚙' },
      { value: 'compact', label: 'Compact', sublabel: 'Maverick, Santa Cruz, Ridgeline', icon: '🚗' },
    ],
  },
  {
    id: 'bikeType',
    question: "What type of motorcycle?",
    options: [
      { value: 'cruiser', label: 'Cruiser', sublabel: 'Sportster, Scout, Bolt', icon: '🏍️' },
      { value: 'touring', label: 'Touring', sublabel: 'Road Glide, Goldwing, Indian', icon: '🏍️' },
      { value: 'sport', label: 'Sport/Adventure', sublabel: 'R1200GS, Africa Twin, KTM', icon: '🏍️' },
      { value: 'dirt', label: 'Dirt/Dual-sport', sublabel: 'CRF, KLR, DR', icon: '🏍️' },
    ],
  },
  {
    id: 'useCase',
    question: "Primary use case?",
    options: [
      { value: 'weekend', label: 'Weekend rides', sublabel: 'Local trips around home' },
      { value: 'distance', label: 'Long-distance', sublabel: 'Rallies, cross-country trips' },
      { value: 'track', label: 'Track days', sublabel: 'Racing, performance events' },
      { value: 'work', label: 'Work/Commercial', sublabel: 'Business use, deliveries' },
    ],
  },
  {
    id: 'timeline',
    question: "Where are you in your decision?",
    options: [
      { value: 'ready', label: 'Ready to buy', sublabel: 'Looking to purchase soon' },
      { value: 'researching', label: 'Seriously researching', sublabel: '1-3 months timeline' },
      { value: 'early', label: 'Early research', sublabel: 'Just starting to look' },
      { value: 'browsing', label: 'Just browsing', sublabel: 'Not sure if I need this' },
    ],
  },
];

function calculateQualification(answers) {
  let score = 0;
  
  // Truck type scoring
  if (answers.truckType === 'full-size') score += 3;
  else if (answers.truckType === 'mid-size') score += 2;
  else score += 1;
  
  // Bike type scoring
  if (answers.bikeType === 'touring') score += 3;
  else if (answers.bikeType === 'cruiser') score += 2;
  else score += 1;
  
  // Use case scoring
  if (answers.useCase === 'distance' || answers.useCase === 'weekend') score += 2;
  else score += 1;
  
  // Timeline scoring
  if (answers.timeline === 'ready') score += 4;
  else if (answers.timeline === 'researching') score += 3;
  else if (answers.timeline === 'early') score += 1;
  else score += 0;
  
  if (score >= 9) return 'high';
  if (score >= 6) return 'medium';
  return 'low';
}

// Calendly mock component
function CalendlyEmbed({ onScheduled }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  const dates = [
    { label: 'Tomorrow', date: 'Nov 15' },
    { label: 'Friday', date: 'Nov 17' },
    { label: 'Monday', date: 'Nov 20' },
    { label: 'Tuesday', date: 'Nov 21' },
  ];

  const times = ['9:00 AM', '10:30 AM', '1:00 PM', '2:30 PM', '4:00 PM'];

  const handleSubmit = (e) => {
    e.preventDefault();
    onScheduled({ ...formData, date: selectedDate, time: selectedTime });
  };

  return (
    <div className="space-y-4">
      <p className="text-white font-medium">Select a date:</p>
      <div className="grid grid-cols-4 gap-2">
        {dates.map(d => (
          <button
            key={d.date}
            onClick={() => setSelectedDate(d)}
            className={`p-3 rounded-lg text-center transition-all ${
              selectedDate?.date === d.date
                ? 'bg-amber-500 text-black'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <span className="block text-xs">{d.label}</span>
            <span className="block font-medium">{d.date}</span>
          </button>
        ))}
      </div>

      {selectedDate && (
        <>
          <p className="text-white font-medium pt-4">Select a time:</p>
          <div className="grid grid-cols-3 gap-2">
            {times.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTime(t)}
                className={`p-2 rounded text-sm transition-all ${
                  selectedTime === t
                    ? 'bg-amber-500 text-black'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </>
      )}

      {selectedTime && (
        <form onSubmit={handleSubmit} className="space-y-3 pt-4">
          <input
            type="text"
            placeholder="Your name"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
          />
          <input
            type="email"
            placeholder="Email address"
            required
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
          />
          <input
            type="tel"
            placeholder="Phone number"
            required
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
          />
          <button
            type="submit"
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg"
          >
            Confirm Consultation
          </button>
        </form>
      )}
    </div>
  );
}

// Callback request form
function CallbackForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bestTime: 'morning',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-zinc-400 text-sm mb-1 block">Your name</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
        />
      </div>
      <div>
        <label className="text-zinc-400 text-sm mb-1 block">Phone number</label>
        <input
          type="tel"
          required
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
        />
      </div>
      <div>
        <label className="text-zinc-400 text-sm mb-1 block">Best time to call</label>
        <select
          value={formData.bestTime}
          onChange={(e) => setFormData(prev => ({ ...prev, bestTime: e.target.value }))}
          className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
        >
          <option value="morning">Morning (9am-12pm)</option>
          <option value="afternoon">Afternoon (12pm-5pm)</option>
          <option value="evening">Evening (5pm-7pm)</option>
        </select>
      </div>
      <button
        type="submit"
        className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg"
      >
        Request Callback
      </button>
    </form>
  );
}

// Confirmation screen
function BookingConfirmation({ booking }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h3 className="text-xl font-bold text-white mb-2">You're Booked!</h3>
      
      <div className="bg-zinc-800 rounded-lg p-4 my-6 text-left">
        <p className="text-zinc-400 text-sm">Consultation Details:</p>
        <p className="text-white">{booking.date?.label}, {booking.date?.date} at {booking.time}</p>
        <p className="text-zinc-400 text-sm mt-2">We'll call: {booking.phone}</p>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-left">
        <p className="text-amber-500 font-medium mb-2">📝 Before your call:</p>
        <ul className="space-y-2 text-zinc-300 text-sm">
          <li className="flex items-start gap-2">
            <span>□</span>
            <span>Measure your truck bed (inside, bulkhead to tailgate)</span>
          </li>
          <li className="flex items-start gap-2">
            <span>□</span>
            <span>Know your motorcycle's weight</span>
          </li>
          <li className="flex items-start gap-2">
            <span>□</span>
            <span>Take a photo of your setup (optional but helpful)</span>
          </li>
        </ul>
      </div>

      <p className="text-zinc-500 text-sm mt-6">
        📧 Check your email for calendar invite and prep details.
      </p>
    </div>
  );
}

// Non-qualified result (self-service)
function SelfServiceResult({ onReset }) {
  return (
    <div className="text-center">
      <h3 className="text-xl font-bold text-white mb-4">Explore at Your Own Pace</h3>
      <p className="text-zinc-400 mb-6">
        No pressure! Here's what you might want to check out:
      </p>

      <div className="space-y-3 mb-6">
        <a href="#" className="block p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-left transition-all">
          <span className="text-amber-500 mr-2">📖</span>
          <span className="text-white">How EZ Cycle Ramp Works</span>
          <span className="text-zinc-500 text-sm block ml-6">Product overview</span>
        </a>
        <a href="#" className="block p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-left transition-all">
          <span className="text-amber-500 mr-2">🎥</span>
          <span className="text-white">Watch the Demo Video</span>
          <span className="text-zinc-500 text-sm block ml-6">See it in action</span>
        </a>
        <a href="#" className="block p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-left transition-all">
          <span className="text-amber-500 mr-2">📋</span>
          <span className="text-white">Compatibility Guide</span>
          <span className="text-zinc-500 text-sm block ml-6">Check your truck/bike</span>
        </a>
        <a href="#" className="block p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-left transition-all">
          <span className="text-amber-500 mr-2">❓</span>
          <span className="text-white">FAQ</span>
          <span className="text-zinc-500 text-sm block ml-6">Common questions answered</span>
        </a>
      </div>

      <p className="text-zinc-500 text-sm mb-4">When you're ready, we're here to help:</p>

      <div className="grid grid-cols-2 gap-3">
        <button className="py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg">
          Schedule Consultation
        </button>
        <button className="py-3 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg">
          Browse Products
        </button>
      </div>

      <button onClick={onReset} className="mt-6 text-zinc-500 hover:text-white text-sm">
        Start over
      </button>
    </div>
  );
}

export default function Option3EConsultantApproach() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [qualification, setQualification] = useState(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showCallback, setShowCallback] = useState(false);
  const [booking, setBooking] = useState(null);

  const currentQuestion = QUALIFICATION_QUESTIONS[step];
  const isComplete = step >= QUALIFICATION_QUESTIONS.length;

  const handleAnswer = (value) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    if (step + 1 >= QUALIFICATION_QUESTIONS.length) {
      setQualification(calculateQualification(newAnswers));
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handleScheduled = (data) => {
    setBooking(data);
  };

  const handleReset = () => {
    setStep(0);
    setAnswers({});
    setQualification(null);
    setShowScheduler(false);
    setShowCallback(false);
    setBooking(null);
  };

  // Booking confirmation
  if (booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black py-16 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">
            <BookingConfirmation booking={booking} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black py-16 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            {!qualification ? 'Let\'s Find Your Fit' : 'Great News!'}
          </h2>
          <p className="text-amber-500 text-sm">Option 3E: Consultant Approach</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">
          
          {/* Qualification Questions */}
          {!qualification && (
            <>
              <div className="flex items-center justify-between mb-6">
                <span className="text-zinc-500 text-sm">Quick assessment</span>
                <span className="text-zinc-500 text-sm">{step + 1} of {QUALIFICATION_QUESTIONS.length}</span>
              </div>

              <h3 className="text-xl text-white font-medium mb-6">{currentQuestion?.question}</h3>

              <div className="space-y-3">
                {currentQuestion?.options.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(option.value)}
                    className="w-full p-4 text-left bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500 rounded-lg transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {option.icon && <span className="text-2xl">{option.icon}</span>}
                      <div>
                        <span className="text-white font-medium block">{option.label}</span>
                        {option.sublabel && (
                          <span className="text-zinc-500 text-sm">{option.sublabel}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Qualified Result - Offer Consultation */}
          {qualification && (qualification === 'high' || qualification === 'medium') && !showScheduler && !showCallback && (
            <div className="text-center">
              <p className="text-green-400 text-sm mb-2">✓ EZ Cycle Ramp looks like a great fit!</p>
              
              <h3 className="text-xl font-bold text-white mb-4">
                Let's dial in the perfect configuration
              </h3>

              <div className="bg-zinc-800/50 rounded-lg p-4 mb-6">
                <p className="text-white font-medium mb-2">📞 Free Fit Consultation</p>
                <p className="text-zinc-400 text-sm">In just 5 minutes, we'll:</p>
                <ul className="text-zinc-400 text-sm text-left mt-2 space-y-1 ml-4">
                  <li>✓ Verify exact compatibility with your truck</li>
                  <li>✓ Recommend the right model for your bike</li>
                  <li>✓ Answer any questions you have</li>
                  <li>✓ Share exclusive pricing if you're ready</li>
                </ul>
              </div>

              <button
                onClick={() => setShowScheduler(true)}
                className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg mb-3"
              >
                Schedule Free Consultation
              </button>

              <button
                onClick={() => setShowCallback(true)}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg mb-3"
              >
                Request a Callback Instead
              </button>

              <p className="text-zinc-500 text-sm">
                Or call now: <span className="text-amber-500">(800) 555-RAMP</span>
              </p>

              <button
                onClick={handleReset}
                className="mt-6 text-zinc-500 hover:text-white text-sm"
              >
                Skip, browse products
              </button>
            </div>
          )}

          {/* Scheduler */}
          {showScheduler && (
            <div>
              <button
                onClick={() => setShowScheduler(false)}
                className="flex items-center gap-2 text-zinc-400 hover:text-white mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h3 className="text-lg font-medium text-white mb-4">Schedule Your Consultation</h3>
              <CalendlyEmbed onScheduled={handleScheduled} />
            </div>
          )}

          {/* Callback Form */}
          {showCallback && (
            <div>
              <button
                onClick={() => setShowCallback(false)}
                className="flex items-center gap-2 text-zinc-400 hover:text-white mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h3 className="text-lg font-medium text-white mb-4">Request a Callback</h3>
              <p className="text-zinc-400 text-sm mb-4">
                Leave your details and we'll call you.
              </p>
              <CallbackForm onSubmit={(data) => setBooking({ ...data, date: { label: 'Today', date: 'Soon' }, time: data.bestTime })} />
            </div>
          )}

          {/* Non-Qualified Result */}
          {qualification === 'low' && (
            <SelfServiceResult onReset={handleReset} />
          )}
        </div>
      </div>
    </div>
  );
}
