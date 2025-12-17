// ============================================
// CHECKOUT SHIPPING SECTION COMPONENT
// For platform checkout page integration
// ============================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// TYPES
// ============================================

export interface ShippingQuote {
  quoteId: string;
  baseRate: number;
  residentialSurcharge: number;
  totalRate: number;
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

export type DeliveryMethod = 'shipping' | 'pickup';

interface CheckoutShippingSectionProps {
  productSku: 'AUN200' | 'AUN250';
  initialDeliveryMethod?: DeliveryMethod;
  initialAddress?: Partial<ShippingAddress>;
  initialQuote?: ShippingQuote;
  sessionId: string;
  supabaseUrl: string;
  onShippingChange: (data: {
    deliveryMethod: DeliveryMethod;
    quote: ShippingQuote | null;
    address: ShippingAddress | null;
    shippingCost: number;
  }) => void;
  onValidationChange: (isValid: boolean) => void;
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
  name: 'EZ Cycle Ramp Warehouse',
  address: '2500 Continental Blvd',
  city: 'Woodstock',
  state: 'GA',
  zip: '30188',
  hours: 'Mon-Fri 8am-5pm',
  phone: '(937) 725-6790',
};

const RESIDENTIAL_SURCHARGE = 150;

// ============================================
// HELPERS
// ============================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const isQuoteValid = (quote: ShippingQuote): boolean => {
  return new Date(quote.validUntil) > new Date();
};

// ============================================
// COMPONENT
// ============================================

export function CheckoutShippingSection({
  productSku,
  initialDeliveryMethod = 'shipping',
  initialAddress,
  initialQuote,
  sessionId,
  supabaseUrl,
  onShippingChange,
  onValidationChange,
  className = '',
}: CheckoutShippingSectionProps) {
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
  const [quote, setQuote] = useState<ShippingQuote | null>(initialQuote || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressModified, setAddressModified] = useState(false);
  
  // Validation
  const isAddressComplete = address.streetAddress && address.city && address.state && address.zipCode;
  const isShippingValid = deliveryMethod === 'pickup' || (deliveryMethod === 'shipping' && quote && isQuoteValid(quote) && isAddressComplete);
  
  // Notify parent of validation changes
  useEffect(() => {
    onValidationChange(isShippingValid);
  }, [isShippingValid, onValidationChange]);
  
  // Notify parent of shipping changes
  useEffect(() => {
    onShippingChange({
      deliveryMethod,
      quote,
      address: deliveryMethod === 'shipping' ? address : null,
      shippingCost: deliveryMethod === 'pickup' ? 0 : (quote?.totalRate || 0),
    });
  }, [deliveryMethod, quote, address, onShippingChange]);
  
  // Check if initial quote is expired
  useEffect(() => {
    if (initialQuote && !isQuoteValid(initialQuote)) {
      setError('Your shipping quote has expired. Please recalculate.');
      setQuote(null);
    }
  }, [initialQuote]);
  
  // Fetch shipping quote
  const fetchQuote = useCallback(async (isResidential?: boolean) => {
    if (!address.zipCode || address.zipCode.length < 5) {
      setError('Please enter a valid ZIP code');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/get-shipping-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationZip: address.zipCode,
          destinationCity: address.city || undefined,
          destinationState: address.state || undefined,
          productSku,
          isResidential: isResidential ?? address.isResidential,
          source: 'checkout',
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
          destinationTerminal: data.destinationTerminal,
          transitDays: data.transitDays,
          validUntil: data.validUntil,
        };
        setQuote(newQuote);
        setAddressModified(false);
      } else {
        setError(data.error?.userMessage || 'Unable to calculate shipping');
        setQuote(null);
      }
    } catch (err) {
      console.error('Shipping quote error:', err);
      setError('Unable to calculate shipping. Please try again or call (937) 725-6790.');
      setQuote(null);
    } finally {
      setIsLoading(false);
    }
  }, [address, productSku, sessionId, supabaseUrl]);
  
  // Handle address field changes
  const handleAddressChange = (field: keyof ShippingAddress, value: string | boolean) => {
    setAddress(prev => ({ ...prev, [field]: value }));
    if (field !== 'isResidential') {
      setAddressModified(true);
    }
  };
  
  // Handle residential toggle
  const handleResidentialToggle = async (checked: boolean) => {
    handleAddressChange('isResidential', checked);
    if (quote) {
      // Re-fetch with new residential status
      await fetchQuote(checked);
    }
  };
  
  // Handle delivery method change
  const handleDeliveryMethodChange = (method: DeliveryMethod) => {
    setDeliveryMethod(method);
    if (method === 'pickup') {
      setError(null);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold text-sm">
          2
        </div>
        <h2 className="text-xl font-semibold text-white">Delivery Method</h2>
      </div>
      
      {/* Delivery Method Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ship to Me */}
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
          <div className="flex items-start gap-3">
            <span className="text-2xl">📦</span>
            <div className="flex-1">
              <p className="font-semibold text-white">Ship to Me</p>
              <p className="text-sm text-zinc-400 mt-1">
                Freight delivery via T-Force
              </p>
              {quote && deliveryMethod === 'shipping' && (
                <p className="text-amber-400 font-semibold mt-2">
                  {formatCurrency(quote.totalRate)}
                </p>
              )}
            </div>
          </div>
          {deliveryMethod === 'shipping' && (
            <div className="absolute top-3 right-3 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>
        
        {/* Pick Up */}
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
          <div className="flex items-start gap-3">
            <span className="text-2xl">🏭</span>
            <div className="flex-1">
              <p className="font-semibold text-white">Pick Up</p>
              <p className="text-sm text-zinc-400 mt-1">
                {PICKUP_LOCATION.city}, {PICKUP_LOCATION.state}
              </p>
              <p className="text-green-400 font-semibold mt-2">FREE</p>
            </div>
          </div>
          {deliveryMethod === 'pickup' && (
            <div className="absolute top-3 right-3 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>
      </div>
      
      {/* Shipping Address Form */}
      <AnimatePresence mode="wait">
        {deliveryMethod === 'shipping' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-zinc-800/50 rounded-lg border border-zinc-700 space-y-4">
              <h3 className="font-medium text-white">Shipping Address</h3>
              
              {/* Street Address */}
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Street Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={address.streetAddress}
                  onChange={(e) => handleAddressChange('streetAddress', e.target.value)}
                  placeholder="123 Main Street"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              
              {/* Apartment */}
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Apartment, Suite, etc. (optional)
                </label>
                <input
                  type="text"
                  value={address.apartment}
                  onChange={(e) => handleAddressChange('apartment', e.target.value)}
                  placeholder="Apt 4B"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              
              {/* City, State, ZIP */}
              <div className="grid grid-cols-6 gap-4">
                <div className="col-span-3">
                  <label className="block text-sm text-zinc-400 mb-1">
                    City <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    placeholder="Los Angeles"
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm text-zinc-400 mb-1">
                    State <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={address.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    className="w-full px-3 py-3 bg-zinc-900 border border-zinc-600 rounded-md text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">--</option>
                    {US_STATES.map(state => (
                      <option key={state.code} value={state.code}>{state.code}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-zinc-400 mb-1">
                    ZIP Code <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={address.zipCode}
                    onChange={(e) => handleAddressChange('zipCode', e.target.value.replace(/[^\d-]/g, '').slice(0, 10))}
                    placeholder="90210"
                    maxLength={10}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              
              {/* Residential Checkbox */}
              <label className="flex items-center gap-3 cursor-pointer py-2">
                <input
                  type="checkbox"
                  checked={address.isResidential}
                  onChange={(e) => handleResidentialToggle(e.target.checked)}
                  className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <span className="text-white">This is a residential address</span>
                  <span className="text-zinc-400 text-sm ml-2">(+{formatCurrency(RESIDENTIAL_SURCHARGE)} for home delivery)</span>
                </div>
              </label>
              
              {/* Calculate/Recalculate Button */}
              {(addressModified || !quote) && (
                <button
                  type="button"
                  onClick={() => fetchQuote()}
                  disabled={isLoading || !address.zipCode}
                  className="w-full py-3 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Calculating...
                    </>
                  ) : (
                    <>
                      {quote ? 'Recalculate Shipping' : 'Calculate Shipping'}
                    </>
                  )}
                </button>
              )}
              
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-md">
                  <p className="text-red-400">{error}</p>
                  <p className="text-red-400/70 text-sm mt-1">
                    Need help? Call <a href="tel:+19377256790" className="underline font-medium">(937) 725-6790</a>
                  </p>
                </div>
              )}
              
              {/* Quote Display */}
              {quote && !addressModified && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 bg-green-500/10 border border-green-500/30 rounded-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-400 font-medium flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Shipping Calculated
                      </p>
                      {quote.destinationTerminal && (
                        <p className="text-zinc-400 text-sm mt-1">
                          {address.isResidential 
                            ? 'Home delivery with liftgate service'
                            : `Terminal pickup: ${quote.destinationTerminal.name}`
                          }
                        </p>
                      )}
                      {quote.transitDays && (
                        <p className="text-zinc-500 text-sm">
                          Estimated delivery: {quote.transitDays} business days
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(quote.totalRate)}
                      </p>
                      {quote.residentialSurcharge > 0 && (
                        <p className="text-zinc-500 text-sm">
                          Includes {formatCurrency(quote.residentialSurcharge)} delivery fee
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
        
        {/* Pickup Information */}
        {deliveryMethod === 'pickup' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{PICKUP_LOCATION.name}</h3>
                  <p className="text-zinc-400 mt-1">
                    {PICKUP_LOCATION.address}<br />
                    {PICKUP_LOCATION.city}, {PICKUP_LOCATION.state} {PICKUP_LOCATION.zip}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <span className="text-zinc-500">
                      <strong className="text-zinc-400">Hours:</strong> {PICKUP_LOCATION.hours}
                    </span>
                    <span className="text-zinc-500">
                      <strong className="text-zinc-400">Phone:</strong>{' '}
                      <a href={`tel:${PICKUP_LOCATION.phone.replace(/[^\d]/g, '')}`} className="text-amber-500 hover:underline">
                        {PICKUP_LOCATION.phone}
                      </a>
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-400">FREE</p>
                  <p className="text-zinc-500 text-sm">Save on shipping</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-zinc-900/50 rounded-md">
                <p className="text-sm text-zinc-400">
                  <strong className="text-zinc-300">📦 Ready in 3-5 business days.</strong>{' '}
                  We'll email you when your ramp is ready for pickup.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Validation Warning */}
      {deliveryMethod === 'shipping' && !isShippingValid && !isLoading && (
        <p className="text-amber-500 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {!isAddressComplete 
            ? 'Please complete your shipping address'
            : !quote 
              ? 'Please calculate shipping to continue'
              : 'Please recalculate shipping with your updated address'
          }
        </p>
      )}
    </div>
  );
}

export default CheckoutShippingSection;
