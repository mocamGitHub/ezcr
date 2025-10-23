'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ConfiguratorProvider, useConfigurator } from './ConfiguratorProvider'
import { ConfiguratorSettingsProvider } from './ConfiguratorSettingsProvider'
import { ConfiguratorHeader } from './ConfiguratorHeader'
import { ProgressBar } from './ProgressBar'
import { Step1VehicleType } from './Step1VehicleType'
import { Step2Measurements } from './Step2Measurements'
import { Step3Motorcycle } from './Step3Motorcycle'
import { Step4Configuration } from './Step4Configuration'
import { Step5Quote } from './Step5Quote'
import { ContactModal } from './ContactModal'
import { ChatWidget } from './ChatWidget'

function ConfiguratorContent() {
  const { currentStep } = useConfigurator()

  // Animation variants for step transitions
  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -50 : 50,
      opacity: 0,
    }),
  }

  // Track previous step to determine direction
  const [direction, setDirection] = React.useState(0)
  const prevStepRef = React.useRef(currentStep)

  React.useEffect(() => {
    setDirection(currentStep > prevStepRef.current ? 1 : -1)
    prevStepRef.current = currentStep
  }, [currentStep])

  return (
    <div className="min-h-screen bg-background">
      <ConfiguratorHeader />

      <main className="container mx-auto max-w-[1200px] px-4 py-8">
        <ProgressBar />

        <div className="bg-card rounded-xl p-6 md:p-12 border border-border overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
            >
              {currentStep === 1 && <Step1VehicleType />}
              {currentStep === 2 && <Step2Measurements />}
              {currentStep === 3 && <Step3Motorcycle />}
              {currentStep === 4 && <Step4Configuration />}
              {currentStep === 5 && <Step5Quote />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <ContactModal />
      <ChatWidget />
    </div>
  )
}

export default function Configurator() {
  return (
    <ConfiguratorSettingsProvider>
      <ConfiguratorProvider>
        <ConfiguratorContent />
      </ConfiguratorProvider>
    </ConfiguratorSettingsProvider>
  )
}
