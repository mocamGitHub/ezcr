'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { ConfiguratorProvider, useConfigurator } from './ConfiguratorProvider'
import { ConfiguratorWrapper } from './ConfiguratorWrapper'
import { ConfiguratorHeader } from './ConfiguratorHeader'
import { Step1VehicleType } from './Step1VehicleType'
import { Step2Measurements } from './Step2Measurements'
import { Step3Motorcycle } from './Step3Motorcycle'
import { Step4Configuration } from './Step4Configuration'
import { Step5Quote } from './Step5Quote'
import { ContactModal } from './ContactModal'
import { ChatWidget } from './ChatWidget'
import { Check } from 'lucide-react'
import { trackEvent } from '@/components/analytics/GoogleAnalytics'
import { trackMetaEvent, trackMetaCustomEvent } from '@/components/analytics/MetaPixel'

const STEPS = [
  { number: 1, label: 'Vehicle' },
  { number: 2, label: 'Measurements' },
  { number: 3, label: 'Motorcycle' },
  { number: 4, label: 'Configuration' },
  { number: 5, label: 'Quote' },
]

// Compact inline progress indicator
function CompactProgress() {
  const { currentStep, completedSteps, goToStep } = useConfigurator()

  const canClickStep = (stepNumber: number) => {
    if (stepNumber === currentStep) return true
    if (completedSteps.includes(stepNumber)) return true
    if (stepNumber > 1 && completedSteps.includes(stepNumber - 1)) return true
    return false
  }

  const getStepState = (stepNumber: number) => {
    if (stepNumber === currentStep) return 'current'
    if (completedSteps.includes(stepNumber)) return 'completed'
    return 'disabled'
  }

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS.map((step, index) => {
        const state = getStepState(step.number)
        const clickable = canClickStep(step.number)

        return (
          <React.Fragment key={step.number}>
            <button
              onClick={() => clickable && goToStep(step.number)}
              disabled={!clickable}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                transition-all duration-300
                ${state === 'current'
                  ? 'bg-[#0B5394] text-white shadow-md scale-105'
                  : state === 'completed'
                    ? 'bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/30'
                    : 'bg-muted text-muted-foreground'
                }
                ${clickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}
              `}
            >
              {state === 'completed' ? (
                <Check className="w-3 h-3" />
              ) : (
                <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white/20 text-[10px]">
                  {step.number}
                </span>
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </button>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div
                className={`w-4 h-0.5 transition-colors duration-300 ${
                  completedSteps.includes(step.number) ? 'bg-green-500' : 'bg-muted'
                }`}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// Smooth step transition wrapper
function StepTransition({
  children,
  isActive,
  direction
}: {
  children: React.ReactNode
  isActive: boolean
  direction: 'forward' | 'backward'
}) {
  const [shouldRender, setShouldRender] = useState(isActive)
  const [animationState, setAnimationState] = useState<'entering' | 'active' | 'exiting' | 'hidden'>(
    isActive ? 'active' : 'hidden'
  )

  useEffect(() => {
    if (isActive) {
      setShouldRender(true)
      requestAnimationFrame(() => {
        setAnimationState('entering')
        setTimeout(() => setAnimationState('active'), 350)
      })
    } else if (animationState === 'active' || animationState === 'entering') {
      setAnimationState('exiting')
      setTimeout(() => {
        setShouldRender(false)
        setAnimationState('hidden')
      }, 250)
    }
  }, [isActive])

  if (!shouldRender) return null

  const getTransformStyle = () => {
    switch (animationState) {
      case 'entering':
        return {
          opacity: 0,
          transform: direction === 'forward' ? 'translateX(40px)' : 'translateX(-40px)',
        }
      case 'active':
        return {
          opacity: 1,
          transform: 'translateX(0)',
        }
      case 'exiting':
        return {
          opacity: 0,
          transform: direction === 'forward' ? 'translateX(-20px)' : 'translateX(20px)',
        }
      default:
        return {
          opacity: 0,
          transform: 'translateX(0)',
        }
    }
  }

  return (
    <div
      style={{
        ...getTransformStyle(),
        transition: 'opacity 0.35s ease-out, transform 0.35s ease-out',
        position: animationState === 'exiting' ? 'absolute' : 'relative',
        width: '100%',
        top: 0,
        left: 0,
      }}
    >
      {children}
    </div>
  )
}

function ConfiguratorContent() {
  const { currentStep, loadConfiguration } = useConfigurator()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [prevStep, setPrevStep] = useState(currentStep)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const hasTrackedStart = useRef(false)
  const hasTrackedQuote = useRef(false)

  // Track configurator start
  useEffect(() => {
    if (!hasTrackedStart.current) {
      hasTrackedStart.current = true
      trackEvent('begin_configurator', {
        configurator_type: 'full',
      })
      trackMetaCustomEvent('ConfiguratorStart', {
        configurator_type: 'full',
      })
    }
  }, [])

  // Track step direction and scroll to top on step change (especially for mobile)
  useEffect(() => {
    if (currentStep !== prevStep) {
      setDirection(currentStep > prevStep ? 'forward' : 'backward')
      setPrevStep(currentStep)

      // Track step progression
      const stepNames = ['', 'vehicle', 'measurements', 'motorcycle', 'configuration', 'quote']
      trackEvent('configurator_step', {
        step_number: currentStep,
        step_name: stepNames[currentStep] || 'unknown',
        configurator_type: 'full',
      })

      // Track quote completion (Step 5)
      if (currentStep === 5 && !hasTrackedQuote.current) {
        hasTrackedQuote.current = true
        trackEvent('configurator_complete', {
          configurator_type: 'full',
        })
        trackMetaEvent('Lead', {
          content_name: 'Full Configurator Quote',
        })
        trackMetaCustomEvent('ConfiguratorComplete', {
          configurator_type: 'full',
        })
      }

      // Auto-scroll to top on all step changes for mobile, and always on Step 5
      // Check if on mobile (screen width < 768px) or if entering Step 5
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
      if (isMobile || currentStep === 5) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }, [currentStep, prevStep])

  useEffect(() => {
    const loadId = searchParams?.get('load')
    if (loadId) {
      setIsLoading(true)
      loadConfiguration(loadId)
        .then((success) => {
          if (!success) {
            alert('Failed to load configuration')
          }
        })
        .finally(() => setIsLoading(false))
    }
  }, [searchParams, loadConfiguration])

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ConfiguratorHeader />

      <main className="flex-1 container mx-auto max-w-[1200px] px-4 py-4">
        <div className="bg-card rounded-xl border border-border">
          {/* Compact progress inside card */}
          <div className="px-6 pt-6 pb-2 border-b border-border/50">
            <CompactProgress />
          </div>

          {/* Step content */}
          <div className="p-6 md:p-8">
            <div className="relative">
              <StepTransition isActive={currentStep === 1} direction={direction}>
                <Step1VehicleType />
              </StepTransition>

              <StepTransition isActive={currentStep === 2} direction={direction}>
                <Step2Measurements />
              </StepTransition>

              <StepTransition isActive={currentStep === 3} direction={direction}>
                <Step3Motorcycle />
              </StepTransition>

              <StepTransition isActive={currentStep === 4} direction={direction}>
                <Step4Configuration />
              </StepTransition>

              <StepTransition isActive={currentStep === 5} direction={direction}>
                <Step5Quote />
              </StepTransition>
            </div>
          </div>
        </div>
      </main>

      <ContactModal />
      <ChatWidget />
    </div>
  )
}

export default function ConfiguratorSmooth() {
  return (
    <ConfiguratorWrapper>
      <ConfiguratorProvider>
        <ConfiguratorContent />
      </ConfiguratorProvider>
    </ConfiguratorWrapper>
  )
}
