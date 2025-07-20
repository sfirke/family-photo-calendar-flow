
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWeatherSettings } from '@/contexts/settings/useWeatherSettings';
import { mockSecurityModule, resetSecurityMocks } from '../utils/securityMocks';

// Apply direct module mock at the top level
mockSecurityModule();

// Mock the settingsStorageService
vi.mock('@/services/settingsStorageService', () => ({
  settingsStorageService: {
    setValue: vi.fn().mockResolvedValue(undefined),
    loadAllSettings: vi.fn().mockResolvedValue({}),
    getValue: vi.fn().mockResolvedValue(''),
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
    vi.clearAllMocks();
  });

  it('should initialize with default values', async () => {
    const { result } = renderHook(() => useWeatherSettings());

    // Check that the hook is defined first
    expect(result.current).toBeDefined();
    
    // Wait for async initialization
    await waitFor(() => {
      expect(result.current?.isInitialized).toBe(true);
    }, { timeout: 2000 });

    // The hook should return empty string initially, not the localStorage default
    expect(result.current.zipCode).toBe('');
    expect(result.current.weatherApiKey).toBe('');
  });

  it('should update zip code with validation', async () => {
    const { result } = renderHook(() => useWeatherSettings());

    // Check that the hook is defined first
    expect(result.current).toBeDefined();

    // Wait for initialization
    await waitFor(() => {
      expect(result.current?.isInitialized).toBe(true);
    }, { timeout: 2000 });

    act(() => {
      result.current.setZipCode('12345');
    });

    expect(result.current.zipCode).toBe('12345');
  });

  it('should update weather API key', async () => {
    const { result } = renderHook(() => useWeatherSettings());

    // Check that the hook is defined first
    expect(result.current).toBeDefined();

    // Wait for initialization
    await waitFor(() => {
      expect(result.current?.isInitialized).toBe(true);
    }, { timeout: 2000 });

    act(() => {
      result.current.setWeatherApiKey('test-api-key');
    });

    expect(result.current.weatherApiKey).toBe('test-api-key');
  });

  it('should allow progressive typing for zip code', async () => {
    const { result } = renderHook(() => useWeatherSettings());

    // Check that the hook is defined first
    expect(result.current).toBeDefined();

    // Wait for initialization
    await waitFor(() => {
      expect(result.current?.isInitialized).toBe(true);
    }, { timeout: 2000 });

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
