
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

// Mock Web Crypto API for testing environment
const mockCrypto = {
  getRandomValues: vi.fn((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
  subtle: {
    importKey: vi.fn().mockResolvedValue({}),
    deriveKey: vi.fn().mockResolvedValue({}),
    deriveBits: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(16)),
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

// Mock btoa and atob for base64 operations
global.btoa = vi.fn((str) => Buffer.from(str, 'binary').toString('base64'));
global.atob = vi.fn((str) => Buffer.from(str, 'base64').toString('binary'));
