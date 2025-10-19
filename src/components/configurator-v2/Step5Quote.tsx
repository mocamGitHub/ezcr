'use client'

import React, { useState } from 'react'
import { useConfigurator } from './ConfiguratorProvider'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/button'
import { FEES, CONTACT } from '@/types/configurator-v2'
import { ShoppingCart, Phone, Mail, Printer, Share2, Check, Copy } from 'lucide-react'
import { generateQuotePDF } from '@/lib/utils/pdf-quote'

export function Step5Quote() {
  const { configData, units, previousStep, setShowContactModal, setPendingAction, saveConfiguration, savedConfigId } = useConfigurator()
  const { addItem } = useCart()
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

    // Build configuration description for cart
    const configItems = [
      configData.selectedModel.name,
      configData.extension.price > 0 ? configData.extension.name : null,
      configData.boltlessKit.price > 0 ? configData.boltlessKit.name : null,
      configData.tiedown.price > 0 ? configData.tiedown.name : null,
      configData.service.price > 0 ? configData.service.name : null,
      configData.delivery.price > 0 ? configData.delivery.name : null,
    ].filter(Boolean)

    const productName = `Custom Configuration - ${configData.selectedModel.name}`
    const productDescription = configItems.join(' + ')

    // Save configuration to database
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
      // Don't block cart addition if save fails
    }

    // Add configured product to cart
    addItem({
      productId: `config-${Date.now()}`, // Unique ID for custom configuration
      productName,
      productSlug: 'custom-configuration',
      productImage: null,
      price: total,
      sku: `CONFIG-${configData.selectedModel.id}-${configData.vehicle?.toUpperCase() || 'UNKNOWN'}`,
    })

    // Show success message
    alert(`✓ Configuration added to cart!\n\n${productDescription}\n\nTotal: $${total.toFixed(2)}`)
  }

  const handleEmailQuote = async () => {
    if (!hasContactInfo) {
      setPendingAction('email')
      setShowContactModal(true)
      return
    }

    try {
      const response = await fetch('/api/quote/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: configData.contact.email,
          firstName: configData.contact.firstName,
          lastName: configData.contact.lastName,
          vehicle: configData.vehicle,
          measurements: configData.measurements,
          motorcycle: configData.motorcycle,
          selectedModel: configData.selectedModel,
          extension: configData.extension,
          boltlessKit: configData.boltlessKit,
          tiedown: configData.tiedown,
          service: configData.service,
          delivery: configData.delivery,
          subtotal,
          salesTax,
          processingFee,
          total,
        }),
      })

      if (response.ok) {
        alert(`✓ Quote successfully sent to ${configData.contact.email}!\n\nPlease check your inbox.`)
      } else {
        const error = await response.json()
        alert(`✗ Failed to send email: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error sending email:', error)
      alert('✗ Failed to send email. Please try again or call us at 800-687-4410.')
    }
  }

  const handlePrintQuote = () => {
    if (!hasContactInfo) {
      setPendingAction('print')
      setShowContactModal(true)
      return
    }

    try {
      generateQuotePDF({
        contact: {
          firstName: configData.contact.firstName || '',
          lastName: configData.contact.lastName || '',
          email: configData.contact.email || '',
          phone: configData.contact.phone,
        },
        vehicle: configData.vehicle || '',
        measurements: configData.measurements,
        motorcycle: configData.motorcycle,
        selectedModel: configData.selectedModel,
        extension: configData.extension,
        boltlessKit: configData.boltlessKit,
        tiedown: configData.tiedown,
        service: configData.service,
        delivery: configData.delivery,
        subtotal,
        salesTax,
        processingFee,
        total,
      })
      alert('✓ PDF quote generated successfully!\n\nCheck your downloads folder.')
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('✗ Failed to generate PDF. Please try again or email us for a quote.')
    }
  }

  const handleShare = async () => {
    try {
      // Save configuration first if not already saved
      let configId = savedConfigId
      if (!configId) {
        const result = await saveConfiguration(true)
        if (!result.success || !result.id) {
          alert('Failed to generate share link')
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
      alert('Failed to generate share link')
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">Your Custom Quote</h2>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Review your configuration and pricing below. When you&apos;re ready, add to cart or contact us for assistance.
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-xl font-semibold mb-4">Customer Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {configData.contact.firstName || configData.contact.lastName
                      ? `${configData.contact.firstName} ${configData.contact.lastName}`.trim()
                      : 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{configData.contact.email || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{configData.contact.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Shipping Address</p>
                  <p className="font-medium text-muted-foreground">To be provided</p>
                </div>
              </div>
            </div>

            {/* Vehicle & Motorcycle Details */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-xl font-semibold mb-4">Vehicle & Motorcycle Details</h3>
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
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-xl font-semibold mb-4">Selected Configuration</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="font-medium">{configData.selectedModel.name}</span>
                  <span className="font-bold">${configData.selectedModel.price.toFixed(2)}</span>
                </div>
                {configData.extension.price > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="font-medium">{configData.extension.name}</span>
                    <span className="font-bold">${configData.extension.price.toFixed(2)}</span>
                  </div>
                )}
                {configData.boltlessKit.price > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="font-medium">{configData.boltlessKit.name}</span>
                    <span className="font-bold">${configData.boltlessKit.price.toFixed(2)}</span>
                  </div>
                )}
                {configData.tiedown.price > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="font-medium">{configData.tiedown.name}</span>
                    <span className="font-bold">${configData.tiedown.price.toFixed(2)}</span>
                  </div>
                )}
                {configData.service.price > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="font-medium">{configData.service.name}</span>
                    <span className="font-bold">${configData.service.price.toFixed(2)}</span>
                  </div>
                )}
                {configData.delivery.price > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="font-medium">{configData.delivery.name}</span>
                    <span className="font-bold">${configData.delivery.price.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Quote Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl p-6 border border-border sticky top-24">
              <h3 className="text-xl font-semibold mb-6">Quote Summary</h3>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sales Tax (8.9%)</span>
                  <span className="font-medium">${salesTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Processing (3%)</span>
                  <span className="font-medium">${processingFee.toFixed(2)}</span>
                </div>
                <div className="h-px bg-border my-3" />
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-2xl">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-secondary hover:bg-secondary-dark text-white gap-2"
                  size="lg"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </Button>

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
        <div className="flex justify-between items-center pt-8">
          <Button
            type="button"
            onClick={previousStep}
            variant="outline"
            className="rounded-full"
          >
            Previous
          </Button>

          <Button
            onClick={handleAddToCart}
            className="rounded-full bg-success hover:bg-success-dark text-white px-8"
          >
            Complete Configuration
          </Button>
        </div>
      </div>
    </div>
  )
}
