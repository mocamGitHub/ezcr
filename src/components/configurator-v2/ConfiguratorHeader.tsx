'use client'

import React from 'react'
import Link from 'next/link'
import { useConfigurator } from './ConfiguratorProvider'
import { Button } from '@/components/ui/button'
import { CONTACT } from '@/types/configurator-v2'
import { Sun, Moon, X } from 'lucide-react'

export function ConfiguratorHeader() {
  const { theme, units, toggleTheme, toggleUnits } = useConfigurator()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-[1400px] px-4">
        <nav className="flex h-16 items-center justify-between gap-4 flex-wrap">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold" style={{ color: '#005696' }}>
                EZ CYCLE
              </span>
              <span className="text-2xl font-bold" style={{ color: '#ff8c00' }}>
                RAMP
              </span>
            </div>
          </Link>

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

            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Exit Button */}
            <Link href={CONTACT.exitUrl}>
              <Button
                variant="outline"
                className="rounded-full gap-2"
              >
                <X className="h-4 w-4" />
                Exit Configurator
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
