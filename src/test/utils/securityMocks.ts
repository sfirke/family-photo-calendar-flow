
import React from 'react';
import { vi } from 'vitest';

// Create a proper test SecurityContext
const TestSecurityContext = React.createContext(undefined);

// Consistent SecurityContext mock that can be used across all test files
export const createSecurityContextMock = () => {
  const mockSecurityContextValue = {
    isSecurityEnabled: false,
    hasLockedData: false,
    isInitialized: true,
    enableSecurity: vi.fn().mockResolvedValue(true),
    disableSecurity: vi.fn(),
    getSecurityStatus: vi.fn(() => 'Security Disabled - Data stored in plain text'),
    isDataAvailable: vi.fn().mockResolvedValue(true),
  };

  const MockSecurityProvider = ({ children }: { children: React.ReactNode }) => {
    return (
      <TestSecurityContext.Provider value={mockSecurityContextValue}>
        {children}
      </TestSecurityContext.Provider>
    );
  };

  const mockUseSecurity = vi.fn(() => mockSecurityContextValue);

  return {
    SecurityProvider: MockSecurityProvider,
    SecurityContext: TestSecurityContext,
    useSecurity: mockUseSecurity,
  };
};

// Helper function to setup SecurityContext mock in tests
export const mockSecurityContext = () => {
  vi.mock('@/contexts/SecurityContext', () => createSecurityContextMock());
};
