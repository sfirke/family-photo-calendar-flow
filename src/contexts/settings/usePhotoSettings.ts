
/**
 * Photo Settings Hook
 * 
 * Manages photo and background-related settings using tiered storage with validation.
 */

import { useState, useEffect } from 'react';
import { InputValidator } from '@/utils/security/inputValidation';
import { settingsStorageService } from '@/services/settingsStorageService';

export const usePhotoSettings = () => {
  const [publicAlbumUrl, setPublicAlbumUrl] = useState('');
  const [backgroundDuration, setBackgroundDuration] = useState(30); // Default 30 minutes
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);

  // Load initial settings from tiered storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedUrl = await settingsStorageService.getValue('publicAlbumUrl') || '';
        const savedDuration = await settingsStorageService.getValue('backgroundDuration') || '30';
        const savedAlbum = await settingsStorageService.getValue('selectedAlbum');
        
        console.log('🖼️ usePhotoSettings - Loading saved settings from tiered storage:');
        console.log('🖼️ savedUrl:', savedUrl);
        console.log('🖼️ savedDuration:', savedDuration);
        console.log('🖼️ savedAlbum:', savedAlbum);
        
        setPublicAlbumUrl(savedUrl);
        setBackgroundDuration(parseInt(savedDuration) || 30);
        setSelectedAlbum(savedAlbum);
      } catch (error) {
        console.warn('Failed to load photo settings from tiered storage:', error);
        // Fallback to localStorage for compatibility
        try {
          const fallbackUrl = localStorage.getItem('publicAlbumUrl') || '';
          const fallbackDuration = parseInt(localStorage.getItem('backgroundDuration') || '30');
          const fallbackAlbum = localStorage.getItem('selectedAlbum');
          
          console.log('🖼️ usePhotoSettings - Loading fallback settings from localStorage');
          setPublicAlbumUrl(fallbackUrl);
          setBackgroundDuration(fallbackDuration);
          setSelectedAlbum(fallbackAlbum);
        } catch (fallbackError) {
          console.warn('Failed to load photo settings from fallback:', fallbackError);
        }
      }
    };

    loadSettings();
  }, []);

  // Auto-save public album URL to tiered storage
  useEffect(() => {
    console.log('🖼️ usePhotoSettings - Auto-saving publicAlbumUrl to tiered storage:', publicAlbumUrl);
    settingsStorageService.setValue('publicAlbumUrl', publicAlbumUrl).catch(error => {
      console.warn('Failed to save publicAlbumUrl to tiered storage:', error);
      localStorage.setItem('publicAlbumUrl', publicAlbumUrl);
    });
  }, [publicAlbumUrl]);

  // Auto-save background duration to tiered storage
  useEffect(() => {
    settingsStorageService.setValue('backgroundDuration', backgroundDuration.toString()).catch(error => {
      console.warn('Failed to save backgroundDuration to tiered storage:', error);
      localStorage.setItem('backgroundDuration', backgroundDuration.toString());
    });
  }, [backgroundDuration]);

  // Auto-save selected album to tiered storage
  useEffect(() => {
    if (selectedAlbum) {
      settingsStorageService.setValue('selectedAlbum', selectedAlbum).catch(error => {
        console.warn('Failed to save selectedAlbum to tiered storage:', error);
        localStorage.setItem('selectedAlbum', selectedAlbum);
      });
    } else {
      settingsStorageService.removeValue('selectedAlbum').catch(error => {
        console.warn('Failed to remove selectedAlbum from tiered storage:', error);
        localStorage.removeItem('selectedAlbum');
      });
    }
  }, [selectedAlbum]);

  /**
   * Enhanced public album URL setter with input validation
   */
  const setValidatedPublicAlbumUrl = (url: string) => {
    console.log('🖼️ usePhotoSettings - setValidatedPublicAlbumUrl called with:', url);
    console.log('🖼️ usePhotoSettings - URL type:', typeof url);
    console.log('🖼️ usePhotoSettings - URL length:', url?.length);
    
    // Always set the URL, even if empty - let the Google Photos hook handle validation
    console.log('🖼️ usePhotoSettings - Setting URL directly (validation moved to useGooglePhotos)');
    setPublicAlbumUrl(url);
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
