'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useConfigurator } from './ConfiguratorProvider'
import { Button } from '@/components/ui/button'
import { CONTACT } from '@/types/configurator-v2'
import { X, Save, Check } from 'lucide-react'

export function ConfiguratorHeader() {
  const { units, toggleUnits, saveConfiguration, savedConfigId } = useConfigurator()
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    const result = await saveConfiguration(false) // false = incomplete/save for later
    setIsSaving(false)

    if (result.success) {
      setShowSaved(true)
      setTimeout(() => setShowSaved(false), 3000)
    } else {
      alert(result.message)
    }
  }

  return (
    <header className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-[1400px] px-4">
        <nav className="flex h-16 items-center justify-between gap-4 flex-wrap">
          {/* Title */}
          <div className="flex items-center gap-2 shrink-0">
            <h1 className="text-xl font-semibold text-foreground">Ramp Configurator</h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Unit Toggle */}
            <div className="flex items-center gap-1 rounded-full bg-secondary/10 p-1">
              <button
                onClick={() => units === 'metric' && toggleUnits()}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  units === 'imperial'
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Imperial
              </button>
              <button
                onClick={() => units === 'imperial' && toggleUnits()}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  units === 'metric'
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:text-foreground'
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

            {/* Exit Button */}
            <Link href={CONTACT.exitUrl}>
              <Button
                variant="outline"
                className="rounded-full gap-2"
              >
                <X className="h-4 w-4" />
                Exit
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
