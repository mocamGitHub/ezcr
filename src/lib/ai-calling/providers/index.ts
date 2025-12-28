/**
 * AI Calling Provider Registry
 *
 * STUB IMPLEMENTATION - No real calls are made.
 * Providers are registered here but disabled by default.
 */

import type { CallRequest, CallResult, AICallingProvider } from '../types'
import { AI_CALLING_PROVIDERS } from '../types'

/**
 * Base provider interface
 */
export interface ICallingProvider {
  id: string
  name: string
  isConfigured(): boolean
  makeCall(request: CallRequest): Promise<CallResult>
}

/**
 * Stub provider - returns not configured
 */
class StubProvider implements ICallingProvider {
  constructor(public id: string, public name: string) {}

  isConfigured(): boolean {
    return false
  }

  async makeCall(_request: CallRequest): Promise<CallResult> {
    return {
      success: false,
      error: `${this.name} is not configured. This is a stub implementation.`,
    }
  }
}

// Provider instances (all stubs)
const providers: Map<string, ICallingProvider> = new Map([
  ['calai', new StubProvider('calai', 'Cal.ai Voice')],
  ['twilio', new StubProvider('twilio', 'Twilio Voice')],
])

/**
 * Get a provider by ID
 */
export function getProvider(id: string): ICallingProvider | undefined {
  return providers.get(id)
}

/**
 * Get all available providers
 */
export function getAllProviders(): AICallingProvider[] {
  return AI_CALLING_PROVIDERS
}

/**
 * Get enabled providers
 */
export function getEnabledProviders(): AICallingProvider[] {
  return AI_CALLING_PROVIDERS.filter(p => p.enabled)
}

/**
 * Check if any provider is configured
 */
export function hasConfiguredProvider(): boolean {
  return Array.from(providers.values()).some(p => p.isConfigured())
}

/**
 * Make a call using the default provider
 *
 * STUB - Always returns not configured
 */
export async function makeCall(request: CallRequest): Promise<CallResult> {
  const enabledProviders = getEnabledProviders()

  if (enabledProviders.length === 0) {
    return {
      success: false,
      error: 'No AI calling provider is enabled. Configure in admin settings.',
    }
  }

  const provider = getProvider(enabledProviders[0].id)
  if (!provider) {
    return {
      success: false,
      error: 'Provider not found',
    }
  }

  return provider.makeCall(request)
}
