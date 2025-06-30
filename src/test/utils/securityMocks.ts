
import React from 'react';
import { vi } from 'vitest';

// Mock SecurityContext value
const mockSecurityContextValue = {
  isSecurityEnabled: false,
  hasLockedData: false,
  isInitialized: true,
  enableSecurity: vi.fn().mockResolvedValue(true),
  disableSecurity: vi.fn(),
  getSecurityStatus: vi.fn(() => 'Security Disabled - Data stored in plain text'),
  isDataAvailable: vi.fn().mockResolvedValue(true),
};

// Mock SecurityProvider component that properly provides context
const MockSecurityProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, {}, children);
};

// Mock useSecurity hook
const mockUseSecurity = vi.fn(() => mockSecurityContextValue);

// Helper function to setup SecurityContext mock in tests
export const mockSecurityContext = () => {
  vi.mock('@/contexts/SecurityContext', () => ({
    SecurityProvider: MockSecurityProvider,
    useSecurity: mockUseSecurity,
  }));
};

// Export the mock values for direct use
export { mockSecurityContextValue, MockSecurityProvider, mockUseSecurity };
