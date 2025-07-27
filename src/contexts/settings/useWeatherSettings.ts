/**
 * Weather Settings Hook
 * 
 * Manages National Weather Service settings using tiered storage with secure handling and validation.
 */

import { useState, useEffect } from 'react';
import { InputValidator } from '@/utils/security/inputValidation';
import { settingsStorageService } from '@/services/settingsStorageService';

export const useWeatherSettings = () => {
  const [coordinates, setCoordinatesState] = useState<string>('');
  const [useManualLocation, setUseManualLocationState] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Load initial settings from tiered storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsStorageService.loadAllSettings();
        
        // Load weather settings from tiered storage with fallback to localStorage
        setCoordinatesState(settings.coordinates || '');
        setUseManualLocationState(settings.useManualLocation ? JSON.parse(settings.useManualLocation) : false);
      } catch (error) {
        console.warn('Failed to load weather settings from tiered storage:', error);
        // Fallback to localStorage
        const fallbackSettings = {
          coordinates: localStorage.getItem('coordinates') || '',
          useManualLocation: localStorage.getItem('useManualLocation') ? JSON.parse(localStorage.getItem('useManualLocation')!) : false
        };
        
        setCoordinatesState(fallbackSettings.coordinates);
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
        await settingsStorageService.setValue('coordinates', coordinates);
      } catch (error) {
        console.warn('Failed to save coordinates to tiered storage, using localStorage fallback', error);
        localStorage.setItem('coordinates', coordinates);
      }
    };
    saveSettings();
  }, [coordinates, isInitialized]);

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