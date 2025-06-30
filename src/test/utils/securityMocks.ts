
import React, { createContext, useContext } from 'react';
import { vi } from 'vitest';

// Mock SecurityContext value with all required properties
const mockSecurityContextValue = {
  isSecurityEnabled: false,
  hasLockedData: false,
  isInitialized: true,
  enableSecurity: vi.fn().mockResolvedValue(true),
  disableSecurity: vi.fn(),
  getSecurityStatus: vi.fn(() => 'Security Disabled - Data stored in plain text'),
  isDataAvailable: vi.fn().mockResolvedValue(true),
};

// Create a real mock context
const MockSecurityContext = createContext(mockSecurityContextValue);

// Mock SecurityProvider that actually provides context
const MockSecurityProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(MockSecurityContext.Provider, { value: mockSecurityContextValue }, children);
};

// Mock useSecurity hook that uses the mock context (renamed to follow hook naming convention)
const useMockSecurity = () => {
  const context = useContext(MockSecurityContext);
  if (context === undefined) {
    // Return mock values directly if context fails
    return mockSecurityContextValue;
  }
  return context;
};

// Helper function to setup SecurityContext mock in tests
export const mockSecurityContext = () => {
  vi.mock('@/contexts/SecurityContext', () => ({
    SecurityProvider: MockSecurityProvider,
    useSecurity: useMockSecurity,
    SecurityContext: MockSecurityContext,
  }));
};

// Export the mock values for direct use
export { mockSecurityContextValue, MockSecurityProvider, useMockSecurity, MockSecurityContext };
