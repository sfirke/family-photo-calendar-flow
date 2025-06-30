
/**
 * Settings Initialization Hook
 * 
 * Handles loading and initializing all settings from storage on app startup.
 */

import { useEffect } from 'react';
import { SettingsStorage } from './settingsStorage';

interface SettingsSetters {
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setDefaultView: (view: 'month' | 'week' | 'timeline') => void;
  setZipCode: (zipCode: string) => void;
  setWeatherApiKey: (apiKey: string) => void;
  setPublicAlbumUrl: (url: string) => void;
  setGithubOwner: (owner: string) => void;
  setGithubRepo: (repo: string) => void;
  setBackgroundDuration: (duration: number) => void;
  setSelectedAlbum: (albumId: string | null) => void;
}

export const useSettingsInitialization = (setters: SettingsSetters) => {
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await SettingsStorage.loadAllSettings();

      // Apply loaded settings with fallback to defaults
      if (settings.theme) setters.setTheme(settings.theme);
      if (settings.defaultView) setters.setDefaultView(settings.defaultView);
      if (settings.backgroundDuration) setters.setBackgroundDuration(parseInt(settings.backgroundDuration));
      if (settings.selectedAlbum) setters.setSelectedAlbum(settings.selectedAlbum);

      // Apply sensitive settings
      if (settings.zipCode) setters.setZipCode(settings.zipCode);
      if (settings.weatherApiKey) setters.setWeatherApiKey(settings.weatherApiKey);
      if (settings.publicAlbumUrl) setters.setPublicAlbumUrl(settings.publicAlbumUrl);
      if (settings.githubOwner) setters.setGithubOwner(settings.githubOwner);
      if (settings.githubRepo) setters.setGithubRepo(settings.githubRepo);
    };

    loadSettings();
  }, [setters]);
};
