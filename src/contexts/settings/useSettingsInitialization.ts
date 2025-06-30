
/**
 * Settings Initialization Hook
 * 
 * Handles the loading and initialization of all application settings
 * from both secure and regular storage on app startup.
 */

import { useEffect } from 'react';
import { SettingsStorage } from './settingsStorage';
import { useSecurity } from '../SecurityContext';

interface UseSettingsInitializationProps {
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setDefaultView: (view: 'month' | 'week' | 'timeline') => void;
  setZipCode: (zipCode: string) => void;
  setWeatherApiKey: (apiKey: string) => void;
  setPublicAlbumUrl: (url: string) => void;
  setGithubOwner: (owner: string) => void;
  setGithubRepo: (repo: string) => void;
  setBackgroundDuration: (duration: number) => void;
  setSelectedAlbum: (album: string) => void;
}

export const useSettingsInitialization = (props: UseSettingsInitializationProps) => {
  const { isSecurityEnabled, hasLockedData, isInitialized } = useSecurity();

  useEffect(() => {
    const initializeSettings = async () => {
      if (!isInitialized) return;

      console.log('initializeSettings - Security state:', { isSecurityEnabled, hasLockedData });

      try {
        const settings = await SettingsStorage.loadAllSettings();

        // Initialize non-sensitive settings always
        if (settings.theme) {
          props.setTheme(settings.theme);
        }
        if (settings.defaultView) {
          props.setDefaultView(settings.defaultView);
        }
        if (settings.backgroundDuration) {
          props.setBackgroundDuration(parseInt(settings.backgroundDuration));
        }
        if (settings.selectedAlbum) {
          props.setSelectedAlbum(settings.selectedAlbum);
        }

        // Handle sensitive settings based on security state
        if (hasLockedData) {
          // Clear sensitive settings when locked to show empty fields
          console.log('initializeSettings - Clearing sensitive settings (locked)');
          props.setZipCode('');
          props.setWeatherApiKey('');
          props.setPublicAlbumUrl('');
          props.setGithubOwner('');
          props.setGithubRepo('');
        } else if (isSecurityEnabled || !isSecurityEnabled) {
          // Load sensitive settings when unlocked or when security is disabled
          console.log('initializeSettings - Loading sensitive settings');
          if (settings.zipCode) {
            props.setZipCode(settings.zipCode);
          }
          if (settings.weatherApiKey) {
            props.setWeatherApiKey(settings.weatherApiKey);
          }
          if (settings.publicAlbumUrl) {
            props.setPublicAlbumUrl(settings.publicAlbumUrl);
          }
          if (settings.githubOwner) {
            props.setGithubOwner(settings.githubOwner);
          }
          if (settings.githubRepo) {
            props.setGithubRepo(settings.githubRepo);
          }
        }
      } catch (error) {
        console.error('Failed to initialize settings:', error);
      }
    };

    initializeSettings();
  }, [isInitialized, isSecurityEnabled, hasLockedData]);

  // Re-initialize sensitive settings when security is unlocked
  useEffect(() => {
    const reloadSensitiveSettings = async () => {
      if (hasLockedData || !isInitialized) return;

      console.log('reloadSensitiveSettings - Reloading after unlock');

      try {
        const settings = await SettingsStorage.loadAllSettings();
        
        if (settings.zipCode) {
          props.setZipCode(settings.zipCode);
        }
        if (settings.weatherApiKey) {
          props.setWeatherApiKey(settings.weatherApiKey);
        }
        if (settings.publicAlbumUrl) {
          props.setPublicAlbumUrl(settings.publicAlbumUrl);
        }
        if (settings.githubOwner) {
          props.setGithubOwner(settings.githubOwner);
        }
        if (settings.githubRepo) {
          props.setGithubRepo(settings.githubRepo);
        }
      } catch (error) {
        console.error('Failed to reload sensitive settings:', error);
      }
    };

    reloadSensitiveSettings();
  }, [isSecurityEnabled, hasLockedData, isInitialized]);
};
