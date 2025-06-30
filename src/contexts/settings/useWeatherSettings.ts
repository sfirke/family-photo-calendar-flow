
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

  // Auto-save zip code to appropriate storage
  useEffect(() => {
    SettingsStorage.saveSetting('zipCode', zipCode, true);
  }, [zipCode]);

  // Auto-save weather API key to appropriate storage
  useEffect(() => {
    SettingsStorage.saveSetting('weatherApiKey', weatherApiKey, true);
  }, [weatherApiKey]);

  /**
   * Enhanced zip code setter with input validation
   */
  const setValidatedZipCode = (newZipCode: string) => {
    const validation = InputValidator.validateZipCode(newZipCode);
    if (validation.isValid || newZipCode === '') {
      setZipCode(newZipCode);
    } else {
      console.warn('Invalid zip code:', validation.error);
    }
  };

  /**
   * Enhanced weather API key setter with input validation
   */
  const setValidatedWeatherApiKey = (apiKey: string) => {
    if (apiKey === '') {
      setWeatherApiKey(apiKey);
      return;
    }
    
    const validation = InputValidator.validateApiKey(apiKey);
    if (validation.isValid) {
      setWeatherApiKey(apiKey);
    } else {
      console.warn('Invalid API key:', validation.error);
    }
  };

  return {
    zipCode,
    setZipCode: setValidatedZipCode,
    weatherApiKey,
    setWeatherApiKey: setValidatedWeatherApiKey,
  };
};
