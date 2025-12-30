// src/lib/ai/constants.ts
// Shared constants for AI chat endpoints

import { CONTACT_INFO } from '@/config/contact'

/**
 * Product information used in AI prompts
 */
export const PRODUCT_INFO = `Important product information:
- AUN250: Heavy-duty folding ramp, 2,500 lb capacity, $1,299
- AUN210: Standard folding ramp, 2,000 lb capacity, $999
- AC001-1 Extension: For load heights 35-42 inches, $149
- AC001-2 Extension: For load heights 43-51 inches, $249
- AC001-3 Extension: For load heights 52-60 inches, $349
- Cargo extension: Needed if cargo area >80 inches`

/**
 * Measurement guidelines for vehicle and motorcycle specs
 */
export const MEASUREMENT_GUIDELINES = `Measurement guidelines:
- Pickup trucks: Bed length typically 60-96 inches, height 30-45 inches
- Vans: Cargo area 70-140 inches, height 20-35 inches
- Trailers: Bed length 70-100 inches, height 20-40 inches
- Motorcycles: Most cruisers 700-900 lbs, sport bikes 400-500 lbs, adventure 500-600 lbs`

/**
 * Contact information for AI prompts
 */
export const CONTACT_PROMPT = `Key contact information:
- Phone: ${CONTACT_INFO.phoneTollFree}
- Email: ${CONTACT_INFO.email}
- Business hours: Monday-Friday 8 AM - 6 PM EST, Saturday 9 AM - 2 PM EST`

/**
 * Conversational guidelines for AI assistants
 */
export const CONVERSATIONAL_TIPS = `Conversational tips:
- Use simple language, avoid technical jargon
- Convert feet to inches naturally (6.5 ft = 78 inches)
- Provide ranges when guessing (e.g., "Most Ford F-150s are about 36-40 inches high")
- Offer to help with specific measurements
- Be concise but warm - aim for 2-4 sentences per response unless more detail is needed`
