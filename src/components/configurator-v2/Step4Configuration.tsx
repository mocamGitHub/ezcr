'use client'

import React from 'react'
import { useConfigurator } from './ConfiguratorProvider'
import { Button } from '@/components/ui/button'
import { PRICING, PRODUCT_NAMES } from '@/types/configurator-v2'
import { Badge } from '@/components/ui/badge'
import { Info } from 'lucide-react'

export function Step4Configuration() {
  const {
    configData,
    units,
    selectModel,
    selectExtension,
    selectDelivery,
    selectService,
    selectBoltlessKit,
    selectTiedown,
    nextStep,
    previousStep,
  } = useConfigurator()

  const weightUnit = units === 'imperial' ? 'lbs' : 'kg'
  const lengthUnit = units === 'imperial' ? 'inches' : 'cm'

  // Show delivery warning when Demo + Ship conflict
  const showDeliveryWarning = configData.service.id === 'demo'

  // Boltless kit selected - Turnbuckles (2 pairs) should be recommended
  const boltlessKitSelected = configData.boltlessKit.id === 'kit'

  return (
    <div className="animate-in fade-in duration-300">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Configuration Summary */}
        <div className="bg-card rounded-xl p-6 border border-[#0B5394]/30">
          <h3 className="text-xl font-semibold mb-4 text-[#0B5394]">Your Configuration Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Vehicle Type</p>
              <p className="font-medium capitalize">{configData.vehicle}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cargo Area</p>
              <p className="font-medium">
                {configData.vehicle === 'pickup'
                  ? configData.measurements.bedLengthClosed?.toFixed(1)
                  : configData.measurements.cargoLength?.toFixed(1)}{' '}
                {lengthUnit}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Load Height</p>
              <p className="font-medium">
                {configData.measurements.loadHeight?.toFixed(1)} {lengthUnit}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Motorcycle Type</p>
              <p className="font-medium capitalize">{configData.motorcycle.type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Motorcycle Weight</p>
              <p className="font-medium">
                {configData.motorcycle.weight?.toFixed(1)} {weightUnit}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Wheelbase</p>
              <p className="font-medium">
                {configData.motorcycle.wheelbase?.toFixed(1)} {lengthUnit}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Length (bike)</p>
              <p className="font-medium">
                {configData.motorcycle.length?.toFixed(1)} {lengthUnit}
              </p>
            </div>
            {configData.measurements.requiredAC001 && (
              <div>
                <p className="text-sm text-muted-foreground">Required Extension</p>
                <p className="font-medium text-secondary">{configData.measurements.requiredAC001}</p>
              </div>
            )}
          </div>
        </div>

        {/* Ramp Model Selection */}
        <div className="pt-4">
          <h3 className="text-xl font-bold mb-2 pb-2 border-b border-[#F78309]/30">Select <span className="text-[#F78309]">Ramp Model</span></h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AUN250 */}
            <button
              type="button"
              onClick={() => selectModel('AUN250', PRODUCT_NAMES.models.AUN250, PRICING.models.AUN250)}
              className={`
                relative p-6 rounded-xl border-2 transition-all duration-300 text-left
                hover:shadow-lg
                ${
                  configData.selectedModel.id === 'AUN250'
                    ? 'border-[#F78309] bg-[#F78309]/5'
                    : 'border-border bg-card hover:border-[#F78309]/50'
                }
              `}
            >
              <Badge className="absolute top-3 right-3 bg-success text-white">RECOMMENDED</Badge>
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-xl font-bold">AUN250</h4>
                <p className="text-2xl font-bold">${PRICING.models.AUN250.toFixed(0)}</p>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-success">✓</span> 2,500 lb weight capacity
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-success">✓</span> 8ft overall length
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-success">✓</span> Ideal for pickup trucks
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-success">✓</span> Non-slip surface
                </li>
              </ul>
            </button>

            {/* AUN210 */}
            <button
              type="button"
              onClick={() => selectModel('AUN210', PRODUCT_NAMES.models.AUN210, PRICING.models.AUN210)}
              className={`
                relative p-6 rounded-xl border-2 transition-all duration-300 text-left
                hover:shadow-lg
                ${
                  configData.selectedModel.id === 'AUN210'
                    ? 'border-[#F78309] bg-[#F78309]/5'
                    : 'border-border bg-card hover:border-[#F78309]/50'
                }
              `}
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-xl font-bold">AUN210</h4>
                <p className="text-2xl font-bold">${PRICING.models.AUN210.toFixed(0)}</p>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-success">✓</span> 2,000 lb weight capacity
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-success">✓</span> 7ft overall length
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-success">✓</span> Lightweight design
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-success">✓</span> Budget-friendly option
                </li>
              </ul>
            </button>
          </div>
        </div>

        {/* Ramp Extensions */}
        <div className="pt-6">
          <h3 className="text-xl font-bold mb-2 pb-2 border-b border-[#F78309]/30">Ramp <span className="text-[#F78309]">Extensions</span></h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { id: 'no-ext', name: PRODUCT_NAMES.extensions['no-ext'], price: PRICING.extensions['no-ext'], recommended: false },
              { id: 'ext1', name: PRODUCT_NAMES.extensions.ext1, price: PRICING.extensions.ext1, recommended: true },
              { id: 'ext2', name: PRODUCT_NAMES.extensions.ext2, price: PRICING.extensions.ext2, recommended: false },
              { id: 'ext3', name: PRODUCT_NAMES.extensions.ext3, price: PRICING.extensions.ext3, recommended: false },
            ].map((ext) => (
              <button
                key={ext.id}
                type="button"
                onClick={() => selectExtension(ext.id, ext.name, ext.price)}
                className={`
                  relative p-4 rounded-xl border-2 transition-all duration-300 text-left
                  hover:shadow-md
                  ${
                    configData.extension.id === ext.id
                      ? 'border-[#F78309] bg-[#F78309]/5'
                      : 'border-border bg-card hover:border-[#F78309]/50'
                  }
                `}
              >
                {ext.recommended && (
                  <Badge className={`absolute top-2 right-2 text-xs ${
                    configData.extension.id === ext.id ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    RECOMMENDED
                  </Badge>
                )}
                <h4 className="font-semibold text-sm mb-1">{ext.name}</h4>
                <p className="text-lg font-bold">${ext.price.toFixed(0)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Delivery & Services */}
        <div className="pt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Delivery Options */}
          <div>
            <h3 className="text-xl font-bold mb-2 pb-2 border-b border-[#0B5394]/30"><span className="text-[#0B5394]">Delivery</span> Options</h3>
            <div className="space-y-3">
              {[
                { id: 'pickup', name: PRODUCT_NAMES.delivery.pickup, price: PRICING.delivery.pickup },
                { id: 'ship', name: PRODUCT_NAMES.delivery.ship, price: PRICING.delivery.ship },
              ].map((delivery) => (
                <button
                  key={delivery.id}
                  type="button"
                  onClick={() => selectDelivery(delivery.id, delivery.name, delivery.price)}
                  disabled={delivery.id === 'ship' && showDeliveryWarning}
                  className={`
                    w-full p-4 rounded-xl border-2 transition-all duration-300 text-left
                    hover:shadow-md
                    ${
                      configData.delivery.id === delivery.id
                        ? 'border-[#F78309] bg-[#F78309]/5'
                        : 'border-border bg-card hover:border-[#F78309]/50'
                    }
                    ${delivery.id === 'ship' && showDeliveryWarning ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">{delivery.name}</h4>
                    <p className="text-lg font-bold">${delivery.price.toFixed(0)}</p>
                  </div>
                </button>
              ))}
            </div>

            {showDeliveryWarning && (
              <div className="mt-3 bg-[#F78309]/10 border border-[#F78309] rounded-lg p-3 flex gap-2 text-sm">
                <Info className="w-4 h-4 text-[#F78309] shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
                  ⚠️ Shipping is not available with Demo service. Please select Not Assembled or Assembly Service.
                </p>
              </div>
            )}
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xl font-bold mb-2 pb-2 border-b border-[#0B5394]/30"><span className="text-[#0B5394]">Services</span></h3>
            <div className="space-y-3">
              {[
                { id: 'not-assembled', name: PRODUCT_NAMES.services['not-assembled'], price: PRICING.services['not-assembled'] },
                { id: 'assembly', name: PRODUCT_NAMES.services.assembly, price: PRICING.services.assembly },
                { id: 'demo', name: PRODUCT_NAMES.services.demo, price: PRICING.services.demo },
              ].map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => selectService(service.id, service.name, service.price)}
                  className={`
                    w-full p-4 rounded-xl border-2 transition-all duration-300 text-left
                    hover:shadow-md
                    ${
                      configData.service.id === service.id
                        ? 'border-[#F78309] bg-[#F78309]/5'
                        : 'border-border bg-card hover:border-[#F78309]/50'
                    }
                  `}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">{service.name}</h4>
                    <p className="text-lg font-bold">${service.price.toFixed(0)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Accessories */}
        <div className="pt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Boltless Tiedown Kit */}
          <div>
            <h3 className="text-xl font-bold mb-2 pb-2 border-b border-[#F78309]/30"><span className="text-[#F78309]">Boltless</span> Tiedown Kit</h3>
            <div className="space-y-3">
              {[
                { id: 'no-kit', name: PRODUCT_NAMES.boltlessKit['no-kit'], price: PRICING.boltlessKit['no-kit'] },
                { id: 'kit', name: PRODUCT_NAMES.boltlessKit.kit, price: PRICING.boltlessKit.kit },
              ].map((kit) => (
                <button
                  key={kit.id}
                  type="button"
                  onClick={() => selectBoltlessKit(kit.id, kit.name, kit.price)}
                  className={`
                    w-full p-4 rounded-xl border-2 transition-all duration-300 text-left
                    hover:shadow-md
                    ${
                      configData.boltlessKit.id === kit.id
                        ? 'border-[#F78309] bg-[#F78309]/5'
                        : 'border-border bg-card hover:border-[#F78309]/50'
                    }
                  `}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">{kit.name}</h4>
                    <p className="text-lg font-bold">${kit.price.toFixed(0)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tie-Down Accessories */}
          <div>
            <h3 className="text-xl font-bold mb-2 pb-2 border-b border-[#F78309]/30"><span className="text-[#F78309]">Tie-Down</span> Accessories</h3>
            <div className="space-y-3">
              {[
                { id: 'no-tiedown', name: PRODUCT_NAMES.tiedown['no-tiedown'], price: PRICING.tiedown['no-tiedown'], recommended: false },
                { id: 'turnbuckle-1', name: PRODUCT_NAMES.tiedown['turnbuckle-1'], price: PRICING.tiedown['turnbuckle-1'], recommended: false },
                { id: 'turnbuckle-2', name: PRODUCT_NAMES.tiedown['turnbuckle-2'], price: PRICING.tiedown['turnbuckle-2'], recommended: boltlessKitSelected },
                { id: 'straps', name: PRODUCT_NAMES.tiedown.straps, price: PRICING.tiedown.straps, recommended: false },
              ].map((tiedown) => (
                <button
                  key={tiedown.id}
                  type="button"
                  onClick={() => selectTiedown(tiedown.id, tiedown.name, tiedown.price)}
                  className={`
                    relative w-full p-4 rounded-xl border-2 transition-all duration-300 text-left
                    hover:shadow-md
                    ${
                      configData.tiedown.id === tiedown.id
                        ? 'border-[#F78309] bg-[#F78309]/5'
                        : 'border-border bg-card hover:border-[#F78309]/50'
                    }
                  `}
                >
                  {tiedown.recommended && (
                    <Badge className={`absolute top-2 right-2 text-xs ${
                      configData.tiedown.id === tiedown.id ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      RECOMMENDED
                    </Badge>
                  )}
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-sm">{tiedown.name}</h4>
                    <p className="text-lg font-bold">${tiedown.price.toFixed(0)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6">
          <Button
            type="button"
            onClick={previousStep}
            variant="outline"
            className="rounded-full"
          >
            Previous
          </Button>

          <Button
            type="button"
            onClick={nextStep}
            className="rounded-full px-8 bg-[#0B5394] hover:bg-[#0B5394]/90 text-white"
          >
            Continue to Quote
          </Button>
        </div>
      </div>
    </div>
  )
}
