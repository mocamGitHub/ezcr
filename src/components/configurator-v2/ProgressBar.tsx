'use client'

import React, { useState } from 'react'
import { useConfigurator } from './ConfiguratorProvider'
import { Check, ChevronDown } from 'lucide-react'

const STEPS = [
  { number: 1, label: 'Vehicle' },
  { number: 2, label: 'Measurements' },
  { number: 3, label: 'Motorcycle' },
  { number: 4, label: 'Configuration' },
  { number: 5, label: 'Quote' },
]

export function ProgressBar() {
  const { currentStep, completedSteps, goToStep } = useConfigurator()
  const [isExpanded, setIsExpanded] = useState(false)

  const getStepState = (stepNumber: number) => {
    if (stepNumber === currentStep) return 'current'
    if (completedSteps.includes(stepNumber)) return 'completed'
    return 'disabled'
  }

  const canClickStep = (stepNumber: number) => {
    // Can click current step, completed steps, or next available step (if previous is completed)
    if (stepNumber === currentStep) return true
    if (completedSteps.includes(stepNumber)) return true
    // Allow clicking next step if all previous steps are completed
    if (stepNumber > 1 && completedSteps.includes(stepNumber - 1)) return true
    return false
  }

  // Calculate progress bar fill percentage
  const progressPercentage = ((currentStep - 1) / (STEPS.length - 1)) * 100
  const currentStepData = STEPS.find(s => s.number === currentStep)

  return (
    <>
      {/* Desktop Progress Bar - Hidden on mobile */}
      <div className="hidden md:block w-full bg-secondary/10 rounded-[20px] px-6 py-6 mb-8">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-border mx-5">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Steps */}
          <div className="relative flex justify-between">
            {STEPS.map((step) => {
              const state = getStepState(step.number)
              const clickable = canClickStep(step.number)

              return (
                <div
                  key={step.number}
                  className="flex flex-col items-center"
                >
                  {/* Circle */}
                  <button
                    onClick={() => clickable && goToStep(step.number)}
                    disabled={!clickable}
                    className={`
                      relative flex items-center justify-center w-10 h-10 rounded-full
                      font-semibold text-sm transition-all duration-300
                      ${state === 'current' ? 'scale-125 shadow-lg shadow-primary/50 animate-pulse' : ''}
                      ${state === 'current' ? 'bg-primary text-white' : ''}
                      ${state === 'completed' ? 'bg-green-500 text-white hover:scale-110' : ''}
                      ${state === 'disabled' ? 'bg-muted text-muted-foreground opacity-60' : ''}
                      ${clickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                    `}
                  >
                    {state === 'completed' ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </button>

                  {/* Label */}
                  <span
                    className={`
                      mt-2 text-sm font-medium transition-all duration-300
                      ${state === 'current' ? 'text-primary font-bold underline' : ''}
                      ${state === 'completed' ? 'text-foreground font-medium' : ''}
                      ${state === 'disabled' ? 'text-muted-foreground' : ''}
                    `}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Progress Bar - Hidden on desktop */}
      <div className="md:hidden w-full bg-secondary/10 rounded-[20px] mb-6">
        {/* Collapsed Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-semibold text-sm">
              {currentStep}
            </div>
            <div className="text-left">
              <div className="text-xs text-muted-foreground">Step {currentStep} of {STEPS.length}</div>
              <div className="font-semibold text-foreground">{currentStepData?.label}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Mini progress bar */}
            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <ChevronDown
              className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>
        </button>

        {/* Expanded Steps */}
        <div
          className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-80' : 'max-h-0'}`}
        >
          <div className="px-4 pb-4 space-y-2">
            {STEPS.map((step) => {
              const state = getStepState(step.number)
              const clickable = canClickStep(step.number)

              return (
                <button
                  key={step.number}
                  onClick={() => {
                    if (clickable) {
                      goToStep(step.number)
                      setIsExpanded(false)
                    }
                  }}
                  disabled={!clickable}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-lg transition-all
                    ${state === 'current' ? 'bg-primary/20 border border-primary' : ''}
                    ${state === 'completed' ? 'bg-green-500/10 hover:bg-green-500/20' : ''}
                    ${state === 'disabled' ? 'opacity-50' : ''}
                    ${clickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                  `}
                >
                  <div
                    className={`
                      flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold
                      ${state === 'current' ? 'bg-primary text-white' : ''}
                      ${state === 'completed' ? 'bg-green-500 text-white' : ''}
                      ${state === 'disabled' ? 'bg-muted text-muted-foreground' : ''}
                    `}
                  >
                    {state === 'completed' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={`
                      text-sm font-medium
                      ${state === 'current' ? 'text-primary font-bold' : ''}
                      ${state === 'completed' ? 'text-foreground' : ''}
                      ${state === 'disabled' ? 'text-muted-foreground' : ''}
                    `}
                  >
                    {step.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
