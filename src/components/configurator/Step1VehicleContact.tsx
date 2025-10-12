'use client'

import React from 'react'
import { useConfigurator } from '@/contexts/ConfiguratorContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import type { VehicleType } from '@/types/configurator'

const VEHICLE_TYPES: { value: VehicleType; label: string; icon: string }[] = [
  { value: 'pickup', label: 'Pickup Truck', icon: '🚗' },
  { value: 'van', label: 'Van', icon: '🚐' },
  { value: 'trailer', label: 'Trailer', icon: '🚚' },
]

export default function Step1VehicleContact() {
  const { data, updateStep1, nextStep, canProceed } = useConfigurator()
  const step1 = data.step1

  const handleVehicleSelect = (type: VehicleType) => {
    updateStep1({ vehicleType: type })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canProceed()) {
      nextStep()
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Let's Configure Your Ramp
        </h2>
        <p className="text-gray-600">
          First, tell us about your vehicle and how we can reach you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Vehicle Type Selection */}
        <div>
          <Label className="text-lg font-semibold mb-4 block">
            What type of vehicle do you have?
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {VEHICLE_TYPES.map((vehicle) => (
              <button
                key={vehicle.value}
                type="button"
                onClick={() => handleVehicleSelect(vehicle.value)}
                className={`p-6 border-2 rounded-lg transition-all ${
                  step1.vehicleType === vehicle.value
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-4xl mb-2">{vehicle.icon}</div>
                <div className="font-semibold">{vehicle.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Contact Information</h3>

          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              type="text"
              value={step1.contactName}
              onChange={(e) => updateStep1({ contactName: e.target.value })}
              placeholder="John Doe"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={step1.contactEmail}
              onChange={(e) => updateStep1({ contactEmail: e.target.value })}
              placeholder="john@example.com"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={step1.contactPhone}
              onChange={(e) => updateStep1({ contactPhone: e.target.value })}
              placeholder="(555) 123-4567"
              className="mt-1"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="sms-opt-in"
              checked={step1.smsOptIn}
              onCheckedChange={(checked) =>
                updateStep1({ smsOptIn: checked as boolean })
              }
            />
            <Label
              htmlFor="sms-opt-in"
              className="text-sm font-normal cursor-pointer"
            >
              Send me updates via SMS about my configuration
            </Label>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-end pt-6 border-t">
          <Button
            type="submit"
            size="lg"
            disabled={!canProceed()}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Continue to Measurements
          </Button>
        </div>
      </form>
    </div>
  )
}
