
/**
 * Photo Settings Hook
 * 
 * Manages photo and background-related settings with secure storage and validation.
 */

import { useState, useEffect } from 'react';
import { InputValidator } from '@/utils/security/inputValidation';
import { SettingsStorage } from './settingsStorage';

export const usePhotoSettings = () => {
  const [publicAlbumUrl, setPublicAlbumUrl] = useState('');
  const [backgroundDuration, setBackgroundDuration] = useState(30); // Default 30 minutes
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);

  // Auto-save public album URL to appropriate storage
  useEffect(() => {
    SettingsStorage.saveSetting('publicAlbumUrl', publicAlbumUrl, true);
  }, [publicAlbumUrl]);

  // Auto-save background duration to localStorage
  useEffect(() => {
    localStorage.setItem('backgroundDuration', backgroundDuration.toString());
  }, [backgroundDuration]);

  // Auto-save selected album to localStorage
  useEffect(() => {
    if (selectedAlbum) {
      localStorage.setItem('selectedAlbum', selectedAlbum);
    } else {
      localStorage.removeItem('selectedAlbum');
    }
  }, [selectedAlbum]);

  /**
   * Enhanced public album URL setter with input validation
   */
  const setValidatedPublicAlbumUrl = (url: string) => {
    if (url === '') {
      setPublicAlbumUrl(url);
      return;
    }
    
    const validation = InputValidator.validateUrl(url);
    if (validation.isValid) {
      setPublicAlbumUrl(url);
    } else {
      console.warn('Invalid album URL:', validation.error);
    }
  };

  return {
    publicAlbumUrl,
    setPublicAlbumUrl: setValidatedPublicAlbumUrl,
    backgroundDuration,
    setBackgroundDuration,
    selectedAlbum,
    setSelectedAlbum,
  };
};
