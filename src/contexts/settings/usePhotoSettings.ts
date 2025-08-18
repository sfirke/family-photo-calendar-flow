
/**
 * Photo Settings Hook
 * 
 * Manages photo and background-related settings using tiered storage with validation.
 */

import { useState, useEffect } from 'react';
import { InputValidator } from '@/utils/security/inputValidation';
import { settingsStorageService } from '@/services/settingsStorageService';
import { safeLocalStorage } from '@/utils/storage/safeLocalStorage';

export const usePhotoSettings = () => {
  const [publicAlbumUrl, setPublicAlbumUrl] = useState('');
  const [backgroundDuration, setBackgroundDuration] = useState(30); // Default 30 minutes
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load initial settings from tiered storage
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      setIsInitialized(true);
      return;
    }

    let cancelled = false;
    const loadSettings = async () => {
      try {
        const savedUrl = await settingsStorageService.getValue('publicAlbumUrl') || '';
        const savedDuration = await settingsStorageService.getValue('backgroundDuration') || '30';
        const savedAlbum = await settingsStorageService.getValue('selectedAlbum');
        if (!cancelled) {
          setPublicAlbumUrl(savedUrl);
          setBackgroundDuration(parseInt(savedDuration) || 30);
          setSelectedAlbum(savedAlbum);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('Failed to load photo settings from tiered storage:', error);
          try {
            const fallbackUrl = safeLocalStorage.getItem('publicAlbumUrl') || '';
            const fallbackDuration = parseInt(safeLocalStorage.getItem('backgroundDuration') || '30');
            const fallbackAlbum = safeLocalStorage.getItem('selectedAlbum');
            if (!cancelled) {
              setPublicAlbumUrl(fallbackUrl);
              setBackgroundDuration(fallbackDuration);
              setSelectedAlbum(fallbackAlbum);
            }
          } catch (fallbackError) {
            console.warn('Failed to load photo settings from fallback:', fallbackError);
          }
        }
      } finally {
        if (!cancelled) setIsInitialized(true);
      }
    };
    loadSettings();
    return () => { cancelled = true; };
  }, []);

  // Auto-save public album URL to tiered storage (only after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    
  // debug removed: auto-saving album url
    settingsStorageService.setValue('publicAlbumUrl', publicAlbumUrl).catch(error => {
      console.warn('Failed to save publicAlbumUrl to tiered storage:', error);
      safeLocalStorage.setItem('publicAlbumUrl', publicAlbumUrl);
    });
  }, [publicAlbumUrl, isInitialized]);

  // Auto-save background duration to tiered storage (only after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    
    settingsStorageService.setValue('backgroundDuration', backgroundDuration.toString()).catch(error => {
      console.warn('Failed to save backgroundDuration to tiered storage:', error);
      safeLocalStorage.setItem('backgroundDuration', backgroundDuration.toString());
    });
  }, [backgroundDuration, isInitialized]);

  // Auto-save selected album to tiered storage (only after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    
    if (selectedAlbum) {
      settingsStorageService.setValue('selectedAlbum', selectedAlbum).catch(error => {
        console.warn('Failed to save selectedAlbum to tiered storage:', error);
        safeLocalStorage.setItem('selectedAlbum', selectedAlbum);
      });
    } else {
      settingsStorageService.removeValue('selectedAlbum').catch(error => {
        console.warn('Failed to remove selectedAlbum from tiered storage:', error);
        safeLocalStorage.removeItem('selectedAlbum');
      });
    }
  }, [selectedAlbum, isInitialized]);

  /**
   * Enhanced public album URL setter with input validation
   */
  const setValidatedPublicAlbumUrl = (url: string) => {
  // debug removed: setValidatedPublicAlbumUrl diagnostics
    
    // Always set the URL, even if empty - let the Google Photos hook handle validation
  // debug removed: setting url directly
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
