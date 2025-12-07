'use client'

import React, { useState } from 'react'
import { useConfigurator } from './ConfiguratorProvider'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/components/ui/toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'

export function ContactModal() {
  const { showContactModal, setShowContactModal, updateContact, configData, pendingAction, setPendingAction, executeEmailQuote, executePrintQuote } = useConfigurator()
  const { addItem, openCart } = useCart()
  const { showToast } = useToast()

  const [firstName, setFirstName] = useState(configData.contact.firstName || '')
  const [lastName, setLastName] = useState(configData.contact.lastName || '')
  const [email, setEmail] = useState(configData.contact.email || '')
  const [phone, setPhone] = useState(configData.contact.phone || '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}

    // Validate required fields
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Save contact info
    updateContact({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
    })

    // Close modal
    setShowContactModal(false)

    // Execute pending action
    if (pendingAction === 'cart') {
      // Automatically add items to cart
      addItemsToCart()
    } else if (pendingAction === 'email') {
      // Automatically send email quote
      executeEmailQuote().then((result) => {
        if (result.success) {
          showToast(result.message, 'success', 'Quote Sent Successfully!')
        } else {
          showToast(result.message, 'error', 'Failed to Send Email')
        }
      })
    } else if (pendingAction === 'print') {
      // Automatically generate PDF
      const result = executePrintQuote()
      if (result.success) {
        showToast(result.message, 'success', 'PDF Quote Generated!')
      } else {
        showToast(result.message, 'error', 'Failed to Generate PDF')
      }
    }

    setPendingAction(null)
  }

  // Function to add all configured items to cart
  const addItemsToCart = async () => {
    // Save configuration to database (don't block cart addition)
    try {
      await fetch('/api/configurator/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configuration: configData,
          total: 0, // We'll calculate the total from items
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
      productSlug: configData.selectedModel.id.toLowerCase(),
      productImage: null,
      price: configData.selectedModel.price,
      sku: configData.selectedModel.id,
    })

    // Add extension if selected
    if (configData.extension.price > 0) {
      itemsToAdd.push({
        productId: configData.extension.id,
        productName: configData.extension.name,
        productSlug: configData.extension.id,
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

  const handleClose = () => {
    setShowContactModal(false)
    setPendingAction(null)
  }

  return (
    <Dialog open={showContactModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Contact Information Required</DialogTitle>
          <DialogDescription>
            Please provide your contact information to continue. This helps us process your request and keep you updated.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* First Name */}
          <div>
            <Label htmlFor="modal-firstName">
              First Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="modal-firstName"
              type="text"
              placeholder="John"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value)
                if (errors.firstName) {
                  setErrors((prev) => {
                    const newErrors = { ...prev }
                    delete newErrors.firstName
                    return newErrors
                  })
                }
              }}
              className={`mt-1.5 ${errors.firstName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
            {errors.firstName && (
              <p className="text-sm text-destructive mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.firstName}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <Label htmlFor="modal-lastName">
              Last Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="modal-lastName"
              type="text"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value)
                if (errors.lastName) {
                  setErrors((prev) => {
                    const newErrors = { ...prev }
                    delete newErrors.lastName
                    return newErrors
                  })
                }
              }}
              className={`mt-1.5 ${errors.lastName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
            {errors.lastName && (
              <p className="text-sm text-destructive mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.lastName}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="modal-email">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="modal-email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) {
                  setErrors((prev) => {
                    const newErrors = { ...prev }
                    delete newErrors.email
                    return newErrors
                  })
                }
              }}
              className={`mt-1.5 ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone (Optional) */}
          <div>
            <Label htmlFor="modal-phone">Phone Number (Optional)</Label>
            <Input
              id="modal-phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1.5"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#0B5394] hover:bg-[#0B5394]/90 text-white"
            >
              Save & Continue
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
