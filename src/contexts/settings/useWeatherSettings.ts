/**
 * Weather Settings Hook
 * 
 * Manages AccuWeather-only settings using tiered storage with secure handling and validation.
 */

import { useState, useEffect } from 'react';
import { InputValidator } from '@/utils/security/inputValidation';
import { settingsStorageService } from '@/services/settingsStorageService';

export const useWeatherSettings = () => {
  const [zipCode, setZipCodeState] = useState<string>('');
  const [weatherApiKey, setWeatherApiKeyState] = useState<string>('');
  const [locationKey, setLocationKeyState] = useState<string>('');
  const [useManualLocation, setUseManualLocationState] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Load initial settings from tiered storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsStorageService.loadAllSettings();
        
        // Load weather settings from tiered storage with fallback to localStorage
        setZipCodeState(settings.zipCode || '');
        setWeatherApiKeyState(settings.weatherApiKey || '');
        setLocationKeyState(settings.locationKey || '');
        setUseManualLocationState(settings.useManualLocation || false);
      } catch (error) {
        console.warn('Failed to load weather settings from tiered storage:', error);
        // Fallback to localStorage
        const fallbackSettings = {
          zipCode: localStorage.getItem('zipCode') || '',
          weatherApiKey: localStorage.getItem('weatherApiKey') || '',
          locationKey: localStorage.getItem('locationKey') || '',
          useManualLocation: localStorage.getItem('useManualLocation') ? JSON.parse(localStorage.getItem('useManualLocation')!) : false
        };
        
        setZipCodeState(fallbackSettings.zipCode);
        setWeatherApiKeyState(fallbackSettings.weatherApiKey);
        setLocationKeyState(fallbackSettings.locationKey);
        setUseManualLocationState(fallbackSettings.useManualLocation);
      } finally {
        setIsInitialized(true);
      }
    };
    
    loadSettings();
  }, []);

  // Auto-save settings changes to tiered storage
  useEffect(() => {
    if (!isInitialized) return;
    const saveSettings = async () => {
      try {
        await settingsStorageService.setValue('zipCode', zipCode);
      } catch (error) {
        console.warn('Failed to save zipCode to tiered storage, using localStorage fallback', error);
        localStorage.setItem('zipCode', zipCode);
      }
    };
    saveSettings();
  }, [zipCode, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    const saveSettings = async () => {
      try {
        await settingsStorageService.setValue('weatherApiKey', weatherApiKey);
      } catch (error) {
        console.warn('Failed to save weatherApiKey to tiered storage, using localStorage fallback', error);
        localStorage.setItem('weatherApiKey', weatherApiKey);
      }
    };
    saveSettings();
  }, [weatherApiKey, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    const saveSettings = async () => {
      try {
        await settingsStorageService.setValue('locationKey', locationKey);
      } catch (error) {
        console.warn('Failed to save locationKey to tiered storage, using localStorage fallback', error);
        localStorage.setItem('locationKey', locationKey);
      }
    };
    saveSettings();
  }, [locationKey, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    const saveSettings = async () => {
      try {
        await settingsStorageService.setValue('useManualLocation', useManualLocation.toString());
      } catch (error) {
        console.warn('Failed to save useManualLocation to tiered storage, using localStorage fallback', error);
        localStorage.setItem('useManualLocation', JSON.stringify(useManualLocation));
      }
    };
    saveSettings();
  }, [useManualLocation, isInitialized]);

  // Input validation and enhanced setters
  const setValidatedZipCode = (newZipCode: string) => {
    const validation = InputValidator.validateZipCode(newZipCode);
    if (!validation.isValid) {
      console.warn('Invalid zip code:', validation.error);
    }
    setZipCodeState(newZipCode);
  };

  const setValidatedWeatherApiKey = (apiKey: string) => {
    const validation = InputValidator.validateApiKey(apiKey);
    if (!validation.isValid) {
      console.warn('Invalid API key:', validation.error);
    }
    setWeatherApiKeyState(apiKey);
  };

  // Convenience setter functions that match existing API
  const setZipCode = setValidatedZipCode;
  const setWeatherApiKey = setValidatedWeatherApiKey;
  const setLocationKey = setLocationKeyState;
  const setUseManualLocation = setUseManualLocationState;

  return {
    // Current values
    zipCode,
    weatherApiKey,
    locationKey,
    useManualLocation,
    isInitialized,
    
    // Setter functions
    setZipCode,
    setWeatherApiKey,
    setLocationKey,
    setUseManualLocation,
    
    // Validated setters (for direct use if needed)
    setValidatedZipCode,
    setValidatedWeatherApiKey
  };
};