
import { useEffect } from 'react';
import { useDisplaySettings } from './useDisplaySettings';
import { useWeatherSettings } from './useWeatherSettings';
import { usePhotoSettings } from './usePhotoSettings';
import { useGitHubSettings } from './useGitHubSettings';
import { useNotionSettings } from './useNotionSettings';

interface SettingsInitializationProps {
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setDefaultView: (view: 'month' | 'week' | 'timeline') => void;
  setZipCode: (zipCode: string) => void;
  setWeatherApiKey: (apiKey: string) => void;
  setPublicAlbumUrl: (url: string) => void;
  setGithubOwner: (owner: string) => void;
  setGithubRepo: (repo: string) => void;
  setNotionToken: (token: string) => void;
  setBackgroundDuration: (duration: number) => void;
  setSelectedAlbum: (albumId: string | null) => void;
}

export const useSettingsInitialization = (props: SettingsInitializationProps) => {
  const { initializeDisplaySettings } = useDisplaySettings();
  const { initializeWeatherSettings } = useWeatherSettings();
  const { initializePhotoSettings } = usePhotoSettings();
  const { initializeGitHubSettings } = useGitHubSettings();
  const { initializeNotionSettings } = useNotionSettings();

  useEffect(() => {
    const initializeAllSettings = async () => {
      await Promise.all([
        initializeDisplaySettings(),
        initializeWeatherSettings(),
        initializePhotoSettings(),
        initializeGitHubSettings(),
        initializeNotionSettings()
      ]);
    };

    initializeAllSettings();
  }, [
    initializeDisplaySettings,
    initializeWeatherSettings,
    initializePhotoSettings,
    initializeGitHubSettings,
    initializeNotionSettings
  ]);
};
