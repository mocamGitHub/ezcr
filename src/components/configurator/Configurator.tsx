'use client'

import React from 'react'
import { useConfigurator } from '@/contexts/ConfiguratorContext'
import Step1VehicleContact from './Step1VehicleContact'
import Step2Measurements from './Step2Measurements'
import Step3Motorcycle from './Step3Motorcycle'
import Step4Configuration from './Step4Configuration'
import Step5Quote from './Step5Quote'

const STEPS = [
  { number: 1, title: 'Vehicle & Contact', component: Step1VehicleContact },
  { number: 2, title: 'Measurements', component: Step2Measurements },
  { number: 3, title: 'Motorcycle', component: Step3Motorcycle },
  { number: 4, title: 'Configuration', component: Step4Configuration },
  { number: 5, title: 'Quote', component: Step5Quote },
]

export default function Configurator() {
  const { data } = useConfigurator()
  const currentStep = data.currentStep

  const CurrentStepComponent = STEPS[currentStep - 1]?.component

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Progress Indicator */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-colors ${
                      currentStep === step.number
                        ? 'bg-orange-500 text-white'
                        : currentStep > step.number
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step.number ? '✓' : step.number}
                  </div>
                  <div
                    className={`text-xs mt-2 text-center hidden sm:block ${
                      currentStep === step.number
                        ? 'font-bold text-orange-500'
                        : 'text-gray-600'
                    }`}
                  >
                    {step.title}
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-colors ${
                      currentStep > step.number
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {CurrentStepComponent ? (
            <CurrentStepComponent />
          ) : (
            <div className="text-center text-gray-600">Invalid step</div>
          )}
        </div>
      </div>
    </div>
  )
}
