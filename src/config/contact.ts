/**
 * Centralized contact information for EZ Cycle Ramp
 * Use these values across the application for consistent contact info
 */

export const CONTACT_INFO = {
  // Main support phone
  phone: '(937) 725-6790',
  phoneRaw: '9377256790',
  phoneTollFree: '(800) 687-4410',
  phoneTollFreeRaw: '8006874410',

  // Email addresses
  email: 'support@ezcycleramp.com',
  salesEmail: 'sales@ezcycleramp.com',

  // Address
  address: {
    street: '',
    city: 'Woodstock',
    state: 'GA',
    zip: '30188',
    country: 'US',
  },

  // Business hours
  hours: 'Mon-Fri 9am-5pm EST',

  // Social media
  social: {
    facebook: '',
    instagram: '',
    youtube: '',
  },
}

/**
 * T-Force Freight shipping partner information
 */
export const TFORCE_INFO = {
  name: 'T-Force Freight',
  customerService: '(800) 333-7400',
  customerServiceRaw: '8003337400',
  website: 'https://www.tforce.com',
  // Helpful info for customers picking up from terminal
  terminalPickupNote: 'Bring valid photo ID when picking up at terminal',
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone
}

/**
 * Get tel: link for phone number
 */
export function getPhoneLink(phone: string): string {
  return `tel:${phone.replace(/\D/g, '')}`
}
