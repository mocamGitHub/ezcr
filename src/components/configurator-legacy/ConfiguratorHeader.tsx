'use client'

import React, { useState } from 'react'
import { useConfigurator } from './ConfiguratorProvider'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Save, Check } from 'lucide-react'

export function ConfiguratorHeader() {
  const { units, toggleUnits, saveConfiguration, savedConfigId } = useConfigurator()
  const { showToast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    const result = await saveConfiguration(false) // false = incomplete/save for later
    setIsSaving(false)

    if (result.success) {
      setShowSaved(true)
      setTimeout(() => setShowSaved(false), 3000)
      showToast('Your configuration has been saved', 'success', 'Configuration Saved!')
    } else {
      showToast(result.message || 'Unable to save configuration', 'error', 'Save Failed')
    }
  }

  return (
    <header className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-[1400px] px-4">
        <nav className="flex h-16 items-center justify-between gap-4 flex-wrap">
          {/* Title */}
          <div className="flex items-center gap-2 shrink-0">
            <h1 className="text-3xl font-bold">
              Ramp{' '}
              <span className="text-[#F78309]">Configurator</span>
            </h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Unit Toggle */}
            <div className="flex items-center gap-1 rounded-full bg-gray-100 dark:bg-muted p-1">
              <button
                onClick={() => units === 'metric' && toggleUnits()}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  units === 'imperial'
                    ? 'bg-[#0B5394] text-white'
                    : 'text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-foreground'
                }`}
              >
                Imperial
              </button>
              <button
                onClick={() => units === 'imperial' && toggleUnits()}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  units === 'metric'
                    ? 'bg-[#0B5394] text-white'
                    : 'text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-foreground'
                }`}
              >
                Metric
              </button>
            </div>

            {/* Save for Later Button */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              variant="outline"
              className="rounded-full gap-2"
            >
              {showSaved ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save for Later'}
                </>
              )}
            </Button>

          </div>
        </nav>
      </div>
    </header>
  )
}
