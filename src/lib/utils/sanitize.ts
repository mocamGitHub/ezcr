// src/lib/utils/sanitize.ts
// Simple input sanitization utilities for user-generated content

/**
 * Strip HTML tags from a string
 * Prevents XSS by removing all HTML elements
 */
export function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, '')
}

/**
 * Escape HTML special characters
 * Converts < > & " ' to their HTML entities
 */
export function escapeHtml(input: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  }
  return input.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char)
}

/**
 * Sanitize user-generated text content
 * - Strips HTML tags
 * - Trims whitespace
 * - Normalizes multiple spaces/newlines
 */
export function sanitizeText(input: string): string {
  return stripHtmlTags(input)
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
}

/**
 * Sanitize multiline text (like reviews/comments)
 * - Strips HTML tags
 * - Trims whitespace
 * - Preserves single newlines, collapses multiple
 */
export function sanitizeMultilineText(input: string): string {
  return stripHtmlTags(input)
    .trim()
    .replace(/[ \t]+/g, ' ') // Normalize spaces/tabs (not newlines)
    .replace(/\n{3,}/g, '\n\n') // Collapse 3+ newlines to 2
}

/**
 * Sanitize a name field
 * - Strips HTML tags
 * - Trims whitespace
 * - Removes potentially problematic characters
 */
export function sanitizeName(input: string): string {
  return stripHtmlTags(input)
    .trim()
    .replace(/[<>{}[\]\\]/g, '') // Remove brackets and backslashes
}
