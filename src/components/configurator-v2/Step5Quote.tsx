'use client'

import React, { useState } from 'react'
import { useConfigurator } from './ConfiguratorProvider'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { AnimatedCTAActionButton } from '@/components/ui/animated-cta-button'
import { FEES, CONTACT } from '@/types/configurator-v2'
import { Phone, Mail, Printer, Share2, Check, Copy } from 'lucide-react'

// Format currency with thousand separators
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function Step5Quote() {
  const { configData, units, previousStep, setShowContactModal, setPendingAction, saveConfiguration, savedConfigId, executeEmailQuote, executePrintQuote } = useConfigurator()
  const { addItem, openCart } = useCart()
  const { showToast } = useToast()
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)

  const weightUnit = units === 'imperial' ? 'lbs' : 'kg'
  const lengthUnit = units === 'imperial' ? 'inches' : 'cm'

  // Calculate totals
  const subtotal =
    configData.selectedModel.price +
    configData.extension.price +
    configData.boltlessKit.price +
    configData.tiedown.price +
    configData.service.price +
    configData.delivery.price

  const salesTax = subtotal * FEES.salesTaxRate
  const processingFee = subtotal * FEES.processingFeeRate
  const total = subtotal + salesTax + processingFee

  // Check if contact info is complete
  const hasContactInfo = !!(
    configData.contact.firstName &&
    configData.contact.lastName &&
    configData.contact.email
  )

  // Handle actions
  const handleAddToCart = async () => {
    if (!hasContactInfo) {
      setPendingAction('cart')
      setShowContactModal(true)
      return
    }

    // Save configuration to database (don't block cart addition)
    try {
      await fetch('/api/configurator/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configuration: configData,
          total,
        }),
      })
    } catch (error) {
      console.error('Error saving configuration:', error)
    }

    // Build list of items to add to cart
    const itemsToAdd: Array<{
      productId: string
      productName: string
      productSlug: string
      productImage: string | null
      price: number
      sku: string
    }> = []

    // Add the main ramp model
    itemsToAdd.push({
      productId: configData.selectedModel.id,
      productName: configData.selectedModel.name,
      productSlug: configData.selectedModel.id.toLowerCase(), // e.g., 'aun250'
      productImage: null,
      price: configData.selectedModel.price,
      sku: configData.selectedModel.id,
    })

    // Add extension if selected
    if (configData.extension.price > 0) {
      itemsToAdd.push({
        productId: configData.extension.id,
        productName: configData.extension.name,
        productSlug: configData.extension.id, // e.g., 'ext1'
        productImage: null,
        price: configData.extension.price,
        sku: configData.extension.id.toUpperCase(),
      })
    }

    // Add boltless kit if selected
    if (configData.boltlessKit.price > 0) {
      itemsToAdd.push({
        productId: configData.boltlessKit.id,
        productName: configData.boltlessKit.name,
        productSlug: configData.boltlessKit.id,
        productImage: null,
        price: configData.boltlessKit.price,
        sku: 'BOLTLESS-KIT',
      })
    }

    // Add tiedown if selected
    if (configData.tiedown.price > 0) {
      itemsToAdd.push({
        productId: configData.tiedown.id,
        productName: configData.tiedown.name,
        productSlug: configData.tiedown.id,
        productImage: null,
        price: configData.tiedown.price,
        sku: configData.tiedown.id.toUpperCase(),
      })
    }

    // Add service if selected
    if (configData.service.price > 0) {
      itemsToAdd.push({
        productId: configData.service.id,
        productName: configData.service.name,
        productSlug: configData.service.id,
        productImage: null,
        price: configData.service.price,
        sku: configData.service.id.toUpperCase(),
      })
    }

    // Add delivery if selected (shipping)
    if (configData.delivery.price > 0) {
      itemsToAdd.push({
        productId: configData.delivery.id,
        productName: configData.delivery.name,
        productSlug: configData.delivery.id,
        productImage: null,
        price: configData.delivery.price,
        sku: 'SHIPPING',
      })
    }

    // Add each item to the cart
    itemsToAdd.forEach((item) => {
      addItem(item)
    })

    // Build summary for toast
    const itemNames = itemsToAdd.map((item) => item.productName)

    // Show success toast and open cart
    showToast(
      `${itemNames.join(', ')}\n\n${itemsToAdd.length} item(s) added`,
      'success',
      'Items Added to Cart!'
    )

    // Open the cart drawer after a brief delay
    setTimeout(() => openCart(), 300)
  }

  const handleEmailQuote = async () => {
    if (!hasContactInfo) {
      setPendingAction('email')
      setShowContactModal(true)
      return
    }

    const result = await executeEmailQuote()
    if (result.success) {
      showToast(`Please check your inbox at ${configData.contact.email}`, 'success', 'Quote Sent Successfully!')
    } else {
      showToast(result.message || 'Please try again or call us at 800-687-4410', 'error', 'Failed to Send Email')
    }
  }

  const handlePrintQuote = () => {
    if (!hasContactInfo) {
      setPendingAction('print')
      setShowContactModal(true)
      return
    }

    const result = executePrintQuote()
    if (result.success) {
      showToast('Check your downloads folder for the PDF', 'success', 'PDF Quote Generated!')
    } else {
      showToast(result.message || 'Please try again or email us for a quote', 'error', 'Failed to Generate PDF')
    }
  }

  const handleShare = async () => {
    try {
      // Save configuration first if not already saved
      let configId = savedConfigId
      if (!configId) {
        const result = await saveConfiguration(true)
        if (!result.success || !result.id) {
          showToast('Unable to create shareable link', 'error', 'Failed to Generate Share Link')
          return
        }
        configId = result.id
      }

      // Generate share link
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const link = `${baseUrl}/configure?load=${configId}`
      setShareLink(link)
      setShowShareDialog(true)
    } catch (error) {
      console.error('Error generating share link:', error)
      showToast('Unable to create shareable link', 'error', 'Failed to Generate Share Link')
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle & Motorcycle Details */}
            <div className="bg-card rounded-xl p-6 border border-[hsl(var(--secondary)/30%)]">
              <h3 className="text-xl font-semibold mb-4">Vehicle & <span className="text-[hsl(var(--secondary))]">Motorcycle</span> Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                {configData.vehicle === 'pickup' && (
                  <div>
                    <p className="text-sm text-muted-foreground">Total Length (Open)</p>
                    <p className="font-medium">
                      {configData.measurements.bedLengthOpen?.toFixed(1)} {lengthUnit}
                    </p>
                  </div>
                )}
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
              </div>
            </div>

            {/* Selected Configuration */}
            <div className="bg-card rounded-xl p-6 border border-[hsl(var(--primary)/30%)]">
              <h3 className="text-xl font-semibold mb-4">Selected <span className="text-[hsl(var(--primary))]">Configuration</span></h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="font-medium">{configData.selectedModel.name}</span>
                  <span className="font-bold">${formatCurrency(configData.selectedModel.price)}</span>
                </div>
                {configData.extension.price > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="font-medium">{configData.extension.name}</span>
                    <span className="font-bold">${formatCurrency(configData.extension.price)}</span>
                  </div>
                )}
                {configData.boltlessKit.price > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="font-medium">{configData.boltlessKit.name}</span>
                    <span className="font-bold">${formatCurrency(configData.boltlessKit.price)}</span>
                  </div>
                )}
                {configData.tiedown.price > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="font-medium">{configData.tiedown.name}</span>
                    <span className="font-bold">${formatCurrency(configData.tiedown.price)}</span>
                  </div>
                )}
                {configData.service.price > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="font-medium">{configData.service.name}</span>
                    <span className="font-bold">${formatCurrency(configData.service.price)}</span>
                  </div>
                )}
                {configData.delivery.price > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="font-medium">{configData.delivery.name}</span>
                    <span className="font-bold">${formatCurrency(configData.delivery.price)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Quote Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl p-6 border-2 border-[hsl(var(--secondary))] sticky top-24">
              <h3 className="text-xl font-semibold mb-6 text-[hsl(var(--secondary))]">Quote Summary</h3>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sales Tax (8.9%)</span>
                  <span className="font-medium">${formatCurrency(salesTax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Processing (3%)</span>
                  <span className="font-medium">${formatCurrency(processingFee)}</span>
                </div>
                <div className="h-px bg-border my-3" />
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-2xl text-[hsl(var(--secondary))]">${formatCurrency(total)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <AnimatedCTAActionButton
                  onClick={handleAddToCart}
                  icon="cart"
                  className="w-full"
                  variant="orange"
                >
                  Add to Cart
                </AnimatedCTAActionButton>

                <Button
                  onClick={() => window.location.href = `tel:${CONTACT.phone}`}
                  variant="outline"
                  className="w-full border-secondary text-secondary hover:bg-secondary/10 gap-2"
                  size="lg"
                >
                  <Phone className="w-5 h-5" />
                  Call {CONTACT.phone}
                </Button>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={handleEmailQuote}
                    variant="secondary"
                    className="gap-1 text-xs"
                  >
                    <Mail className="w-3 h-3" />
                    Email
                  </Button>
                  <Button
                    onClick={handlePrintQuote}
                    variant="secondary"
                    className="gap-1 text-xs"
                  >
                    <Printer className="w-3 h-3" />
                    Print
                  </Button>
                  <Button
                    onClick={handleShare}
                    variant="secondary"
                    className="gap-1 text-xs"
                  >
                    <Share2 className="w-3 h-3" />
                    Share
                  </Button>
                </div>
              </div>

              {!hasContactInfo && (
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Contact information will be required to complete your order
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Share Dialog */}
        {showShareDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl p-6 max-w-md w-full border border-border">
              <h3 className="text-xl font-semibold mb-4">Share Configuration</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Copy this link to share your configuration with others:
              </p>

              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-muted rounded border border-border text-sm"
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button onClick={handleCopyLink} className="gap-2">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setShowShareDialog(false)}
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-start items-center pt-8">
          <Button
            type="button"
            onClick={previousStep}
            variant="outline"
            className="rounded-full"
          >
            Previous
          </Button>
        </div>
      </div>
    </div>
  )
}
