
/**
 * Weather Settings Hook
 * 
 * Manages weather-related settings using tiered storage with secure handling and validation.
 */

import { useState, useEffect } from 'react';
import { InputValidator } from '@/utils/security/inputValidation';
import { settingsStorageService } from '@/services/settingsStorageService';

export const useWeatherSettings = () => {
  const [zipCode, setZipCode] = useState('90210');
  const [weatherApiKey, setWeatherApiKey] = useState('');
  const [accuWeatherApiKey, setAccuWeatherApiKey] = useState('');
  const [weatherProvider, setWeatherProvider] = useState('openweathermap');
  const [useEnhancedService, setUseEnhancedService] = useState(false);
  const [useManualLocation, setUseManualLocation] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load initial settings from tiered storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedZipCode = await settingsStorageService.getValue('zipCode') || '90210';
        const savedWeatherApiKey = await settingsStorageService.getValue('weatherApiKey') || '';
        const savedAccuWeatherApiKey = await settingsStorageService.getValue('accuWeatherApiKey') || '';
        const savedWeatherProvider = await settingsStorageService.getValue('weatherProvider') || 'openweathermap';
        const savedUseEnhancedService = await settingsStorageService.getValue('useEnhancedService');
        const savedUseManualLocation = await settingsStorageService.getValue('useManualLocation');
        
        setZipCode(savedZipCode);
        setWeatherApiKey(savedWeatherApiKey);
        setAccuWeatherApiKey(savedAccuWeatherApiKey);
        setWeatherProvider(savedWeatherProvider);
        setUseEnhancedService(savedUseEnhancedService === 'true');
        setUseManualLocation(savedUseManualLocation !== 'false'); // Default to true
      } catch (error) {
        console.warn('Failed to load weather settings from tiered storage:', error);
        // Fallback to old storage method for compatibility
        try {
          const fallbackZipCode = localStorage.getItem('zipCode') || '90210';
          const fallbackWeatherApiKey = localStorage.getItem('weatherApiKey') || '';
          const fallbackAccuWeatherApiKey = localStorage.getItem('accuWeatherApiKey') || '';
          const fallbackWeatherProvider = localStorage.getItem('weatherProvider') || 'openweathermap';
          const fallbackUseEnhancedService = localStorage.getItem('useEnhancedService');
          const fallbackUseManualLocation = localStorage.getItem('useManualLocation');
          
          setZipCode(fallbackZipCode);
          setWeatherApiKey(fallbackWeatherApiKey);
          setAccuWeatherApiKey(fallbackAccuWeatherApiKey);
          setWeatherProvider(fallbackWeatherProvider);
          setUseEnhancedService(fallbackUseEnhancedService === 'true');
          setUseManualLocation(fallbackUseManualLocation !== 'false'); // Default to true
        } catch (fallbackError) {
          console.warn('Failed to load weather settings from fallback:', fallbackError);
        }
      } finally {
        setIsInitialized(true);
      }
    };
    
    loadSettings();
  }, []);

  // Auto-save zip code to tiered storage (only after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    
    settingsStorageService.setValue('zipCode', zipCode).catch(error => {
      console.warn('Failed to save zipCode to tiered storage:', error);
      localStorage.setItem('zipCode', zipCode);
    });
  }, [zipCode, isInitialized]);

  // Auto-save weather API key to tiered storage (only after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    
    settingsStorageService.setValue('weatherApiKey', weatherApiKey).catch(error => {
      console.warn('Failed to save weatherApiKey to tiered storage:', error);
      localStorage.setItem('weatherApiKey', weatherApiKey);
    });
  }, [weatherApiKey, isInitialized]);

  // Auto-save AccuWeather API key to tiered storage (only after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    
    settingsStorageService.setValue('accuWeatherApiKey', accuWeatherApiKey).catch(error => {
      console.warn('Failed to save accuWeatherApiKey to tiered storage:', error);
      localStorage.setItem('accuWeatherApiKey', accuWeatherApiKey);
    });
  }, [accuWeatherApiKey, isInitialized]);

  // Auto-save weather provider to tiered storage (only after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    
    settingsStorageService.setValue('weatherProvider', weatherProvider).catch(error => {
      console.warn('Failed to save weatherProvider to tiered storage:', error);
      localStorage.setItem('weatherProvider', weatherProvider);
    });
  }, [weatherProvider, isInitialized]);

  // Auto-save enhanced service setting to tiered storage (only after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    
    settingsStorageService.setValue('useEnhancedService', useEnhancedService.toString()).catch(error => {
      console.warn('Failed to save useEnhancedService to tiered storage:', error);
      localStorage.setItem('useEnhancedService', useEnhancedService.toString());
    });
  }, [useEnhancedService, isInitialized]);

  // Auto-save manual location setting to tiered storage (only after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    
    settingsStorageService.setValue('useManualLocation', useManualLocation.toString()).catch(error => {
      console.warn('Failed to save useManualLocation to tiered storage:', error);
      localStorage.setItem('useManualLocation', useManualLocation.toString());
    });
  }, [useManualLocation, isInitialized]);

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

  /**
   * Enhanced AccuWeather API key setter with progressive validation
   */
  const setValidatedAccuWeatherApiKey = (apiKey: string) => {
    // Always allow the input to be set for real-time typing
    setAccuWeatherApiKey(apiKey);
    
    // Only log validation errors for non-empty invalid inputs
    if (apiKey.trim() !== '') {
      const validation = InputValidator.validateApiKey(apiKey);
      if (!validation.isValid) {
        console.warn('Invalid AccuWeather API key format:', validation.error);
      }
    }
  };

  return {
    zipCode,
    setZipCode: setValidatedZipCode,
    weatherApiKey,
    setWeatherApiKey: setValidatedWeatherApiKey,
    accuWeatherApiKey,
    setAccuWeatherApiKey: setValidatedAccuWeatherApiKey,
    weatherProvider,
    setWeatherProvider,
    useEnhancedService,
    setUseEnhancedService,
    useManualLocation,
    setUseManualLocation,
  };
};
