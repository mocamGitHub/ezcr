'use client'

// Legacy Advanced Wizard - For Review Purposes
// This renders the pre-UFE Full Configurator

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import Configurator from '@/components/configurator-legacy/Configurator'

export default function LegacyAdvancedWizard() {
  return (
    <div className="relative">
      {/* Legacy Banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white py-2 px-4">
        <div className="container mx-auto max-w-[1200px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">
              LEGACY VERSION - For Review Only
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/configure/legacy"
              className="text-sm hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Review Menu
            </Link>
            <Link
              href="/configure-smooth"
              className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors"
            >
              Use Current Version
            </Link>
          </div>
        </div>
      </div>

      {/* Add top padding to account for banner */}
      <div className="pt-10">
        <Configurator />
      </div>
    </div>
  )
}
