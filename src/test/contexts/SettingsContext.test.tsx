
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';

// Mock all the individual hooks
vi.mock('@/contexts/settings/useDisplaySettings', () => ({
  useDisplaySettings: () => ({
    theme: 'light',
    setTheme: vi.fn(),
    defaultView: 'month',
    setDefaultView: vi.fn(),
  }),
}));

vi.mock('@/contexts/settings/useWeatherSettings', () => ({
  useWeatherSettings: () => ({
    zipCode: '90210',
    setZipCode: vi.fn(),
    weatherApiKey: '',
    setWeatherApiKey: vi.fn(),
  }),
}));

vi.mock('@/contexts/settings/usePhotoSettings', () => ({
  usePhotoSettings: () => ({
    publicAlbumUrl: '',
    setPublicAlbumUrl: vi.fn(),
    backgroundDuration: 30,
    setBackgroundDuration: vi.fn(),
    selectedAlbum: '',
    setSelectedAlbum: vi.fn(),
  }),
}));

vi.mock('@/contexts/settings/useGitHubSettings', () => ({
  useGitHubSettings: () => ({
    githubOwner: '',
    setGithubOwner: vi.fn(),
    githubRepo: '',
    setGithubRepo: vi.fn(),
  }),
}));

vi.mock('@/contexts/settings/useSettingsInitialization', () => ({
  useSettingsInitialization: vi.fn(),
}));

describe('SettingsContext', () => {
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
