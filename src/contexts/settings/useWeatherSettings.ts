/**
 * Weather Settings Hook
 * 
 * Manages National Weather Service settings using tiered storage with secure handling and validation.
 */

import { useState, useEffect } from 'react';
import { InputValidator } from '@/utils/security/inputValidation';
import { settingsStorageService } from '@/services/settingsStorageService';
import { isTestEnv } from '@/utils/env';

export const useWeatherSettings = () => {
  const [coordinates, setCoordinatesState] = useState<string>('');
  const [useManualLocation, setUseManualLocationState] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const isTest = isTestEnv();

  // Load initial settings from tiered storage
  useEffect(() => {
    if (isTest) {
      setIsInitialized(true);
      return;
    }
    let cancelled = false;
    const loadSettings = async () => {
      try {
        const settings = await settingsStorageService.loadAllSettings();
        if (cancelled) return;
        setCoordinatesState(settings.coordinates || '');
        setUseManualLocationState(settings.useManualLocation ? JSON.parse(settings.useManualLocation) : false);
      } catch (error) {
        if (!cancelled) {
          console.warn('Failed to load weather settings from tiered storage:', error);
          const fallbackSettings = {
            coordinates: (typeof localStorage !== 'undefined' && localStorage.getItem('coordinates')) || '',
            useManualLocation: (typeof localStorage !== 'undefined' && localStorage.getItem('useManualLocation')) ? JSON.parse(localStorage.getItem('useManualLocation')!) : false
          };
          setCoordinatesState(fallbackSettings.coordinates);
          setUseManualLocationState(fallbackSettings.useManualLocation);
        }
      } finally {
        if (!cancelled) setIsInitialized(true);
      }
    };
    loadSettings();
    return () => { cancelled = true; };
  }, [isTest]);

  // Auto-save settings changes to tiered storage
  useEffect(() => {
    if (!isInitialized || isTest) return;
    let cancelled = false;
    const saveSettings = async () => {
      try {
        await settingsStorageService.setValue('coordinates', coordinates);
      } catch (error) {
        if (!cancelled) {
          console.warn('Failed to save coordinates to tiered storage, using localStorage fallback', error);
          if (typeof localStorage !== 'undefined') localStorage.setItem('coordinates', coordinates);
        }
      }
    };
    saveSettings();
    return () => { cancelled = true; };
  }, [coordinates, isInitialized, isTest]);

  useEffect(() => {
    if (!isInitialized || isTest) return;
    let cancelled = false;
    const saveSettings = async () => {
      try {
        await settingsStorageService.setValue('useManualLocation', useManualLocation.toString());
      } catch (error) {
        if (!cancelled) {
          console.warn('Failed to save useManualLocation to tiered storage, using localStorage fallback', error);
          if (typeof localStorage !== 'undefined') localStorage.setItem('useManualLocation', JSON.stringify(useManualLocation));
        }
      }
    };
    saveSettings();
    return () => { cancelled = true; };
  }, [useManualLocation, isInitialized, isTest]);

  // Input validation and enhanced setters
  const setValidatedCoordinates = (newCoordinates: string) => {
    // Basic validation for lat,lng format
    const coordinatePattern = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
    if (newCoordinates && !coordinatePattern.test(newCoordinates)) {
      console.warn('Invalid coordinates format. Expected "latitude,longitude"');
    }
    setCoordinatesState(newCoordinates);
  };

  // Convenience setter functions that match existing API
  const setCoordinates = setValidatedCoordinates;
  const setUseManualLocation = setUseManualLocationState;

  return {
    // Current values
    coordinates,
    useManualLocation,
    isInitialized,
    
    // Setter functions
    setCoordinates,
    setUseManualLocation,
    
    // Validated setters (for direct use if needed)
    setValidatedCoordinates
  };
};