
/**
 * Weather Settings Hook
 * 
 * Manages weather-related settings with secure storage and validation.
 */

import { useState, useEffect } from 'react';
import { InputValidator } from '@/utils/security/inputValidation';
import { SettingsStorage } from './settingsStorage';

export const useWeatherSettings = () => {
  const [zipCode, setZipCode] = useState('90210');
  const [weatherApiKey, setWeatherApiKey] = useState('');
  const [weatherProvider, setWeatherProvider] = useState('openweathermap');
  const [useEnhancedService, setUseEnhancedService] = useState(false);

  // Load initial settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedZipCode = await SettingsStorage.getStorageValue('zipCode', true) || '90210';
        const savedWeatherApiKey = await SettingsStorage.getStorageValue('weatherApiKey', true) || '';
        const savedWeatherProvider = await SettingsStorage.getStorageValue('weatherProvider', false) || 'openweathermap';
        const savedUseEnhancedService = await SettingsStorage.getStorageValue('useEnhancedService', false);
        
        setZipCode(savedZipCode);
        setWeatherApiKey(savedWeatherApiKey);
        setWeatherProvider(savedWeatherProvider);
        setUseEnhancedService(savedUseEnhancedService === 'true');
      } catch (error) {
        console.warn('Failed to load weather settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  // Auto-save zip code to appropriate storage
  useEffect(() => {
    SettingsStorage.saveSetting('zipCode', zipCode, true);
  }, [zipCode]);

  // Auto-save weather API key to appropriate storage
  useEffect(() => {
    SettingsStorage.saveSetting('weatherApiKey', weatherApiKey, true);
  }, [weatherApiKey]);

  // Auto-save weather provider
  useEffect(() => {
    SettingsStorage.saveSetting('weatherProvider', weatherProvider, false);
  }, [weatherProvider]);

  // Auto-save enhanced service setting
  useEffect(() => {
    SettingsStorage.saveSetting('useEnhancedService', useEnhancedService.toString(), false);
  }, [useEnhancedService]);

  /**
   * Enhanced zip code setter with progressive validation
   * Allows typing but validates on completion
   */
  const setValidatedZipCode = (newZipCode: string) => {
    // Always allow the input to be set for real-time typing
    setZipCode(newZipCode);
    
    // Only log validation errors for non-empty invalid inputs
    if (newZipCode.trim() !== '') {
      const validation = InputValidator.validateZipCode(newZipCode);
      if (!validation.isValid) {
        console.warn('Invalid zip code format:', validation.error);
      }
    }
  };

  /**
   * Enhanced weather API key setter with progressive validation
   * Allows typing but validates on completion
   */
  const setValidatedWeatherApiKey = (apiKey: string) => {
    // Always allow the input to be set for real-time typing
    setWeatherApiKey(apiKey);
    
    // Only log validation errors for non-empty invalid inputs
    if (apiKey.trim() !== '') {
      const validation = InputValidator.validateApiKey(apiKey);
      if (!validation.isValid) {
        console.warn('Invalid API key format:', validation.error);
      }
    }
  };

  return {
    zipCode,
    setZipCode: setValidatedZipCode,
    weatherApiKey,
    setWeatherApiKey: setValidatedWeatherApiKey,
    weatherProvider,
    setWeatherProvider,
    useEnhancedService,
    setUseEnhancedService,
  };
};
