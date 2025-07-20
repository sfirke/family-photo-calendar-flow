
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';
import { mockSecurityModule, resetSecurityMocks } from '../utils/securityMocks';

// Apply direct module mock at the top level
mockSecurityModule();

// Mock all the individual hooks with complete exports
const mockDisplaySettings = {
  theme: 'light',
  setTheme: vi.fn(),
  defaultView: 'month',
  setDefaultView: vi.fn(),
};

const mockWeatherSettings = {
  zipCode: '90210',
  setZipCode: vi.fn(),
  weatherApiKey: '',
  setWeatherApiKey: vi.fn(),
  locationKey: '',
  setLocationKey: vi.fn(),
  useManualLocation: false,
  setUseManualLocation: vi.fn(),
  isInitialized: true,
  setValidatedZipCode: vi.fn(),
  setValidatedWeatherApiKey: vi.fn(),
};

const mockPhotoSettings = {
  publicAlbumUrl: '',
  setPublicAlbumUrl: vi.fn(),
  backgroundDuration: 30,
  setBackgroundDuration: vi.fn(),
  selectedAlbum: '',
  setSelectedAlbum: vi.fn(),
};

const mockGitHubSettings = {
  githubOwner: '',
  setGithubOwner: vi.fn(),
  githubRepo: '',
  setGithubRepo: vi.fn(),
};

const mockNotionSettings = {
  notionUrl: '',
  setNotionUrl: vi.fn(),
  lastSyncTime: null,
  setLastSyncTime: vi.fn(),
  notionCalendars: [],
  setNotionCalendars: vi.fn(),
  notionToken: '',
  setNotionToken: vi.fn(),
  notionDatabaseId: '',
  setNotionDatabaseId: vi.fn(),
};

vi.mock('@/contexts/settings/useDisplaySettings', () => ({
  useDisplaySettings: vi.fn(() => mockDisplaySettings),
}));

vi.mock('@/contexts/settings/useWeatherSettings', () => ({
  useWeatherSettings: vi.fn(() => mockWeatherSettings),
}));

vi.mock('@/contexts/settings/usePhotoSettings', () => ({
  usePhotoSettings: vi.fn(() => mockPhotoSettings),
}));

vi.mock('@/contexts/settings/useGitHubSettings', () => ({
  useGitHubSettings: vi.fn(() => mockGitHubSettings),
}));

vi.mock('@/contexts/settings/useNotionSettings', () => ({
  useNotionSettings: vi.fn(() => mockNotionSettings),
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

});
