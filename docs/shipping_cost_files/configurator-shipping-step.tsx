// ============================================
// CONFIGURATOR SHIPPING STEP COMPONENT
// React/TypeScript + Tailwind CSS
// ============================================
// 
// Usage:
//   <ConfiguratorShippingStep
//     productSku="AUN250"
//     onQuoteReceived={(quote) => console.log(quote)}
//     onDeliveryMethodChange={(method) => console.log(method)}
//   />

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// TYPES
// ============================================

export type DeliveryMethod = 'shipping' | 'pickup';

export interface ShippingQuote {
  quoteId: string;
  baseRate: number;
  residentialSurcharge: number;
  totalRate: number;
  originTerminal?: {
    code: string;
    name: string;
  };
  destinationTerminal?: {
    code: string;
    name: string;
  };
  transitDays?: number;
  validUntil: string;
}

export interface ShippingAddress {
  streetAddress: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  isResidential: boolean;
}

interface ConfiguratorShippingStepProps {
  productSku: 'AUN200' | 'AUN250';
  initialDeliveryMethod?: DeliveryMethod;
  initialAddress?: Partial<ShippingAddress>;
  leadId?: string;
  sessionId?: string;
  supabaseUrl?: string;
  onQuoteReceived?: (quote: ShippingQuote) => void;
  onDeliveryMethodChange?: (method: DeliveryMethod) => void;
  onAddressChange?: (address: ShippingAddress) => void;
  className?: string;
}

// ============================================
// CONSTANTS
// ============================================

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
];

const PICKUP_LOCATION = {
  name: 'T-Force Atlanta Terminal',
  address: '2500 Continental Blvd',
  city: 'Woodstock',
  state: 'GA',
  zip: '30188',
  hours: 'Mon-Fri 8am-5pm',
  phone: '(937) 725-6790',
};

// API endpoint (adjust based on your Supabase setup)
const DEFAULT_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SHIPPING_QUOTE_ENDPOINT = '/functions/v1/get-shipping-quote';

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const validateZipCode = (zip: string): boolean => {
  return /^\d{5}(-\d{4})?$/.test(zip);
};

// ============================================
// COMPONENT
// ============================================

export function ConfiguratorShippingStep({
  productSku,
  initialDeliveryMethod = 'shipping',
  initialAddress,
  leadId,
  sessionId,
  supabaseUrl = DEFAULT_SUPABASE_URL,
  onQuoteReceived,
  onDeliveryMethodChange,
  onAddressChange,
  className = '',
}: ConfiguratorShippingStepProps) {
  // State
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(initialDeliveryMethod);
  const [address, setAddress] = useState<ShippingAddress>({
    streetAddress: initialAddress?.streetAddress || '',
    apartment: initialAddress?.apartment || '',
    city: initialAddress?.city || '',
    state: initialAddress?.state || '',
    zipCode: initialAddress?.zipCode || '',
    isResidential: initialAddress?.isResidential ?? true,
  });
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResidentialUpgrade, setShowResidentialUpgrade] = useState(false);
  
  // Handle delivery method change
  const handleDeliveryMethodChange = useCallback((method: DeliveryMethod) => {
    setDeliveryMethod(method);
    setQuote(null);
    setError(null);
    onDeliveryMethodChange?.(method);
  }, [onDeliveryMethodChange]);
  
  // Handle address field changes
  const handleAddressChange = useCallback((field: keyof ShippingAddress, value: string | boolean) => {
    setAddress(prev => {
      const updated = { ...prev, [field]: value };
      onAddressChange?.(updated);
      return updated;
    });
    // Clear quote when address changes
    if (field === 'zipCode' || field === 'isResidential') {
      setQuote(null);
    }
  }, [onAddressChange]);
  
  // Fetch shipping quote
  const fetchQuote = useCallback(async () => {
    if (!validateZipCode(address.zipCode)) {
      setError('Please enter a valid ZIP code');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${supabaseUrl}${SHIPPING_QUOTE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destinationZip: address.zipCode,
          destinationCity: address.city || undefined,
          destinationState: address.state || undefined,
          productSku,
          isResidential: address.isResidential,
          source: 'configurator',
          leadId,
          sessionId,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setError(data.error?.userMessage || 'Unable to calculate shipping. Please call (937) 725-6790.');
        return;
      }
      
      const newQuote: ShippingQuote = {
        quoteId: data.quoteId,
        baseRate: data.baseRate,
        residentialSurcharge: data.residentialSurcharge,
        totalRate: data.totalRate,
        originTerminal: data.originTerminal,
        destinationTerminal: data.destinationTerminal,
        transitDays: data.transitDays,
        validUntil: data.validUntil,
      };
      
      setQuote(newQuote);
      setShowResidentialUpgrade(!address.isResidential);
      onQuoteReceived?.(newQuote);
      
    } catch (err) {
      console.error('Shipping quote error:', err);
      setError('Unable to calculate shipping. Please call (937) 725-6790 for a quote.');
    } finally {
      setIsLoading(false);
    }
  }, [address, productSku, leadId, sessionId, supabaseUrl, onQuoteReceived]);
  
  // Toggle residential delivery
  const handleResidentialToggle = useCallback(async () => {
    const newIsResidential = !address.isResidential;
    handleAddressChange('isResidential', newIsResidential);
    
    // Re-fetch quote with new residential setting
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${supabaseUrl}${SHIPPING_QUOTE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destinationZip: address.zipCode,
          destinationCity: address.city || undefined,
          destinationState: address.state || undefined,
          productSku,
          isResidential: newIsResidential,
          source: 'configurator',
          leadId,
          sessionId,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        const newQuote: ShippingQuote = {
          quoteId: data.quoteId,
          baseRate: data.baseRate,
          residentialSurcharge: data.residentialSurcharge,
          totalRate: data.totalRate,
          originTerminal: data.originTerminal,
          destinationTerminal: data.destinationTerminal,
          transitDays: data.transitDays,
          validUntil: data.validUntil,
        };
        setQuote(newQuote);
        onQuoteReceived?.(newQuote);
      }
    } catch (err) {
      console.error('Error updating quote:', err);
    } finally {
      setIsLoading(false);
    }
  }, [address, productSku, leadId, sessionId, supabaseUrl, handleAddressChange, onQuoteReceived]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Delivery Method Selection */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-3">
          How will you receive your ramp?
        </label>
        <div className="grid grid-cols-2 gap-3">
          {/* Shipping Option */}
          <button
            type="button"
            onClick={() => handleDeliveryMethodChange('shipping')}
            className={`
              relative p-4 rounded-lg border-2 text-left transition-all
              ${deliveryMethod === 'shipping'
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📦</span>
              <div>
                <p className="font-semibold text-white">Ship to Me</p>
                <p className="text-xs text-zinc-400">Freight delivery</p>
              </div>
            </div>
            {deliveryMethod === 'shipping' && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
          
          {/* Pickup Option */}
          <button
            type="button"
            onClick={() => handleDeliveryMethodChange('pickup')}
            className={`
              relative p-4 rounded-lg border-2 text-left transition-all
              ${deliveryMethod === 'pickup'
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏭</span>
              <div>
                <p className="font-semibold text-white">Pick Up</p>
                <p className="text-xs text-zinc-400">Save on shipping</p>
              </div>
            </div>
            {deliveryMethod === 'pickup' && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        </div>
      </div>
      
      {/* Shipping Address Form */}
      <AnimatePresence mode="wait">
        {deliveryMethod === 'shipping' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 space-y-4">
              <h4 className="font-medium text-white flex items-center gap-2">
                <span>📍</span> Shipping Address
              </h4>
              
              {/* Quick Quote - ZIP Only */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-zinc-400 mb-1">ZIP Code *</label>
                  <input
                    type="text"
                    value={address.zipCode}
                    onChange={(e) => handleAddressChange('zipCode', e.target.value.replace(/[^\d-]/g, '').slice(0, 10))}
                    placeholder="90210"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                    maxLength={10}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={fetchQuote}
                    disabled={isLoading || !address.zipCode}
                    className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-600 disabled:cursor-not-allowed text-black font-semibold rounded-md transition-colors"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </span>
                    ) : 'Quote'}
                  </button>
                </div>
              </div>
              
              {/* Optional: Full Address (for checkout integration) */}
              <details className="group">
                <summary className="text-xs text-zinc-400 cursor-pointer hover:text-zinc-300 flex items-center gap-1">
                  <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  Add full address (optional, saves time at checkout)
                </summary>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={address.streetAddress}
                      onChange={(e) => handleAddressChange('streetAddress', e.target.value)}
                      placeholder="123 Main Street"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">City</label>
                      <input
                        type="text"
                        value={address.city}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                        placeholder="Los Angeles"
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">State</label>
                      <select
                        value={address.state}
                        onChange={(e) => handleAddressChange('state', e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded-md text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="">Select...</option>
                        {US_STATES.map(state => (
                          <option key={state.code} value={state.code}>{state.code}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </details>
              
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/10 border border-red-500/30 rounded-md"
                >
                  <p className="text-sm text-red-400">{error}</p>
                  <p className="text-xs text-red-400/70 mt-1">
                    Need help? Call <a href="tel:+19377256790" className="underline">(937) 725-6790</a>
                  </p>
                </motion.div>
              )}
              
              {/* Quote Result */}
              {quote && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-zinc-900 rounded-lg border border-zinc-600"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-white flex items-center gap-2">
                      <span className="text-green-500">✓</span> Shipping Quote
                    </h5>
                    <span className="text-xs text-zinc-500">
                      Valid for 24 hours
                    </span>
                  </div>
                  
                  {/* Terminal-to-Terminal Rate */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Terminal-to-Terminal:</span>
                      <span className="text-xl font-bold text-white">
                        {formatCurrency(quote.baseRate)}
                      </span>
                    </div>
                    
                    {quote.destinationTerminal && (
                      <div className="text-xs text-zinc-500 pl-4 border-l-2 border-zinc-700">
                        <p className="flex items-center gap-1">
                          <span>📍</span> Pickup at: <strong className="text-zinc-300">{quote.destinationTerminal.name}</strong>
                        </p>
                      </div>
                    )}
                    
                    {quote.transitDays && (
                      <p className="text-xs text-zinc-500">
                        Estimated transit: {quote.transitDays} business days
                      </p>
                    )}
                  </div>
                  
                  {/* Residential Delivery Upgrade */}
                  <div className="border-t border-zinc-700 pt-3">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={address.isResidential}
                        onChange={handleResidentialToggle}
                        disabled={isLoading}
                        className="mt-1 w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white group-hover:text-amber-400 transition-colors">
                            Add residential delivery
                          </span>
                          <span className="text-amber-400 font-medium">
                            +{formatCurrency(150)}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Deliver directly to your home with liftgate service
                        </p>
                      </div>
                    </label>
                    
                    {address.isResidential && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 p-3 bg-amber-500/10 rounded-md border border-amber-500/30"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-amber-400 font-medium">Total with delivery:</span>
                          <span className="text-2xl font-bold text-amber-400">
                            {formatCurrency(quote.totalRate)}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
        
        {/* Pickup Location Info */}
        {deliveryMethod === 'pickup' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <h4 className="font-medium text-white flex items-center gap-2 mb-3">
                <span>🏭</span> Pickup Location
              </h4>
              
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-md mb-4">
                <p className="text-green-400 font-medium text-lg">
                  FREE - Save on shipping!
                </p>
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="text-white font-medium">{PICKUP_LOCATION.name}</p>
                <p className="text-zinc-400">{PICKUP_LOCATION.address}</p>
                <p className="text-zinc-400">
                  {PICKUP_LOCATION.city}, {PICKUP_LOCATION.state} {PICKUP_LOCATION.zip}
                </p>
                <p className="text-zinc-500 text-xs mt-2">
                  <strong>Hours:</strong> {PICKUP_LOCATION.hours}
                </p>
                <p className="text-zinc-500 text-xs">
                  <strong>Call ahead:</strong>{' '}
                  <a href={`tel:${PICKUP_LOCATION.phone.replace(/[^\d]/g, '')}`} className="text-amber-500 hover:underline">
                    {PICKUP_LOCATION.phone}
                  </a>
                </p>
              </div>
              
              <p className="text-xs text-zinc-500 mt-4 pt-3 border-t border-zinc-700">
                💡 We'll notify you when your ramp is ready for pickup. Typical lead time is 3-5 business days.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Shipping Not Included Warning (when no quote yet) */}
      {deliveryMethod === 'shipping' && !quote && !isLoading && (
        <p className="text-xs text-amber-500/70 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Shipping costs not yet included. Enter your ZIP to get a quote.
        </p>
      )}
    </div>
  );
}

export default ConfiguratorShippingStep;
