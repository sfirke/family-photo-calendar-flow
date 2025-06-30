
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';
import { mockSecurityModule, resetSecurityMocks } from '../utils/securityMocks';

// Apply direct module mock at the top level
mockSecurityModule();

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

describe('SettingsContext', () => {
  beforeEach(() => {
    resetSecurityMocks();
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
