'use client'

import React from 'react'
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

  return (
    <div className="min-h-screen bg-background">
      <ConfiguratorHeader />

      <main className="container mx-auto max-w-[1200px] px-4 py-8">
        <ProgressBar />

        <div className="bg-card rounded-xl p-6 md:p-12 border border-border">
          {currentStep === 1 && <Step1VehicleType />}
          {currentStep === 2 && <Step2Measurements />}
          {currentStep === 3 && <Step3Motorcycle />}
          {currentStep === 4 && <Step4Configuration />}
          {currentStep === 5 && <Step5Quote />}
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
