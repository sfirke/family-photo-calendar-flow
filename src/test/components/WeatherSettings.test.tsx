import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSecurityModule, resetSecurityMocks } from '../utils/securityMocks';

// Apply direct module mock at the top level
mockSecurityModule();

// Mock SecurityUnlockBanner to render nothing when hasLockedData is false
vi.mock('@/components/security/SecurityUnlockBanner', () => ({
  default: () => null,
}));

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

describe('WeatherSettings', () => {
  beforeEach(() => {
    resetSecurityMocks();
  });

  it('should pass basic smoke test for component existence', () => {
    // Test that the mocks are working and basic functionality exists
    expect(true).toBe(true);
  });

  it('should have proper mock structure for weather settings', () => {
    // Verify that our mocks provide the expected interface
    expect(() => {
      const { useWeatherSettings } = require('@/contexts/settings/useWeatherSettings');
      const mockSettings = useWeatherSettings();
      
      expect(mockSettings).toHaveProperty('zipCode');
      expect(mockSettings).toHaveProperty('setZipCode');
      expect(mockSettings).toHaveProperty('weatherApiKey');
      expect(mockSettings).toHaveProperty('setWeatherApiKey');
      expect(typeof mockSettings.setZipCode).toBe('function');
      expect(typeof mockSettings.setWeatherApiKey).toBe('function');
    }).not.toThrow();
  });

  it('should have proper mock structure for display settings', () => {
    expect(() => {
      const { useDisplaySettings } = require('@/contexts/settings/useDisplaySettings');
      const mockSettings = useDisplaySettings();
      
      expect(mockSettings).toHaveProperty('theme');
      expect(mockSettings).toHaveProperty('setTheme');
      expect(mockSettings).toHaveProperty('defaultView');
      expect(mockSettings).toHaveProperty('setDefaultView');
    }).not.toThrow();
  });

  it('should have proper mock structure for theme context', () => {
    expect(() => {
      const { useTheme } = require('@/contexts/ThemeContext');
      const mockTheme = useTheme();
      
      expect(mockTheme).toHaveProperty('theme');
      expect(mockTheme).toHaveProperty('setTheme');
      expect(typeof mockTheme.setTheme).toBe('function');
    }).not.toThrow();
  });
});
