import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { server } from './mocks/server';

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests are done
afterAll(() => server.close());

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Enhanced Mock Web Crypto API for testing environment
const mockCrypto = {
  getRandomValues: vi.fn((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
  randomUUID: vi.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
  subtle: {
    importKey: vi.fn().mockResolvedValue({
      type: 'secret',
      algorithm: { name: 'PBKDF2' },
      extractable: false,
      usages: ['deriveKey']
    }),
    deriveKey: vi.fn().mockResolvedValue({
      type: 'secret',
      algorithm: { name: 'AES-GCM', length: 256 },
      extractable: false,
      usages: ['encrypt', 'decrypt']
    }),
    deriveBits: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    encrypt: vi.fn().mockImplementation(async (algorithm, key, data) => {
      // Simple mock encryption - just return the data with some padding
      const encrypted = new Uint8Array(data.byteLength + 16);
      encrypted.set(new Uint8Array(data), 0);
      // Add mock IV/tag
      for (let i = data.byteLength; i < encrypted.length; i++) {
        encrypted[i] = Math.floor(Math.random() * 256);
      }
      return encrypted.buffer;
    }),
    decrypt: vi.fn().mockImplementation(async (algorithm, key, data) => {
      // Simple mock decryption - just return the data without padding
      const decrypted = new Uint8Array(data.byteLength - 16);
      decrypted.set(new Uint8Array(data).slice(0, data.byteLength - 16), 0);
      return decrypted.buffer;
    }),
    generateKey: vi.fn().mockResolvedValue({
      type: 'secret',
      algorithm: { name: 'AES-GCM', length: 256 },
      extractable: false,
      usages: ['encrypt', 'decrypt']
    }),
  },
};

// Override global crypto
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
});

// Override window crypto for browser environment
Object.defineProperty(window, 'crypto', {
  value: mockCrypto,
  writable: true,
});

// Mock btoa and atob for base64 operations with error handling
global.btoa = vi.fn((str) => {
  try {
    return Buffer.from(str, 'binary').toString('base64');
  } catch (error) {
    console.warn('btoa mock error:', error);
    return '';
  }
});

global.atob = vi.fn((str) => {
  try {
    return Buffer.from(str, 'base64').toString('binary');
  } catch (error) {
    console.warn('atob mock error:', error);
    return '';
  }
});

// Mock localStorage with better error handling
const localStorageMock = {
  getItem: vi.fn((key) => {
    try {
      return null; // Default empty state for tests
    } catch (error) {
      console.warn('localStorage.getItem mock error:', error);
      return null;
    }
  }),
  setItem: vi.fn((key, value) => {
    try {
      // Mock implementation - do nothing
    } catch (error) {
      console.warn('localStorage.setItem mock error:', error);
    }
  }),
  removeItem: vi.fn((key) => {
    try {
      // Mock implementation - do nothing
    } catch (error) {
      console.warn('localStorage.removeItem mock error:', error);
    }
  }),
  clear: vi.fn(() => {
    try {
      // Mock implementation - do nothing
    } catch (error) {
      console.warn('localStorage.clear mock error:', error);
    }
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock console methods to reduce test noise
global.console = {
  ...console,
  // Keep error and warn for debugging
  log: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};
