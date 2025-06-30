import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';

// Mock all the individual hooks with complete exports
vi.mock('@/contexts/settings/useDisplaySettings', () => ({
  useDisplaySettings: vi.fn(() => ({
    theme: 'light',
    setTheme: vi.fn(),
    defaultView: 'month',
    setDefaultView: vi.fn(),
  })),
}));

vi.mock('@/contexts/settings/useWeatherSettings', () => ({
  useWeatherSettings: vi.fn(() => ({
    zipCode: '90210',
    setZipCode: vi.fn(),
    weatherApiKey: '',
    setWeatherApiKey: vi.fn(),
  })),
}));

vi.mock('@/contexts/settings/usePhotoSettings', () => ({
  usePhotoSettings: vi.fn(() => ({
    publicAlbumUrl: '',
    setPublicAlbumUrl: vi.fn(),
    backgroundDuration: 30,
    setBackgroundDuration: vi.fn(),
    selectedAlbum: '',
    setSelectedAlbum: vi.fn(),
  })),
}));

vi.mock('@/contexts/settings/useGitHubSettings', () => ({
  useGitHubSettings: vi.fn(() => ({
    githubOwner: '',
    setGithubOwner: vi.fn(),
    githubRepo: '',
    setGithubRepo: vi.fn(),
  })),
}));

vi.mock('@/contexts/settings/useSettingsInitialization', () => ({
  useSettingsInitialization: vi.fn(),
}));

// Mock SecurityContext with all exports - consistent with other test files
vi.mock('@/contexts/SecurityContext', () => ({
  SecurityProvider: ({ children }: { children: React.ReactNode }) => children,
  SecurityContext: React.createContext(undefined),
  useSecurity: vi.fn(() => ({
    isSecurityEnabled: false,
    hasLockedData: false,
    isInitialized: true,
    enableSecurity: vi.fn(),
    disableSecurity: vi.fn(),
    getSecurityStatus: vi.fn(() => 'Security Disabled - Data stored in plain text'),
    isDataAvailable: vi.fn().mockResolvedValue(true),
  })),
}));

// Mock ThemeContext
vi.mock('@/contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: vi.fn(() => ({
    theme: 'light',
    setTheme: vi.fn(),
  })),
}));

// Mock WeatherContext
vi.mock('@/contexts/WeatherContext', () => ({
  WeatherProvider: ({ children }: { children: React.ReactNode }) => children,
  useWeather: vi.fn(() => ({
    weatherData: null,
    isLoading: false,
    error: null,
    refreshWeather: vi.fn(),
  })),
}));

describe('SettingsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SettingsProvider>{children}</SettingsProvider>
  );

  it('should provide settings context', () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    expect(result.current.theme).toBe('light');
    expect(result.current.zipCode).toBe('90210');
    expect(result.current.defaultView).toBe('month');
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useSettings());
    }).toThrow('useSettings must be used within a SettingsProvider');
  });
});
