
import { useEffect } from 'react';
import { SettingsStorage } from './settingsStorage';

interface InitializationCallbacks {
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setDefaultView: (view: 'month' | 'week' | 'timeline') => void;
  setZipCode: (zipCode: string) => void;
  setWeatherApiKey: (apiKey: string) => void;
  setPublicAlbumUrl: (url: string) => void;
  setGithubOwner: (owner: string) => void;
  setGithubRepo: (repo: string) => void;
  setNotionIntegrationToken: (token: string) => void;
  setBackgroundDuration: (duration: number) => void;
  setSelectedAlbum: (albumId: string | null) => void;
}

export const useSettingsInitialization = (callbacks: InitializationCallbacks) => {
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        const settings = await SettingsStorage.loadAllSettings();

        if (settings.theme) callbacks.setTheme(settings.theme);
        if (settings.defaultView) callbacks.setDefaultView(settings.defaultView);
        if (settings.zipCode) callbacks.setZipCode(settings.zipCode);
        if (settings.weatherApiKey) callbacks.setWeatherApiKey(settings.weatherApiKey);
        if (settings.publicAlbumUrl) callbacks.setPublicAlbumUrl(settings.publicAlbumUrl);
        if (settings.githubOwner) callbacks.setGithubOwner(settings.githubOwner);
        if (settings.githubRepo) callbacks.setGithubRepo(settings.githubRepo);
        if (settings.notionIntegrationToken) callbacks.setNotionIntegrationToken(settings.notionIntegrationToken);
        if (settings.backgroundDuration) callbacks.setBackgroundDuration(parseInt(settings.backgroundDuration, 10));
        if (settings.selectedAlbum !== undefined) callbacks.setSelectedAlbum(settings.selectedAlbum);
      } catch (error) {
        console.error('Failed to initialize settings:', error);
      }
    };

    initializeSettings();
  }, [callbacks]);
};
