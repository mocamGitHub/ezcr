/**
 * UFE Test Setup
 *
 * Global test configuration and mocks.
 */

import { vi, beforeEach, afterEach } from 'vitest';
import { reloadConfig } from '../config';

// Reset config before each test to ensure clean state
beforeEach(() => {
  reloadConfig();
});

// Clear all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Mock localStorage for wizard sync tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock window for SSR-safe code
Object.defineProperty(global, 'window', {
  value: {
    localStorage: localStorageMock,
  },
});

export { localStorageMock };
