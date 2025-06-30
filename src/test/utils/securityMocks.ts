
import { vi } from 'vitest';

// Mock SecurityContext value with all required properties
export const mockSecurityContextValue = {
  isSecurityEnabled: false,
  hasLockedData: false,
  isInitialized: true,
  enableSecurity: vi.fn().mockResolvedValue(true),
  disableSecurity: vi.fn(),
  getSecurityStatus: vi.fn(() => 'Security Disabled - Data stored in plain text'),
  isDataAvailable: vi.fn().mockResolvedValue(true),
};

// Direct hook mocking function using vi.spyOn
export const setupDirectSecurityMock = (customValues = {}) => {
  const mockValues = { ...mockSecurityContextValue, ...customValues };
  
  // Import the module dynamically to spy on it
  return vi.doMock('@/contexts/SecurityContext', async () => {
    const actual = await vi.importActual('@/contexts/SecurityContext');
    return {
      ...actual,
      useSecurity: vi.fn(() => mockValues),
    };
  });
};

// Alternative approach using module mock (for compatibility)
export const mockSecurityModule = (customValues = {}) => {
  const mockValues = { ...mockSecurityContextValue, ...customValues };
  
  vi.mock('@/contexts/SecurityContext', () => ({
    SecurityProvider: ({ children }: { children: React.ReactNode }) => children,
    useSecurity: vi.fn(() => mockValues),
    SecurityContext: {},
  }));
};

// Reset all mocks
export const resetSecurityMocks = () => {
  vi.clearAllMocks();
  vi.resetModules();
};
