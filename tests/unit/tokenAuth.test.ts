import { describe, it, expect, vi } from 'vitest'
import { hasScope, type ShortcutsToken, extractRequestMetadata } from '@/lib/shortcuts/tokenAuth'

// Mock token for testing
const mockToken: ShortcutsToken = {
  id: 'token-123',
  tenantId: 'tenant-456',
  userId: 'user-789',
  name: 'Test Token',
  scopes: ['today', 'block-time'],
  lastUsedAt: null,
  revokedAt: null,
  createdAt: new Date(),
}

const wildcardToken: ShortcutsToken = {
  ...mockToken,
  scopes: ['*'],
}

describe('tokenAuth', () => {
  describe('hasScope', () => {
    it('should return true for granted scope', () => {
      expect(hasScope(mockToken, 'today')).toBe(true)
      expect(hasScope(mockToken, 'block-time')).toBe(true)
    })

    it('should return false for non-granted scope', () => {
      expect(hasScope(mockToken, 'reschedule')).toBe(false)
      expect(hasScope(mockToken, 'create-link')).toBe(false)
    })

    it('should return true for any scope with wildcard', () => {
      expect(hasScope(wildcardToken, 'today')).toBe(true)
      expect(hasScope(wildcardToken, 'block-time')).toBe(true)
      expect(hasScope(wildcardToken, 'reschedule')).toBe(true)
      expect(hasScope(wildcardToken, 'create-link')).toBe(true)
    })
  })

  describe('extractRequestMetadata', () => {
    it('should extract IP from x-forwarded-for', () => {
      const mockRequest = {
        headers: new Headers({
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
          'user-agent': 'Mozilla/5.0',
        }),
      } as Request

      const metadata = extractRequestMetadata(mockRequest)

      expect(metadata.ipAddress).toBe('192.168.1.1')
      expect(metadata.userAgent).toBe('Mozilla/5.0')
    })

    it('should extract IP from x-real-ip as fallback', () => {
      const mockRequest = {
        headers: new Headers({
          'x-real-ip': '10.0.0.1',
          'user-agent': 'Test Agent',
        }),
      } as Request

      const metadata = extractRequestMetadata(mockRequest)

      expect(metadata.ipAddress).toBe('10.0.0.1')
    })

    it('should handle missing headers', () => {
      const mockRequest = {
        headers: new Headers({}),
      } as Request

      const metadata = extractRequestMetadata(mockRequest)

      expect(metadata.ipAddress).toBeUndefined()
      expect(metadata.userAgent).toBeUndefined()
    })
  })
})

describe('Token scope validation', () => {
  const testCases = [
    { scope: 'today', expected: true },
    { scope: 'block-time', expected: true },
    { scope: 'create-link', expected: false },
    { scope: 'reschedule', expected: false },
  ] as const

  testCases.forEach(({ scope, expected }) => {
    it(`should ${expected ? 'allow' : 'deny'} scope "${scope}" for limited token`, () => {
      expect(hasScope(mockToken, scope)).toBe(expected)
    })
  })

  it('should allow all scopes for wildcard token', () => {
    const allScopes: ShortcutsToken['scopes'][number][] = [
      'today',
      'block-time',
      'create-link',
      'reschedule',
    ]

    allScopes.forEach(scope => {
      expect(hasScope(wildcardToken, scope)).toBe(true)
    })
  })
})
