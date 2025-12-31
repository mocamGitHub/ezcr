'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useConfigurator } from './ConfiguratorProvider'
import { Button } from '@/components/ui/button'
import { usePricing, type PricingData } from '@/contexts/PricingContext'
import { Badge } from '@/components/ui/badge'
import { Info, Loader2, Truck, MapPin, Home, Building2, Check, Phone } from 'lucide-react'
import { CONTACT_INFO, TFORCE_INFO, getPhoneLink } from '@/config/contact'

// Helper to get price from pricing data with category mapping
function getPrice(pricing: PricingData | null, category: keyof PricingData | 'boltlessKit', key: string): number {
  if (!pricing) return 0
  const apiCategory = category === 'boltlessKit' ? 'boltless_kit' : category
  return pricing[apiCategory as keyof PricingData]?.[key]?.price ?? 0
}

function getName(pricing: PricingData | null, category: keyof PricingData | 'boltlessKit', key: string): string {
  if (!pricing) return key
  const apiCategory = category === 'boltlessKit' ? 'boltless_kit' : category
  return pricing[apiCategory as keyof PricingData]?.[key]?.name ?? key
}

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
    // Shipping
    shippingZip,
    setShippingZip,
    isResidential,
    setIsResidential,
    shippingQuote,
    isLoadingShipping,
    shippingError,
    fetchShippingQuote,
    clearShippingQuote,
    // UFE
    ufeResult,
    ufeRecommendedModel,
  } = useConfigurator()

  // Get pricing from context
  const { pricing } = usePricing()

  // Build product options from dynamic pricing
  const modelOptions = useMemo(() => [
    { id: 'AUN250', name: getName(pricing, 'models', 'AUN250'), price: getPrice(pricing, 'models', 'AUN250') },
    { id: 'AUN210', name: getName(pricing, 'models', 'AUN210'), price: getPrice(pricing, 'models', 'AUN210') },
  ], [pricing])

  const extensionOptions = useMemo(() => [
    { id: 'no-ext', name: getName(pricing, 'extensions', 'no-ext'), price: getPrice(pricing, 'extensions', 'no-ext'), recommended: false },
    { id: 'ext1', name: getName(pricing, 'extensions', 'ext1'), price: getPrice(pricing, 'extensions', 'ext1'), recommended: true },
    { id: 'ext2', name: getName(pricing, 'extensions', 'ext2'), price: getPrice(pricing, 'extensions', 'ext2'), recommended: false },
    { id: 'ext3', name: getName(pricing, 'extensions', 'ext3'), price: getPrice(pricing, 'extensions', 'ext3'), recommended: false },
  ], [pricing])

  const serviceOptions = useMemo(() => [
    { id: 'not-assembled', name: getName(pricing, 'services', 'not-assembled'), price: getPrice(pricing, 'services', 'not-assembled') },
    { id: 'assembly', name: getName(pricing, 'services', 'assembly'), price: getPrice(pricing, 'services', 'assembly') },
    { id: 'demo', name: getName(pricing, 'services', 'demo'), price: getPrice(pricing, 'services', 'demo') },
  ], [pricing])

  const boltlessKitOptions = useMemo(() => [
    { id: 'no-kit', name: getName(pricing, 'boltlessKit', 'no-kit'), price: getPrice(pricing, 'boltlessKit', 'no-kit') },
    { id: 'kit', name: getName(pricing, 'boltlessKit', 'kit'), price: getPrice(pricing, 'boltlessKit', 'kit') },
  ], [pricing])

  // Boltless kit selected - Turnbuckles (2 pairs) should be recommended
  const boltlessKitSelected = configData.boltlessKit.id === 'kit'

  const tiedownOptions = useMemo(() => [
    { id: 'no-tiedown', name: getName(pricing, 'tiedown', 'no-tiedown'), price: getPrice(pricing, 'tiedown', 'no-tiedown'), recommended: false },
    { id: 'turnbuckle-1', name: getName(pricing, 'tiedown', 'turnbuckle-1'), price: getPrice(pricing, 'tiedown', 'turnbuckle-1'), recommended: false },
    { id: 'turnbuckle-2', name: getName(pricing, 'tiedown', 'turnbuckle-2'), price: getPrice(pricing, 'tiedown', 'turnbuckle-2'), recommended: boltlessKitSelected },
    { id: 'straps', name: getName(pricing, 'tiedown', 'straps'), price: getPrice(pricing, 'tiedown', 'straps'), recommended: false },
  ], [pricing, boltlessKitSelected])

  // Local state for ZIP input
  const [zipInput, setZipInput] = useState(shippingZip)

  // Sync local state with context
  useEffect(() => {
    setZipInput(shippingZip)
  }, [shippingZip])

  const weightUnit = units === 'imperial' ? 'lbs' : 'kg'
  const lengthUnit = units === 'imperial' ? 'inches' : 'cm'

  // Show delivery warning when Demo + Ship conflict
  const showDeliveryWarning = configData.service.id === 'demo'

  // Handle ZIP code submission
  const handleGetShippingQuote = async () => {
    if (zipInput.length >= 5) {
      setShippingZip(zipInput)
      // Small delay to ensure state is updated
      setTimeout(() => {
        fetchShippingQuote()
      }, 100)
    }
  }

  // Handle picking up (clear shipping quote)
  const handleSelectPickup = () => {
    clearShippingQuote()
    selectDelivery('pickup', getName(pricing, 'delivery', 'pickup'), getPrice(pricing, 'delivery', 'pickup'))
  }

  // Check if shipping is selected (has a valid quote)
  const isShippingSelected = configData.delivery.id === 'ship' && shippingQuote?.success

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
              onClick={() => selectModel('AUN250', modelOptions[0].name, modelOptions[0].price)}
              className={`
                relative p-6 rounded-xl border-2 transition-all duration-300 text-left
                hover:shadow-lg
                ${
                  configData.selectedModel.id === 'AUN250'
                    ? 'border-[#F78309] bg-[#F78309]/5 ring-2 ring-[#F78309]/20'
                    : 'border-border bg-card hover:border-[#F78309]/50'
                }
              `}
            >
              {/* Selection Checkmark */}
              {configData.selectedModel.id === 'AUN250' && (
                <div className="absolute top-3 left-3 w-6 h-6 bg-[#F78309] rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              {(ufeRecommendedModel === 'AUN250' || (!ufeRecommendedModel && configData.vehicle === 'pickup')) && (
                <Badge className="absolute top-3 right-3 bg-success text-white">
                  {ufeRecommendedModel === 'AUN250' ? 'UFE RECOMMENDED' : 'RECOMMENDED'}
                </Badge>
              )}
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-xl font-bold">AUN250</h4>
                <p className="text-2xl font-bold">${modelOptions[0].price.toFixed(0)}</p>
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
              onClick={() => selectModel('AUN210', modelOptions[1].name, modelOptions[1].price)}
              className={`
                relative p-6 rounded-xl border-2 transition-all duration-300 text-left
                hover:shadow-lg
                ${
                  configData.selectedModel.id === 'AUN210'
                    ? 'border-[#F78309] bg-[#F78309]/5 ring-2 ring-[#F78309]/20'
                    : 'border-border bg-card hover:border-[#F78309]/50'
                }
              `}
            >
              {/* Selection Checkmark */}
              {configData.selectedModel.id === 'AUN210' && (
                <div className="absolute top-3 left-3 w-6 h-6 bg-[#F78309] rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              {ufeRecommendedModel === 'AUN210' && (
                <Badge className="absolute top-3 right-3 bg-success text-white">UFE RECOMMENDED</Badge>
              )}
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-xl font-bold">AUN210</h4>
                <p className="text-2xl font-bold">${modelOptions[1].price.toFixed(0)}</p>
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

          {/* UFE Notes and Warnings */}
          {ufeResult?.success && ((ufeResult.tonneauNotes && ufeResult.tonneauNotes.length > 0) || ufeResult.angleWarning) && (
            <div className="mt-4 space-y-2">
              {ufeResult.angleWarning && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">{ufeResult.angleWarning}</p>
                </div>
              )}
              {ufeResult.tonneauNotes?.map((note, index) => (
                <div key={index} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">{note}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ramp Extensions */}
        <div className="pt-6">
          <h3 className="text-xl font-bold mb-2 pb-2 border-b border-[#F78309]/30">Ramp <span className="text-[#F78309]">Extensions</span></h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {extensionOptions.map((ext) => (
              <button
                key={ext.id}
                type="button"
                onClick={() => selectExtension(ext.id, ext.name, ext.price)}
                className={`
                  relative p-4 rounded-xl border-2 transition-all duration-300 text-left
                  hover:shadow-md
                  ${
                    configData.extension.id === ext.id
                      ? 'border-[#F78309] bg-[#F78309]/5 ring-2 ring-[#F78309]/20'
                      : 'border-border bg-card hover:border-[#F78309]/50'
                  }
                `}
              >
                {/* Selection Checkmark */}
                {configData.extension.id === ext.id && (
                  <div className="absolute top-2 left-2 w-5 h-5 bg-[#F78309] rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                {ext.recommended && (
                  <Badge className={`absolute top-2 right-2 text-xs ${
                    configData.extension.id === ext.id ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    RECOMMENDED
                  </Badge>
                )}
                <h4 className="font-semibold text-sm mb-1 pl-6">{ext.name}</h4>
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
              {/* Pickup Option */}
              <button
                type="button"
                onClick={handleSelectPickup}
                className={`
                  relative w-full p-4 rounded-xl border-2 transition-all duration-300 text-left
                  hover:shadow-md
                  ${
                    configData.delivery.id === 'pickup'
                      ? 'border-[#F78309] bg-[#F78309]/5 ring-2 ring-[#F78309]/20'
                      : 'border-border bg-card hover:border-[#F78309]/50'
                  }
                `}
              >
                {/* Selection Checkmark */}
                {configData.delivery.id === 'pickup' && (
                  <div className="absolute top-3 left-3 w-5 h-5 bg-[#F78309] rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 pl-6">
                    <MapPin className="w-5 h-5 text-[#0B5394]" />
                    <h4 className="font-semibold">Pickup in Woodstock, GA</h4>
                  </div>
                  <p className="text-lg font-bold text-green-600">FREE</p>
                </div>
              </button>

              {/* Shipping Option */}
              <button
                type="button"
                onClick={() => {
                  // When clicking freight shipping, show the expanded form
                  if (configData.delivery.id === 'pickup') {
                    // Switch to ship mode (will show expanded form)
                    selectDelivery('ship', 'Freight Shipping', 0)
                  }
                }}
                disabled={showDeliveryWarning}
                className={`
                  relative w-full p-4 rounded-xl border-2 transition-all duration-300 text-left
                  hover:shadow-md
                  ${
                    configData.delivery.id === 'ship'
                      ? 'border-[#F78309] bg-[#F78309]/5 ring-2 ring-[#F78309]/20'
                      : 'border-border bg-card hover:border-[#F78309]/50'
                  }
                  ${showDeliveryWarning ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {/* Selection Checkmark */}
                {configData.delivery.id === 'ship' && (
                  <div className="absolute top-3 left-3 w-5 h-5 bg-[#F78309] rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 pl-6">
                    <Truck className="w-5 h-5 text-[#0B5394]" />
                    <h4 className="font-semibold">Freight Shipping</h4>
                  </div>
                  {isShippingSelected && shippingQuote?.success ? (
                    <p className="text-lg font-bold">${configData.delivery.price.toFixed(2)}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Get a quote</p>
                  )}
                </div>
              </button>

              {/* Expanded Shipping Form - Only visible when Freight Shipping is selected */}
              {configData.delivery.id === 'ship' && (
                <div className="p-4 rounded-xl border-2 border-[#0B5394]/30 bg-[#0B5394]/5 space-y-3 animate-in slide-in-from-top-2 duration-200">
                  {/* ZIP Code Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={zipInput}
                      onChange={(e) => setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      placeholder="Enter ZIP code"
                      disabled={showDeliveryWarning}
                      className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5394]/50"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleGetShippingQuote()
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleGetShippingQuote}
                      disabled={zipInput.length < 5 || isLoadingShipping || showDeliveryWarning}
                      className="bg-[#0B5394] hover:bg-[#0B5394]/90 text-white"
                    >
                      {isLoadingShipping ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Get Quote'
                      )}
                    </Button>
                  </div>

                  {/* Residential Toggle */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsResidential(true)}
                      disabled={showDeliveryWarning}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                        isResidential
                          ? 'bg-[#0B5394] text-white'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      <Home className="w-3.5 h-3.5" />
                      Residential
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsResidential(false)}
                      disabled={showDeliveryWarning}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                        !isResidential
                          ? 'bg-[#0B5394] text-white'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      Commercial
                    </button>
                  </div>

                  {/* Shipping Quote Result */}
                  {shippingQuote?.success && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800 dark:text-green-200">
                            Shipping to {shippingZip}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-green-700 dark:text-green-300">
                          ${configData.delivery.price.toFixed(2)}
                        </span>
                      </div>
                      {shippingQuote.transitDays && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Estimated transit: {shippingQuote.transitDays} business days
                        </p>
                      )}

                      {/* Destination Terminal Info */}
                      {shippingQuote.destinationTerminal && (
                        <div className="pt-2 border-t border-green-200 dark:border-green-700">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-green-800 dark:text-green-200">
                                Nearest {TFORCE_INFO.name} Terminal:
                              </p>
                              <p className="text-sm text-green-700 dark:text-green-300 font-semibold">
                                {shippingQuote.destinationTerminal.name}
                                {shippingQuote.destinationTerminal.code && (
                                  <span className="text-xs text-green-600 ml-1">
                                    ({shippingQuote.destinationTerminal.code})
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                Terminal support:{' '}
                                <a
                                  href={getPhoneLink(TFORCE_INFO.customerServiceRaw)}
                                  className="font-medium underline hover:no-underline"
                                >
                                  {TFORCE_INFO.customerService}
                                </a>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error Message */}
                  {shippingError && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                            {shippingError}
                          </p>
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            Call us for a shipping quote:{' '}
                            <a
                              href={getPhoneLink(CONTACT_INFO.phoneRaw)}
                              className="font-semibold underline hover:no-underline"
                            >
                              {CONTACT_INFO.phone}
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {showDeliveryWarning && (
              <div className="mt-3 bg-[#F78309]/10 border border-[#F78309] rounded-lg p-3 flex gap-2 text-sm">
                <Info className="w-4 h-4 text-[#F78309] shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
                  Shipping is not available with Demo service. Please select Not Assembled or Assembly Service.
                </p>
              </div>
            )}
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xl font-bold mb-2 pb-2 border-b border-[#0B5394]/30"><span className="text-[#0B5394]">Services</span></h3>
            <div className="space-y-3">
              {serviceOptions.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => selectService(service.id, service.name, service.price)}
                  className={`
                    relative w-full p-4 rounded-xl border-2 transition-all duration-300 text-left
                    hover:shadow-md
                    ${
                      configData.service.id === service.id
                        ? 'border-[#F78309] bg-[#F78309]/5 ring-2 ring-[#F78309]/20'
                        : 'border-border bg-card hover:border-[#F78309]/50'
                    }
                  `}
                >
                  {/* Selection Checkmark */}
                  {configData.service.id === service.id && (
                    <div className="absolute top-3 left-3 w-5 h-5 bg-[#F78309] rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold pl-6">{service.name}</h4>
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
              {boltlessKitOptions.map((kit) => (
                <button
                  key={kit.id}
                  type="button"
                  onClick={() => selectBoltlessKit(kit.id, kit.name, kit.price)}
                  className={`
                    relative w-full p-4 rounded-xl border-2 transition-all duration-300 text-left
                    hover:shadow-md
                    ${
                      configData.boltlessKit.id === kit.id
                        ? 'border-[#F78309] bg-[#F78309]/5 ring-2 ring-[#F78309]/20'
                        : 'border-border bg-card hover:border-[#F78309]/50'
                    }
                  `}
                >
                  {/* Selection Checkmark */}
                  {configData.boltlessKit.id === kit.id && (
                    <div className="absolute top-3 left-3 w-5 h-5 bg-[#F78309] rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold pl-6">{kit.name}</h4>
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
              {tiedownOptions.map((tiedown) => (
                <button
                  key={tiedown.id}
                  type="button"
                  onClick={() => selectTiedown(tiedown.id, tiedown.name, tiedown.price)}
                  className={`
                    relative w-full p-4 rounded-xl border-2 transition-all duration-300 text-left
                    hover:shadow-md
                    ${
                      configData.tiedown.id === tiedown.id
                        ? 'border-[#F78309] bg-[#F78309]/5 ring-2 ring-[#F78309]/20'
                        : 'border-border bg-card hover:border-[#F78309]/50'
                    }
                  `}
                >
                  {/* Selection Checkmark */}
                  {configData.tiedown.id === tiedown.id && (
                    <div className="absolute top-3 left-3 w-5 h-5 bg-[#F78309] rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {tiedown.recommended && (
                    <Badge className={`absolute top-2 right-2 text-xs ${
                      configData.tiedown.id === tiedown.id ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      RECOMMENDED
                    </Badge>
                  )}
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-sm pl-6">{tiedown.name}</h4>
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
