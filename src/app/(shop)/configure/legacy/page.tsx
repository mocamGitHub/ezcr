'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, Ruler, FileCode, GitBranch, AlertTriangle } from 'lucide-react'

export default function LegacyConfiguratorReview() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto max-w-[1200px] px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/configure"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Current Configurator
              </Link>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-amber-500 font-medium">Legacy Review Mode</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-[1200px] px-4 py-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Legacy Configurator <span className="text-amber-500">Review</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Access and review the pre-UFE configurator implementations. These are preserved
            for reference, comparison, and rollback purposes.
          </p>
        </div>

        {/* Warning Banner */}
        <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-600 dark:text-amber-400">
                These are archived versions
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-500/80">
                The legacy configurators are preserved as-is from before the UFE implementation.
                They are not actively maintained and may not reflect current business rules.
              </p>
            </div>
          </div>
        </div>

        {/* Wizard Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Quick Wizard */}
          <div className="bg-card rounded-xl border border-border p-6 hover:border-[#F78309]/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#F78309]/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#F78309]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Quick Wizard</h2>
                <p className="text-sm text-muted-foreground">5-7 question flow</p>
              </div>
            </div>

            <p className="text-muted-foreground mb-4">
              Rapid ramp recommendation based on general responses. Does not capture
              exact measurements - uses bed length categories instead.
            </p>

            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Questions covered:</p>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F78309]"></span>
                  Bed length category
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F78309]"></span>
                  Tonneau cover (type, roll direction)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F78309]"></span>
                  Motorcycle weight category
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F78309]"></span>
                  Tailgate requirement
                </li>
              </ul>
            </div>

            <Link
              href="/configure/legacy/quick"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#F78309] hover:bg-[#e07308] text-white font-medium rounded-lg transition-colors"
            >
              <Clock className="w-4 h-4" />
              Review Quick Wizard
            </Link>
          </div>

          {/* Advanced Wizard */}
          <div className="bg-card rounded-xl border border-border p-6 hover:border-[#0B5394]/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#0B5394]/10 flex items-center justify-center">
                <Ruler className="w-6 h-6 text-[#0B5394]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Advanced Wizard</h2>
                <p className="text-sm text-muted-foreground">Full configurator</p>
              </div>
            </div>

            <p className="text-muted-foreground mb-4">
              Complete configuration with exact measurements. Determines accessories
              and generates full quotes.
            </p>

            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Data collected:</p>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0B5394]"></span>
                  Vehicle type selection
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0B5394]"></span>
                  Exact truck measurements (inches)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0B5394]"></span>
                  Motorcycle specs (weight, wheelbase, length)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0B5394]"></span>
                  Accessory selection
                </li>
              </ul>
            </div>

            <Link
              href="/configure/legacy/advanced"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#0B5394] hover:bg-[#0B5394]/90 text-white font-medium rounded-lg transition-colors"
            >
              <Ruler className="w-4 h-4" />
              Review Advanced Wizard
            </Link>
          </div>
        </div>

        {/* Technical Info */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileCode className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Technical Reference</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Legacy Files Location</p>
              <code className="block p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                src/components/configurator-legacy/
              </code>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Backup Date</p>
              <p className="text-sm text-muted-foreground">December 11, 2024</p>
              <p className="text-xs text-muted-foreground mt-1">Pre-UFE Implementation</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm font-medium text-foreground mb-2">Files Preserved</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                'QuickConfiguratorV2.tsx',
                'Configurator.tsx',
                'ConfiguratorSmooth.tsx',
                'ConfiguratorProvider.tsx',
                'Step1VehicleType.tsx',
                'Step2Measurements.tsx',
                'Step3Motorcycle.tsx',
                'Step4Configuration.tsx',
                'Step5Quote.tsx',
                'configurator-utils.ts',
                'types-configurator.ts',
                'types-configurator-v2.ts',
              ].map((file) => (
                <div key={file} className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground truncate">
                  {file}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Version Comparison */}
        <div className="mt-8 bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <GitBranch className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Version Comparison</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Feature</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Legacy</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">UFE (New)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3">Rules Engine</td>
                  <td className="py-2 px-3 text-amber-500">Hardcoded in components</td>
                  <td className="py-2 px-3 text-green-500">Config-driven JSON</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3">Ramp Models</td>
                  <td className="py-2 px-3">AUN200, AUN250</td>
                  <td className="py-2 px-3">AUN210, AUN250 (extensible)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3">Tailgate Logic</td>
                  <td className="py-2 px-3 text-amber-500">Basic</td>
                  <td className="py-2 px-3 text-green-500">Full loaded/unloaded rules</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3">Accessory Rules</td>
                  <td className="py-2 px-3 text-amber-500">Simple threshold</td>
                  <td className="py-2 px-3 text-green-500">Full compatibility matrix</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3">Wizard Sync</td>
                  <td className="py-2 px-3 text-amber-500">One-way (Quick → Full)</td>
                  <td className="py-2 px-3 text-green-500">Bidirectional</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">Angle Calculation</td>
                  <td className="py-2 px-3 text-red-500">Not implemented</td>
                  <td className="py-2 px-3 text-green-500">Toggleable with warnings</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
