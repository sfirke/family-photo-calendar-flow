
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWeatherSettings } from '@/contexts/settings/useWeatherSettings';

// Mock the SettingsStorage
vi.mock('@/contexts/settings/settingsStorage', () => ({
  SettingsStorage: {
    saveSetting: vi.fn(),
  },
}));

describe('useWeatherSettings', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useWeatherSettings());

    expect(result.current.zipCode).toBe('90210');
    expect(result.current.weatherApiKey).toBe('');
  });

  it('should update zip code with validation', () => {
    const { result } = renderHook(() => useWeatherSettings());

    act(() => {
      result.current.setZipCode('12345');
    });

    expect(result.current.zipCode).toBe('12345');
  });

  it('should update weather API key', () => {
    const { result } = renderHook(() => useWeatherSettings());

    act(() => {
      result.current.setWeatherApiKey('test-api-key');
    });

    expect(result.current.weatherApiKey).toBe('test-api-key');
  });

  it('should allow progressive typing for zip code', () => {
    const { result } = renderHook(() => useWeatherSettings());

    act(() => {
      result.current.setZipCode('9');
    });

    expect(result.current.zipCode).toBe('9');

    act(() => {
      result.current.setZipCode('90');
    });

    expect(result.current.zipCode).toBe('90');
  });
});
