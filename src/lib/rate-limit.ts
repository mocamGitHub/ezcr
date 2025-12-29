/**
 * Simple in-memory rate limiter for API routes
 * Uses sliding window algorithm with configurable limits
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

// In-memory store for rate limit entries
// In production, consider using Redis for distributed rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check rate limit for a given identifier
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and headers
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const key = identifier;
  const entry = rateLimitStore.get(key);

  // No existing entry or window expired
  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetAt,
    };
  }

  // Within window, check if limit exceeded
  if (entry.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment counter
  entry.count++;
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get client IP from request headers
 * Handles various proxy configurations
 */
export function getClientIP(request: Request): string {
  // Check various headers for real IP (behind proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback - this may not be accurate behind a proxy
  return 'unknown';
}

/**
 * Create rate limit response headers
 */
export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
  };
}

// Pre-configured rate limit settings for different route types
export const RATE_LIMITS = {
  // AI endpoints - expensive, limit strictly
  ai: { limit: 20, windowMs: 60 * 1000 }, // 20 requests per minute

  // Auth endpoints - prevent brute force
  auth: { limit: 10, windowMs: 60 * 1000 }, // 10 requests per minute

  // Public submission endpoints
  submission: { limit: 5, windowMs: 60 * 1000 }, // 5 requests per minute

  // General API endpoints
  standard: { limit: 60, windowMs: 60 * 1000 }, // 60 requests per minute

  // Webhook endpoints - higher limit for automated systems
  webhook: { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute

  // Search endpoints
  search: { limit: 30, windowMs: 60 * 1000 }, // 30 requests per minute
} as const;

/**
 * Rate limit middleware helper for API routes
 * Returns 429 response if rate limit exceeded
 */
export function withRateLimit(
  request: Request,
  config: RateLimitConfig = RATE_LIMITS.standard
): { limited: false } | { limited: true; response: Response } {
  const ip = getClientIP(request);
  const result = checkRateLimit(ip, config);

  if (!result.success) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return {
      limited: true,
      response: new Response(
        JSON.stringify({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
            ...rateLimitHeaders(result),
          },
        }
      ),
    };
  }

  return { limited: false };
}
