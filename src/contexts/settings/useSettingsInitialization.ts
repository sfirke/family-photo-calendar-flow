
/**
 * Settings Initialization Hook
 * 
 * Handles loading all settings from storage on application startup.
 * Manages the initialization sequence and provides loading state.
 */

import { useEffect, useState } from 'react';
import { SettingsStorage } from './settingsStorage';

interface InitializationProps {
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setDefaultView: (view: 'month' | 'week' | 'timeline') => void;
  setZipCode: (zipCode: string) => void;
  setWeatherApiKey: (apiKey: string) => void;
  setAccuWeatherApiKey: (apiKey: string) => void;
  setWeatherProvider: (provider: string) => void;
  setUseManualLocation: (useManual: boolean) => void;
  setPublicAlbumUrl: (url: string) => void;
  setGithubOwner: (owner: string) => void;
  setGithubRepo: (repo: string) => void;
  setNotionToken: (token: string) => void;
  setNotionDatabaseId: (databaseId: string) => void;
  setBackgroundDuration: (duration: number) => void;
  setSelectedAlbum: (albumId: string | null) => void;
}

/**
 * Initialize all application settings from storage
 * 
 * Loads settings from both secure and regular storage, with automatic
 * migration between storage types when security is enabled/disabled.
 */
export const useSettingsInitialization = (props: InitializationProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeSettings = async () => {
      try {
        console.log('🔧 Initializing settings from tiered storage...');
        
        // Preload cache for common settings
        await SettingsStorage.preloadCache();
        
        // Load all settings using tiered storage
        const settings = await SettingsStorage.loadAllSettings();
        console.log('🔧 Loaded settings from tiered storage:', settings);

        // Apply non-sensitive settings
        if (settings.theme) {
          props.setTheme(settings.theme);
        }
        if (settings.defaultView) {
          props.setDefaultView(settings.defaultView);
        }
        if (settings.backgroundDuration) {
          props.setBackgroundDuration(parseInt(settings.backgroundDuration) || 30);
        }
        if (settings.selectedAlbum) {
          props.setSelectedAlbum(settings.selectedAlbum);
        }

        // Apply sensitive settings
        if (settings.zipCode) {
          props.setZipCode(settings.zipCode);
        }
        if (settings.weatherApiKey) {
          props.setWeatherApiKey(settings.weatherApiKey);
        }
        if (settings.accuWeatherApiKey) {
          props.setAccuWeatherApiKey(settings.accuWeatherApiKey);
        }
        if (settings.weatherProvider) {
          props.setWeatherProvider(settings.weatherProvider);
        }
        if (settings.useManualLocation !== undefined) {
          props.setUseManualLocation(settings.useManualLocation === 'true');
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
        if (settings.notionToken) {
          props.setNotionToken(settings.notionToken);
        }
        if (settings.notionDatabaseId) {
          props.setNotionDatabaseId(settings.notionDatabaseId);
        }

        console.log('✅ Settings initialization completed');
      } catch (error) {
        console.error('❌ Settings initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSettings();
  }, []); // Empty dependency array - run once on mount

  return { isLoading };
};
