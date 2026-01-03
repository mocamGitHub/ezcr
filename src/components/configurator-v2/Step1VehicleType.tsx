'use client'

import React, { useState } from 'react'
import { useConfigurator } from './ConfiguratorProvider'
import { Button } from '@/components/ui/button'
import { VehicleType } from '@/types/configurator-v2'

const VEHICLES = [
  {
    type: 'pickup' as VehicleType,
    icon: '🚙',
    name: 'Pickup Truck',
    description: 'with tailgate',
  },
  {
    type: 'van' as VehicleType,
    icon: '🚐',
    name: 'Cargo Van',
    description: 'Sprinter, Transit, etc.',
  },
  {
    type: 'trailer' as VehicleType,
    icon: '🚛',
    name: 'Trailer',
    description: 'Enclosed or open',
  },
]

const TONNEAU_TYPES = [
  { id: 'rollup', name: 'Roll-Up', icon: '🔄', description: 'Soft or hard roll-up cover' },
  { id: 'folding', name: 'Folding', icon: '📁', description: 'Tri-fold or bi-fold cover' },
  { id: 'retractable', name: 'Retractable', icon: '⏪', description: 'Slides into canister' },
  { id: 'hinged', name: 'Hinged', icon: '📦', description: 'One-piece hard cover' },
]

const ROLLUP_POSITIONS = [
  { id: 'on_top', name: 'On Top of Bed', icon: '⬆️', description: 'Rolls up and sits on top of the bed rails' },
  { id: 'inside', name: 'Inside the Bed', icon: '⬇️', description: 'Rolls up inside the bed near the cab' },
]

export function Step1VehicleType() {
  const { configData, selectVehicle, nextStep, canProceedFromStep, updateConfigData } = useConfigurator()

  // Tonneau cover state
  const [hasTonneau, setHasTonneau] = useState<boolean | null>(null)
  const [tonneauType, setTonneauType] = useState<string | null>(null)
  const [rollupPosition, setRollupPosition] = useState<string | null>(null)

  const isPickupSelected = configData.vehicle === 'pickup'

  // Determine if tonneau questions are complete
  const tonneauComplete =
    !isPickupSelected ||
    hasTonneau === false ||
    (hasTonneau === true && tonneauType !== null && (tonneauType !== 'rollup' || rollupPosition !== null))

  const handleVehicleSelect = (vehicleType: VehicleType) => {
    selectVehicle(vehicleType)

    // Reset tonneau state when changing vehicle
    if (vehicleType !== 'pickup') {
      setHasTonneau(null)
      setTonneauType(null)
      setRollupPosition(null)
      // Auto-advance for non-pickup vehicles
      setTimeout(() => nextStep(), 300)
    } else {
      // If pickup is already selected and clicked again, show tonneau question
      if (configData.vehicle === 'pickup' && hasTonneau === null) {
        // Already showing tonneau question, do nothing
      } else if (configData.vehicle === 'pickup') {
        // Reset to show tonneau question again
        setHasTonneau(null)
        setTonneauType(null)
        setRollupPosition(null)
      }
    }
  }

  const handleTonneauAnswer = (answer: boolean) => {
    setHasTonneau(answer)
    updateConfigData({ hasTonneauCover: answer })

    if (!answer) {
      setTonneauType(null)
      setRollupPosition(null)
      // No tonneau, advance to next step
      setTimeout(() => nextStep(), 300)
    }
  }

  const handleTonneauTypeSelect = (type: string) => {
    setTonneauType(type)
    updateConfigData({ tonneauType: type })

    if (type !== 'rollup') {
      setRollupPosition(null)
      // Non-rollup type selected, advance
      setTimeout(() => nextStep(), 300)
    }
  }

  const handleRollupPositionSelect = (position: string) => {
    setRollupPosition(position)
    updateConfigData({ rollupPosition: position })
    // All questions answered, advance
    setTimeout(() => nextStep(), 300)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canProceedFromStep(1) && tonneauComplete) {
      nextStep()
    }
  }

  return (
    <div className="animate-in fade-in duration-300">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vehicle Selection */}
        <div>
          <h3 className="text-xl font-semibold mb-4">
            Select Your <span className="text-[#F78309]">Vehicle Type</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {VEHICLES.map((vehicle) => (
              <button
                key={vehicle.type}
                type="button"
                onClick={() => handleVehicleSelect(vehicle.type)}
                className={`
                  group relative p-6 rounded-xl border-2 transition-all duration-300
                  hover:shadow-lg hover:-translate-y-1
                  ${
                    configData.vehicle === vehicle.type
                      ? 'border-[#F78309] bg-[#F78309]/10 shadow-lg shadow-[#F78309]/20'
                      : 'border-border bg-card hover:border-[#F78309]/50'
                  }
                `}
              >
                <div className="text-center">
                  <div className="text-5xl mb-3">{vehicle.icon}</div>
                  <h4 className="text-lg font-semibold mb-1">{vehicle.name}</h4>
                  <p className="text-sm text-muted-foreground">{vehicle.description}</p>
                </div>

                {configData.vehicle === vehicle.type && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#F78309] flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tonneau Cover Question - Only for Pickup */}
        {isPickupSelected && hasTonneau === null && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pt-4 border-t border-border">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <h3 className="text-lg font-semibold whitespace-nowrap">
                Do you have a <span className="text-[#F78309]">Tonneau Cover</span>?
              </h3>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleTonneauAnswer(true)}
                  className="px-6 py-3 rounded-xl border-2 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border-border bg-card hover:border-[#F78309]/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✅</span>
                    <span className="font-semibold">Yes</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTonneauAnswer(false)}
                  className="px-6 py-3 rounded-xl border-2 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border-border bg-card hover:border-[#F78309]/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">❌</span>
                    <span className="font-semibold">No</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tonneau Type Question */}
        {isPickupSelected && hasTonneau === true && tonneauType === null && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pt-4 border-t border-border">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <h3 className="text-lg font-semibold whitespace-nowrap">
                What type of <span className="text-[#F78309]">Tonneau Cover</span>?
              </h3>

              <div className="flex flex-wrap justify-center gap-3">
                {TONNEAU_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleTonneauTypeSelect(type.id)}
                    className="px-4 py-3 rounded-xl border-2 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border-border bg-card hover:border-[#F78309]/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{type.icon}</span>
                      <span className="font-semibold text-sm">{type.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setHasTonneau(null)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* Roll-Up Position Question */}
        {isPickupSelected && hasTonneau === true && tonneauType === 'rollup' && rollupPosition === null && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pt-4 border-t border-border">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <h3 className="text-lg font-semibold whitespace-nowrap">
                Where does it <span className="text-[#F78309]">roll up</span>?
              </h3>

              <div className="flex flex-wrap justify-center gap-3">
                {ROLLUP_POSITIONS.map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => handleRollupPositionSelect(pos.id)}
                    className="px-4 py-3 rounded-xl border-2 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border-border bg-card hover:border-[#F78309]/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{pos.icon}</span>
                      <span className="font-semibold text-sm">{pos.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setTonneauType(null)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* Navigation - only show if no vehicle selected yet */}
        {!configData.vehicle && (
          <div className="flex justify-end items-center pt-6">
            <Button
              type="submit"
              disabled={true}
              className="rounded-full px-8"
            >
              Continue
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}
