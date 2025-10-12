'use client'

import React from 'react'
import { useConfigurator } from './ConfiguratorProvider'
import { Check } from 'lucide-react'

const STEPS = [
  { number: 1, label: 'Vehicle' },
  { number: 2, label: 'Measurements' },
  { number: 3, label: 'Motorcycle' },
  { number: 4, label: 'Configuration' },
  { number: 5, label: 'Quote' },
]

export function ProgressBar() {
  const { currentStep, completedSteps, goToStep } = useConfigurator()

  const getStepState = (stepNumber: number) => {
    if (stepNumber === currentStep) return 'current'
    if (completedSteps.includes(stepNumber)) return 'completed'
    return 'disabled'
  }

  const canClickStep = (stepNumber: number) => {
    // Can click current step or completed steps
    return stepNumber === currentStep || completedSteps.includes(stepNumber)
  }

  // Calculate progress bar fill percentage
  const progressPercentage = ((currentStep - 1) / (STEPS.length - 1)) * 100

  return (
    <div className="w-full bg-secondary/10 rounded-[20px] px-6 py-6 mb-8">
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
                    ${state === 'completed' ? 'bg-success text-white hover:scale-110' : ''}
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
  )
}
