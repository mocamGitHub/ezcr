'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
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
  const { currentStep, loadConfiguration } = useConfigurator()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading configuration...</p>
        </div>
      </div>
    )
  }

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
