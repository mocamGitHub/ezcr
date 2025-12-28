/**
 * AI Calling Provider Types
 *
 * STUB ONLY - No real calls are made unless fully configured.
 * This defines the interface for voice/calling integrations.
 */

export interface AICallingProvider {
  id: string
  name: string
  enabled: boolean
  costPerMinute?: number
  features: string[]
}

export interface CallRequest {
  phoneNumber: string
  purpose: 'reminder' | 'confirmation' | 'reschedule' | 'custom'
  bookingId?: string
  message?: string
  scheduledFor?: Date
}

export interface CallResult {
  success: boolean
  callId?: string
  duration?: number
  error?: string
}

export interface VoiceReminderConfig {
  enabled: boolean
  provider: 'calai' | 'twilio' | 'none'
  minutesBefore: number
  messageTemplate: string
}

/**
 * Available providers (stubs only)
 */
export const AI_CALLING_PROVIDERS: AICallingProvider[] = [
  {
    id: 'calai',
    name: 'Cal.ai Voice',
    enabled: false, // STUB - not configured
    costPerMinute: 0.15, // Approximate cost
    features: [
      'AI-powered conversations',
      'Natural language understanding',
      'Multi-language support',
      'Booking confirmations',
      'Rescheduling assistance',
    ],
  },
  {
    id: 'twilio',
    name: 'Twilio Voice',
    enabled: false, // STUB - not configured
    costPerMinute: 0.02, // Approximate cost
    features: [
      'Programmable voice',
      'Text-to-speech',
      'Call recordings',
      'Custom IVR',
      'Global reach',
    ],
  },
]

/**
 * Default voice reminder configuration
 */
export const DEFAULT_VOICE_REMINDER_CONFIG: VoiceReminderConfig = {
  enabled: false,
  provider: 'none',
  minutesBefore: 60,
  messageTemplate: 'Hi {{name}}, this is a reminder about your appointment at {{time}}.',
}
