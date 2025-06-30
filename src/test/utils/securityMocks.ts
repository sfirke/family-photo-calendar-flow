
import { vi } from 'vitest';

// Consistent SecurityContext mock that can be used across all test files
export const createSecurityContextMock = () => ({
  SecurityProvider: ({ children }: { children: React.ReactNode }) => children,
  SecurityContext: React.createContext(undefined),
  useSecurity: vi.fn(() => ({
    isSecurityEnabled: false,
    hasLockedData: false,
    isInitialized: true,
    enableSecurity: vi.fn().mockResolvedValue(true),
    disableSecurity: vi.fn(),
    getSecurityStatus: vi.fn(() => 'Security Disabled - Data stored in plain text'),
    isDataAvailable: vi.fn().mockResolvedValue(true),
  })),
});

// Helper function to setup SecurityContext mock in tests
export const mockSecurityContext = () => {
  vi.mock('@/contexts/SecurityContext', () => createSecurityContextMock());
};
