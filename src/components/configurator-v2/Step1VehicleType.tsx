'use client'

import React from 'react'
import { useConfigurator } from './ConfiguratorProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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

export function Step1VehicleType() {
  const { configData, updateContact, selectVehicle, nextStep, canProceedFromStep } = useConfigurator()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canProceedFromStep(1)) {
      nextStep()
    }
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">
          Let&apos;s <span className="text-[#F78309]">Get Started</span>
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          We&apos;ll help you configure the perfect ramp for your needs. First, tell us about your vehicle
          and optionally provide your contact information.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Contact Information (Optional) */}
        <div className="bg-card rounded-xl p-6 border border-[#0B5394]/30">
          <h3 className="text-xl font-semibold mb-4 text-[#0B5394]">Contact Information <span className="text-[#F78309]">(Optional, but Helpful)</span></h3>
          <p className="text-sm text-muted-foreground mb-6">
            Providing your information now will save time later and allow us to save your configuration.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={configData.contact.firstName}
                onChange={(e) => updateContact({ firstName: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={configData.contact.lastName}
                onChange={(e) => updateContact({ lastName: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={configData.contact.email}
                onChange={(e) => updateContact({ email: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={configData.contact.phone}
                onChange={(e) => updateContact({ phone: e.target.value })}
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="flex items-start gap-3 mt-4">
            <Checkbox
              id="smsOptIn"
              checked={configData.contact.smsOptIn}
              onCheckedChange={(checked) => updateContact({ smsOptIn: checked as boolean })}
            />
            <Label htmlFor="smsOptIn" className="text-sm leading-relaxed cursor-pointer">
              I agree to receive SMS notifications about my order. Standard messaging rates may apply.
              You can opt out at any time by replying STOP.
            </Label>
          </div>
        </div>

        {/* Vehicle Selection (Required) */}
        <div>
          <h3 className="text-xl font-semibold mb-4">
            Select Your <span className="text-[#F78309]">Vehicle Type</span> <span className="text-destructive">*</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {VEHICLES.map((vehicle) => (
              <button
                key={vehicle.type}
                type="button"
                onClick={() => {
                  selectVehicle(vehicle.type)
                  // Auto-advance to step 2 after a brief delay for visual feedback
                  setTimeout(() => nextStep(), 300)
                }}
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

        {/* Navigation */}
        <div className="flex justify-end items-center pt-6">
          <Button
            type="submit"
            disabled={!configData.vehicle}
            className={`rounded-full px-8 ${configData.vehicle ? 'bg-[#0B5394] hover:bg-[#0B5394]/90 text-white' : ''}`}
          >
            Continue
          </Button>
        </div>
      </form>
    </div>
  )
}
