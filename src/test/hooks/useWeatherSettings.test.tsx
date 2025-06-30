
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWeatherSettings } from '@/contexts/settings/useWeatherSettings';
import { mockSecurityModule, resetSecurityMocks } from '../utils/securityMocks';

// Apply direct module mock at the top level
mockSecurityModule();

// Mock the SettingsStorage with all static methods
vi.mock('@/contexts/settings/settingsStorage', () => ({
  SettingsStorage: {
    saveSetting: vi.fn().mockResolvedValue(undefined),
    loadAllSettings: vi.fn().mockResolvedValue({}),
    removeSetting: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock the InputValidator with all validation methods
vi.mock('@/utils/security/inputValidation', () => ({
  InputValidator: {
    validateZipCode: vi.fn().mockReturnValue({ isValid: true, error: null }),
    validateApiKey: vi.fn().mockReturnValue({ isValid: true, error: null }),
    validateUrl: vi.fn().mockReturnValue({ isValid: true, error: null }),
    validateGithubUsername: vi.fn().mockReturnValue({ isValid: true, error: null }),
    validateGithubRepoName: vi.fn().mockReturnValue({ isValid: true, error: null }),
  },
}));

describe('useWeatherSettings', () => {
  beforeEach(() => {
    resetSecurityMocks();
  });

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
