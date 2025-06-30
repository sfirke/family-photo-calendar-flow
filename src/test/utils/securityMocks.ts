
import React from 'react';
import { vi } from 'vitest';

// Create a proper test SecurityContext
const TestSecurityContext = React.createContext(undefined);

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

// Mock SecurityProvider component
const MockSecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return React.createElement(
    TestSecurityContext.Provider,
    { value: mockSecurityContextValue },
    children
  );
};

// Mock useSecurity hook
const mockUseSecurity = vi.fn(() => mockSecurityContextValue);

// Consistent SecurityContext mock that can be used across all test files
export const createSecurityContextMock = () => {
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
