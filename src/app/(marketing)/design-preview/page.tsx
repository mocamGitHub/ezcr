'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ShoppingCart, Phone, Mail, Printer, Share2 } from 'lucide-react'

// ==============================================
// PROGRESS BAR ALTERNATIVES
// ==============================================

// CURRENT: Horizontal with all labels (problematic on mobile)
function ProgressBarCurrent({ currentStep = 2 }: { currentStep?: number }) {
  const steps = ['Vehicle', 'Measurements', 'Motorcycle', 'Configuration', 'Quote']
  return (
    <div className="w-full bg-secondary/10 rounded-[20px] px-6 py-6">
      <div className="relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border mx-5">
          <div className="h-full bg-primary transition-all" style={{ width: `${((currentStep - 1) / 4) * 100}%` }} />
        </div>
        <div className="relative flex justify-between">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                ${i + 1 === currentStep ? 'bg-primary text-white scale-125' : ''}
                ${i + 1 < currentStep ? 'bg-green-500 text-white' : ''}
                ${i + 1 > currentStep ? 'bg-muted text-muted-foreground' : ''}`}>
                {i + 1 < currentStep ? <Check className="w-5 h-5" /> : i + 1}
              </div>
              <span className={`mt-2 text-sm font-medium ${i + 1 === currentStep ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// OPTION A: Compact Pill Indicator
function ProgressBarOptionA({ currentStep = 2 }: { currentStep?: number }) {
  const steps = ['Vehicle', 'Measurements', 'Motorcycle', 'Configuration', 'Quote']
  return (
    <div className="w-full bg-secondary/10 rounded-full px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Back arrow */}
        <button className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30" disabled={currentStep === 1}>
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Center: Current step info */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all ${
                i + 1 === currentStep ? 'w-8 bg-primary' :
                i + 1 < currentStep ? 'w-2 bg-green-500' : 'w-2 bg-muted'
              }`} />
            ))}
          </div>
          <span className="text-sm font-semibold">
            Step {currentStep}: {steps[currentStep - 1]}
          </span>
        </div>

        {/* Forward arrow */}
        <button className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30" disabled={currentStep === 5}>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

// OPTION B: Vertical Stepper (collapsed, mobile-first)
function ProgressBarOptionB({ currentStep = 2 }: { currentStep?: number }) {
  const steps = ['Vehicle', 'Measurements', 'Motorcycle', 'Configuration', 'Quote']
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="w-full bg-secondary/10 rounded-xl overflow-hidden">
      {/* Collapsed header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
            {currentStep}
          </div>
          <div className="text-left">
            <p className="text-xs text-muted-foreground">Step {currentStep} of 5</p>
            <p className="font-semibold">{steps[currentStep - 1]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${(currentStep / 5) * 100}%` }} />
          </div>
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Expanded: Show all steps */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50">
          {steps.map((step, i) => (
            <div key={i} className={`flex items-center gap-3 py-2 ${i + 1 === currentStep ? 'text-primary' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold
                ${i + 1 === currentStep ? 'bg-primary text-white' : ''}
                ${i + 1 < currentStep ? 'bg-green-500 text-white' : ''}
                ${i + 1 > currentStep ? 'bg-muted text-muted-foreground' : ''}`}>
                {i + 1 < currentStep ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span className={i + 1 <= currentStep ? 'font-medium' : 'text-muted-foreground'}>{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// OPTION C: Bottom Tab Bar Style
function ProgressBarOptionC({ currentStep = 2 }: { currentStep?: number }) {
  const steps = [
    { name: 'Vehicle', icon: '🚙' },
    { name: 'Size', icon: '📏' },
    { name: 'Bike', icon: '🏍️' },
    { name: 'Options', icon: '⚙️' },
    { name: 'Quote', icon: '💰' },
  ]

  return (
    <div className="w-full bg-secondary/10 rounded-xl p-2">
      <div className="flex">
        {steps.map((step, i) => (
          <button
            key={i}
            className={`flex-1 py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all
              ${i + 1 === currentStep ? 'bg-primary text-white' : ''}
              ${i + 1 < currentStep ? 'text-green-500' : ''}
              ${i + 1 > currentStep ? 'text-muted-foreground opacity-50' : ''}`}
          >
            <span className="text-lg">{i + 1 < currentStep ? '✓' : step.icon}</span>
            <span className="text-[10px] font-medium leading-tight">{step.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// OPTION D: Minimal Dots with Floating Label
function ProgressBarOptionD({ currentStep = 2 }: { currentStep?: number }) {
  const steps = ['Vehicle', 'Measurements', 'Motorcycle', 'Configuration', 'Quote']

  return (
    <div className="w-full">
      {/* Floating current step label */}
      <div className="text-center mb-3">
        <span className="inline-block bg-primary text-white text-sm font-semibold px-4 py-1.5 rounded-full">
          {steps[currentStep - 1]}
        </span>
      </div>

      {/* Minimal dot indicators */}
      <div className="flex justify-center gap-3">
        {steps.map((_, i) => (
          <button
            key={i}
            className={`rounded-full transition-all ${
              i + 1 === currentStep ? 'w-10 h-3 bg-primary' :
              i + 1 < currentStep ? 'w-3 h-3 bg-green-500' : 'w-3 h-3 bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Step counter */}
      <p className="text-center text-xs text-muted-foreground mt-2">
        Step {currentStep} of 5
      </p>
    </div>
  )
}

// ==============================================
// STEP 4 CONFIGURATION ALTERNATIVES
// ==============================================

const mockProducts = {
  models: [
    { id: 'AUN250', name: 'AUN250 Folding Ramp', price: 1299, recommended: true },
    { id: 'AUN210', name: 'AUN210 Standard Ramp', price: 999 },
  ],
  extensions: [
    { id: 'none', name: 'No Extension', price: 0 },
    { id: 'ext1', name: 'Extension 1 (12")', price: 149, recommended: true },
    { id: 'ext2', name: 'Extension 2 (24")', price: 249 },
    { id: 'ext3', name: 'Extension 3 (36")', price: 349 },
  ],
  delivery: [
    { id: 'pickup', name: 'Local Pickup', price: 0 },
    { id: 'ship', name: 'Shipping', price: 199 },
  ],
  services: [
    { id: 'none', name: 'Not Assembled', price: 0 },
    { id: 'assembly', name: 'Assembly Service', price: 199 },
    { id: 'demo', name: 'Demo & Training', price: 299 },
  ],
}

// CURRENT: All sections visible, lots of scrolling
function Step4Current() {
  const [selected, setSelected] = useState({ model: 'AUN250', ext: 'ext1', delivery: 'pickup', service: 'none' })

  return (
    <div className="space-y-6 max-h-[500px] overflow-y-auto p-4 bg-card rounded-xl border">
      <p className="text-sm text-muted-foreground">Current: All sections visible (scroll to see all)</p>

      {/* Models */}
      <div>
        <h3 className="font-semibold mb-3">Select Ramp Model</h3>
        <div className="grid grid-cols-1 gap-3">
          {mockProducts.models.map(m => (
            <button key={m.id} onClick={() => setSelected({...selected, model: m.id})}
              className={`p-4 rounded-xl border-2 text-left ${selected.model === m.id ? 'border-orange-500 bg-orange-500/10' : 'border-border'}`}>
              <div className="flex justify-between">
                <span className="font-semibold">{m.name}</span>
                <span className="font-bold">${m.price}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Extensions */}
      <div>
        <h3 className="font-semibold mb-3">Ramp Extensions</h3>
        <div className="grid grid-cols-2 gap-2">
          {mockProducts.extensions.map(e => (
            <button key={e.id} onClick={() => setSelected({...selected, ext: e.id})}
              className={`p-3 rounded-xl border-2 text-left text-sm ${selected.ext === e.id ? 'border-orange-500 bg-orange-500/10' : 'border-border'}`}>
              <p className="font-medium">{e.name}</p>
              <p className="font-bold">${e.price}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Delivery */}
      <div>
        <h3 className="font-semibold mb-3">Delivery Options</h3>
        <div className="space-y-2">
          {mockProducts.delivery.map(d => (
            <button key={d.id} onClick={() => setSelected({...selected, delivery: d.id})}
              className={`w-full p-3 rounded-xl border-2 text-left ${selected.delivery === d.id ? 'border-orange-500 bg-orange-500/10' : 'border-border'}`}>
              <div className="flex justify-between">
                <span>{d.name}</span>
                <span className="font-bold">${d.price}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Services */}
      <div>
        <h3 className="font-semibold mb-3">Services</h3>
        <div className="space-y-2">
          {mockProducts.services.map(s => (
            <button key={s.id} onClick={() => setSelected({...selected, service: s.id})}
              className={`w-full p-3 rounded-xl border-2 text-left ${selected.service === s.id ? 'border-orange-500 bg-orange-500/10' : 'border-border'}`}>
              <div className="flex justify-between">
                <span>{s.name}</span>
                <span className="font-bold">${s.price}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// OPTION A: Accordion Sections
function Step4OptionA() {
  const [openSection, setOpenSection] = useState('model')
  const [selected, setSelected] = useState({ model: 'AUN250', ext: 'ext1', delivery: 'pickup', service: 'none' })

  const sections = [
    { id: 'model', title: 'Ramp Model', value: 'AUN250 Folding Ramp', price: '$1,299' },
    { id: 'ext', title: 'Extension', value: 'Extension 1 (12")', price: '$149' },
    { id: 'delivery', title: 'Delivery', value: 'Local Pickup', price: '$0' },
    { id: 'service', title: 'Service', value: 'Not Assembled', price: '$0' },
  ]

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <p className="text-sm text-muted-foreground p-4 border-b">Option A: Accordion (one open at a time)</p>

      {sections.map((section) => (
        <div key={section.id} className="border-b border-border last:border-0">
          <button
            onClick={() => setOpenSection(openSection === section.id ? '' : section.id)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center">
                <Check className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground">{section.title}</p>
                <p className="font-medium">{section.value}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-orange-500">{section.price}</span>
              {openSection === section.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>

          {openSection === section.id && (
            <div className="px-4 pb-4 bg-white/5">
              {section.id === 'model' && (
                <div className="space-y-2">
                  {mockProducts.models.map(m => (
                    <button key={m.id} onClick={() => setSelected({...selected, model: m.id})}
                      className={`w-full p-3 rounded-lg border-2 text-left ${selected.model === m.id ? 'border-orange-500 bg-orange-500/10' : 'border-border'}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{m.name}</span>
                          {m.recommended && <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded">Recommended</span>}
                        </div>
                        <span className="font-bold">${m.price}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {section.id === 'ext' && (
                <div className="grid grid-cols-2 gap-2">
                  {mockProducts.extensions.map(e => (
                    <button key={e.id} onClick={() => setSelected({...selected, ext: e.id})}
                      className={`p-3 rounded-lg border-2 text-left text-sm ${selected.ext === e.id ? 'border-orange-500 bg-orange-500/10' : 'border-border'}`}>
                      <p className="font-medium">{e.name}</p>
                      <p className="font-bold">${e.price}</p>
                    </button>
                  ))}
                </div>
              )}
              {section.id === 'delivery' && (
                <div className="space-y-2">
                  {mockProducts.delivery.map(d => (
                    <button key={d.id} onClick={() => setSelected({...selected, delivery: d.id})}
                      className={`w-full p-3 rounded-lg border-2 text-left ${selected.delivery === d.id ? 'border-orange-500 bg-orange-500/10' : 'border-border'}`}>
                      <div className="flex justify-between">
                        <span>{d.name}</span>
                        <span className="font-bold">${d.price}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {section.id === 'service' && (
                <div className="space-y-2">
                  {mockProducts.services.map(s => (
                    <button key={s.id} onClick={() => setSelected({...selected, service: s.id})}
                      className={`w-full p-3 rounded-lg border-2 text-left ${selected.service === s.id ? 'border-orange-500 bg-orange-500/10' : 'border-border'}`}>
                      <div className="flex justify-between">
                        <span>{s.name}</span>
                        <span className="font-bold">${s.price}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// OPTION B: Horizontal Swipe Cards
function Step4OptionB() {
  const [activeTab, setActiveTab] = useState(0)
  const tabs = ['Model', 'Extension', 'Delivery', 'Service']
  const [selected, setSelected] = useState({ model: 'AUN250', ext: 'ext1', delivery: 'pickup', service: 'none' })

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <p className="text-sm text-muted-foreground p-4 border-b">Option B: Horizontal tabs with swipe</p>

      {/* Tab bar */}
      <div className="flex border-b border-border overflow-x-auto">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`flex-1 min-w-[80px] px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
              ${activeTab === i ? 'border-orange-500 text-orange-500 bg-orange-500/5' : 'border-transparent text-muted-foreground'}`}
          >
            {tab}
            <span className="ml-1 text-xs">✓</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 0 && (
          <div className="space-y-3">
            {mockProducts.models.map(m => (
              <button key={m.id} onClick={() => setSelected({...selected, model: m.id})}
                className={`w-full p-4 rounded-xl border-2 text-left ${selected.model === m.id ? 'border-orange-500 bg-orange-500/10' : 'border-border'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{m.name}</p>
                    {m.recommended && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded mt-1 inline-block">Recommended</span>}
                  </div>
                  <span className="font-bold text-lg">${m.price}</span>
                </div>
              </button>
            ))}
          </div>
        )}
        {activeTab === 1 && (
          <div className="grid grid-cols-2 gap-3">
            {mockProducts.extensions.map(e => (
              <button key={e.id} onClick={() => setSelected({...selected, ext: e.id})}
                className={`p-3 rounded-xl border-2 text-left ${selected.ext === e.id ? 'border-orange-500 bg-orange-500/10' : 'border-border'}`}>
                <p className="font-medium text-sm">{e.name}</p>
                <p className="font-bold mt-1">${e.price}</p>
              </button>
            ))}
          </div>
        )}
        {activeTab === 2 && (
          <div className="space-y-3">
            {mockProducts.delivery.map(d => (
              <button key={d.id} onClick={() => setSelected({...selected, delivery: d.id})}
                className={`w-full p-4 rounded-xl border-2 text-left ${selected.delivery === d.id ? 'border-orange-500 bg-orange-500/10' : 'border-border'}`}>
                <div className="flex justify-between">
                  <span className="font-medium">{d.name}</span>
                  <span className="font-bold">${d.price}</span>
                </div>
              </button>
            ))}
          </div>
        )}
        {activeTab === 3 && (
          <div className="space-y-3">
            {mockProducts.services.map(s => (
              <button key={s.id} onClick={() => setSelected({...selected, service: s.id})}
                className={`w-full p-4 rounded-xl border-2 text-left ${selected.service === s.id ? 'border-orange-500 bg-orange-500/10' : 'border-border'}`}>
                <div className="flex justify-between">
                  <span className="font-medium">{s.name}</span>
                  <span className="font-bold">${s.price}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-4 pb-4 flex justify-between">
        <Button variant="outline" size="sm" onClick={() => setActiveTab(Math.max(0, activeTab - 1))} disabled={activeTab === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Prev
        </Button>
        <Button size="sm" onClick={() => setActiveTab(Math.min(3, activeTab + 1))} disabled={activeTab === 3}
          className="bg-orange-500 hover:bg-orange-600">
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// OPTION C: Compact Cards with Running Total
function Step4OptionC() {
  const [selected, setSelected] = useState({ model: 'AUN250', ext: 'ext1', delivery: 'pickup', service: 'none' })
  const total = 1299 + 149 // simplified

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <p className="text-sm text-muted-foreground p-4 border-b">Option C: Compact with sticky total</p>

      {/* Sticky running total */}
      <div className="sticky top-0 bg-primary text-white px-4 py-2 flex justify-between items-center z-10">
        <span className="font-medium">Running Total</span>
        <span className="text-xl font-bold">${total.toLocaleString()}</span>
      </div>

      <div className="p-4 space-y-4 max-h-[350px] overflow-y-auto">
        {/* Model - Compact dropdown style */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Ramp Model</label>
          <div className="mt-1 flex gap-2">
            {mockProducts.models.map(m => (
              <button key={m.id} onClick={() => setSelected({...selected, model: m.id})}
                className={`flex-1 p-3 rounded-lg border-2 text-center ${selected.model === m.id ? 'border-orange-500 bg-orange-500/10' : 'border-border'}`}>
                <p className="font-bold text-sm">{m.id}</p>
                <p className="text-xs text-muted-foreground">${m.price}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Extension - Horizontal scroll */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Extension</label>
          <div className="mt-1 flex gap-2 overflow-x-auto pb-2">
            {mockProducts.extensions.map(e => (
              <button key={e.id} onClick={() => setSelected({...selected, ext: e.id})}
                className={`flex-shrink-0 px-4 py-2 rounded-full border-2 text-sm whitespace-nowrap ${selected.ext === e.id ? 'border-orange-500 bg-orange-500/10' : 'border-border'}`}>
                {e.name} <span className="font-bold ml-1">${e.price}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Delivery - Radio style */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Delivery</label>
          <div className="mt-1 space-y-1">
            {mockProducts.delivery.map(d => (
              <button key={d.id} onClick={() => setSelected({...selected, delivery: d.id})}
                className={`w-full p-2 rounded-lg flex items-center gap-3 ${selected.delivery === d.id ? 'bg-orange-500/10' : ''}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected.delivery === d.id ? 'border-orange-500' : 'border-muted'}`}>
                  {selected.delivery === d.id && <div className="w-3 h-3 rounded-full bg-orange-500" />}
                </div>
                <span className="flex-1 text-left text-sm">{d.name}</span>
                <span className="font-bold text-sm">${d.price}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Service - Radio style */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Service</label>
          <div className="mt-1 space-y-1">
            {mockProducts.services.map(s => (
              <button key={s.id} onClick={() => setSelected({...selected, service: s.id})}
                className={`w-full p-2 rounded-lg flex items-center gap-3 ${selected.service === s.id ? 'bg-orange-500/10' : ''}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected.service === s.id ? 'border-orange-500' : 'border-muted'}`}>
                  {selected.service === s.id && <div className="w-3 h-3 rounded-full bg-orange-500" />}
                </div>
                <span className="flex-1 text-left text-sm">{s.name}</span>
                <span className="font-bold text-sm">${s.price}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ==============================================
// STEP 5 QUOTE SUMMARY ALTERNATIVES
// ==============================================

// CURRENT: Sidebar layout (doesn't work on mobile)
function Step5Current() {
  return (
    <div className="bg-card rounded-xl border p-4">
      <p className="text-sm text-muted-foreground mb-4">Current: Two-column layout collapses to stacked on mobile</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Details - takes 2/3 on desktop */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Customer Information</h3>
            <p className="text-sm text-muted-foreground">John Doe • john@example.com</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Selected Configuration</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>AUN250 Folding Ramp</span><span>$1,299</span></div>
              <div className="flex justify-between"><span>Extension 1 (12")</span><span>$149</span></div>
              <div className="flex justify-between"><span>Local Pickup</span><span>$0</span></div>
            </div>
          </div>
        </div>

        {/* Summary - 1/3 on desktop, full width on mobile */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h3 className="font-semibold mb-4">Quote Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>$1,448</span></div>
            <div className="flex justify-between"><span>Tax</span><span>$129</span></div>
            <div className="h-px bg-border my-2" />
            <div className="flex justify-between font-bold text-lg"><span>Total</span><span>$1,577</span></div>
          </div>
          <div className="mt-4 space-y-2">
            <Button className="w-full bg-orange-500 hover:bg-orange-600">Add to Cart</Button>
            <Button variant="outline" className="w-full">Call 800-687-4410</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// OPTION A: Fixed Bottom Bar
function Step5OptionA() {
  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <p className="text-sm text-muted-foreground p-4 border-b">Option A: Fixed bottom bar with total + CTA</p>

      {/* Scrollable content */}
      <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto">
        <div className="bg-muted/30 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Customer Information</h3>
          <p className="text-sm text-muted-foreground">John Doe • john@example.com</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Your Configuration</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-border/50"><span>AUN250 Folding Ramp</span><span className="font-medium">$1,299</span></div>
            <div className="flex justify-between py-1 border-b border-border/50"><span>Extension 1 (12")</span><span className="font-medium">$149</span></div>
            <div className="flex justify-between py-1"><span>Local Pickup</span><span className="font-medium">$0</span></div>
          </div>
        </div>
        <div className="bg-muted/30 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Price Breakdown</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>$1,448.00</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Sales Tax (8.9%)</span><span>$128.87</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Processing (3%)</span><span>$43.44</span></div>
          </div>
        </div>
      </div>

      {/* Fixed bottom bar */}
      <div className="sticky bottom-0 bg-background border-t border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">$1,620.31</p>
          </div>
          <Button size="lg" className="bg-orange-500 hover:bg-orange-600 px-8">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Add to Cart
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1"><Phone className="w-4 h-4 mr-1" /> Call</Button>
          <Button variant="outline" size="sm" className="flex-1"><Mail className="w-4 h-4 mr-1" /> Email</Button>
          <Button variant="outline" size="sm" className="flex-1"><Share2 className="w-4 h-4 mr-1" /> Share</Button>
        </div>
      </div>
    </div>
  )
}

// OPTION B: Pull-up Drawer Style
function Step5OptionB() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="bg-card rounded-xl border overflow-hidden relative">
      <p className="text-sm text-muted-foreground p-4 border-b">Option B: Pull-up drawer for summary</p>

      {/* Main content */}
      <div className="p-4 space-y-4 pb-20">
        <div className="bg-muted/30 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Customer Information</h3>
          <p className="text-sm text-muted-foreground">John Doe • john@example.com</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Your Configuration</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>AUN250 Folding Ramp</span><span>$1,299</span></div>
            <div className="flex justify-between"><span>Extension 1</span><span>$149</span></div>
          </div>
        </div>
      </div>

      {/* Drawer */}
      <div className={`absolute bottom-0 left-0 right-0 bg-background border-t border-border rounded-t-2xl transition-all duration-300 ${drawerOpen ? 'h-64' : 'h-20'}`}>
        {/* Handle */}
        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className="w-full py-2 flex flex-col items-center"
        >
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mb-2" />
          <div className="flex items-center justify-between w-full px-4">
            <span className="font-bold text-xl">$1,620.31</span>
            <span className="text-sm text-muted-foreground flex items-center">
              {drawerOpen ? 'Hide' : 'View'} details
              {drawerOpen ? <ChevronDown className="w-4 h-4 ml-1" /> : <ChevronUp className="w-4 h-4 ml-1" />}
            </span>
          </div>
        </button>

        {drawerOpen && (
          <div className="px-4 pb-4 space-y-3">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>$1,448.00</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>$128.87</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Processing</span><span>$43.44</span></div>
            </div>
            <Button className="w-full bg-orange-500 hover:bg-orange-600">
              <ShoppingCart className="w-5 h-5 mr-2" /> Add to Cart
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">Call</Button>
              <Button variant="outline" size="sm" className="flex-1">Email</Button>
              <Button variant="outline" size="sm" className="flex-1">Share</Button>
            </div>
          </div>
        )}

        {!drawerOpen && (
          <div className="px-4">
            <Button className="w-full bg-orange-500 hover:bg-orange-600">
              <ShoppingCart className="w-5 h-5 mr-2" /> Add to Cart
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// OPTION C: Card Stack Summary
function Step5OptionC() {
  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <p className="text-sm text-muted-foreground p-4 border-b">Option C: Visual card summary with prominent CTA</p>

      <div className="p-4 space-y-4">
        {/* Big total card */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-6 text-white text-center">
          <p className="text-sm opacity-80">Your Quote Total</p>
          <p className="text-4xl font-bold my-2">$1,620.31</p>
          <p className="text-xs opacity-60">Includes tax & processing</p>
        </div>

        {/* Configuration summary - compact */}
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Configuration Summary</h3>
            <button className="text-sm text-primary">Edit</button>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-background rounded-full text-sm">AUN250</span>
            <span className="px-3 py-1 bg-background rounded-full text-sm">Ext 1</span>
            <span className="px-3 py-1 bg-background rounded-full text-sm">Pickup</span>
          </div>
        </div>

        {/* Customer info - compact */}
        <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Customer</p>
            <p className="font-medium">John Doe</p>
          </div>
          <button className="text-sm text-primary">Edit</button>
        </div>

        {/* Primary CTA */}
        <Button size="lg" className="w-full bg-orange-500 hover:bg-orange-600 h-14 text-lg">
          <ShoppingCart className="w-6 h-6 mr-2" />
          Add to Cart
        </Button>

        {/* Secondary actions */}
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" className="flex-col h-auto py-3">
            <Phone className="w-5 h-5 mb-1" />
            <span className="text-xs">Call</span>
          </Button>
          <Button variant="outline" className="flex-col h-auto py-3">
            <Mail className="w-5 h-5 mb-1" />
            <span className="text-xs">Email</span>
          </Button>
          <Button variant="outline" className="flex-col h-auto py-3">
            <Printer className="w-5 h-5 mb-1" />
            <span className="text-xs">Print</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

// ==============================================
// MAIN PAGE
// ==============================================

export default function DesignPreviewPage() {
  const [activeSection, setActiveSection] = useState<'progress' | 'step4' | 'step5'>('progress')
  const [mobileView, setMobileView] = useState(true)

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">UX/UI Design Alternatives</h1>
          <p className="text-muted-foreground">Compare different design options for the configurator</p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setActiveSection('progress')}
              className={`px-4 py-2 text-sm font-medium ${activeSection === 'progress' ? 'bg-primary text-white' : 'hover:bg-muted'}`}
            >
              Progress Bar
            </button>
            <button
              onClick={() => setActiveSection('step4')}
              className={`px-4 py-2 text-sm font-medium ${activeSection === 'step4' ? 'bg-primary text-white' : 'hover:bg-muted'}`}
            >
              Step 4 Layout
            </button>
            <button
              onClick={() => setActiveSection('step5')}
              className={`px-4 py-2 text-sm font-medium ${activeSection === 'step5' ? 'bg-primary text-white' : 'hover:bg-muted'}`}
            >
              Quote Summary
            </button>
          </div>

          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setMobileView(true)}
              className={`px-4 py-2 text-sm font-medium ${mobileView ? 'bg-orange-500 text-white' : 'hover:bg-muted'}`}
            >
              📱 Mobile (375px)
            </button>
            <button
              onClick={() => setMobileView(false)}
              className={`px-4 py-2 text-sm font-medium ${!mobileView ? 'bg-orange-500 text-white' : 'hover:bg-muted'}`}
            >
              🖥️ Desktop
            </button>
          </div>
        </div>

        {/* Preview container */}
        <div className={`mx-auto ${mobileView ? 'max-w-[375px]' : 'max-w-[800px]'} transition-all duration-300`}>
          <div className="bg-muted/20 rounded-2xl p-4 border-4 border-muted">
            {/* Progress Bar Section */}
            {activeSection === 'progress' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center">Current Design</h2>
                  <ProgressBarCurrent />
                </div>

                <div className="h-px bg-border" />

                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center text-green-500">Option A: Compact Pill</h2>
                  <ProgressBarOptionA />
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center text-blue-500">Option B: Collapsible Vertical</h2>
                  <ProgressBarOptionB />
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center text-purple-500">Option C: Tab Bar Style</h2>
                  <ProgressBarOptionC />
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center text-orange-500">Option D: Minimal Dots</h2>
                  <ProgressBarOptionD />
                </div>
              </div>
            )}

            {/* Step 4 Section */}
            {activeSection === 'step4' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center">Current Design</h2>
                  <Step4Current />
                </div>

                <div className="h-px bg-border" />

                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center text-green-500">Option A: Accordion</h2>
                  <Step4OptionA />
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center text-blue-500">Option B: Horizontal Tabs</h2>
                  <Step4OptionB />
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center text-purple-500">Option C: Compact with Sticky Total</h2>
                  <Step4OptionC />
                </div>
              </div>
            )}

            {/* Step 5 Section */}
            {activeSection === 'step5' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center">Current Design</h2>
                  <Step5Current />
                </div>

                <div className="h-px bg-border" />

                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center text-green-500">Option A: Fixed Bottom Bar</h2>
                  <Step5OptionA />
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center text-blue-500">Option B: Pull-up Drawer</h2>
                  <Step5OptionB />
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center text-purple-500">Option C: Card Stack</h2>
                  <Step5OptionC />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-center">Design Recommendations</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-card rounded-xl p-4 border">
              <h3 className="font-semibold text-green-500 mb-2">Progress Bar</h3>
              <p className="text-sm text-muted-foreground">
                <strong>Recommended: Option B</strong> (Collapsible) - Shows current step clearly, expands for full navigation, minimal mobile footprint.
              </p>
            </div>
            <div className="bg-card rounded-xl p-4 border">
              <h3 className="font-semibold text-blue-500 mb-2">Step 4 Layout</h3>
              <p className="text-sm text-muted-foreground">
                <strong>Recommended: Option A</strong> (Accordion) - Reduces cognitive load, shows selections at a glance, one section at a time.
              </p>
            </div>
            <div className="bg-card rounded-xl p-4 border">
              <h3 className="font-semibold text-purple-500 mb-2">Quote Summary</h3>
              <p className="text-sm text-muted-foreground">
                <strong>Recommended: Option A</strong> (Fixed Bottom) - CTA always visible, total prominent, industry standard pattern.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
