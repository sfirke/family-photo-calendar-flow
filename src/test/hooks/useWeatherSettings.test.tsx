
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

});
