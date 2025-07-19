
/**
 * SettingsContext - Application Configuration Management
 * 
 * Refactored centralized settings management for the Family Calendar application.
 * Now uses smaller, focused hooks for different setting categories.
 * Handles both secure and non-secure settings with automatic encryption
 * when security is enabled.
 */

import React, { createContext, useContext } from 'react';
import { SettingsContextType } from './settings/types';
import { useDisplaySettings } from './settings/useDisplaySettings';
import { useWeatherSettings } from './settings/useWeatherSettings';
import { usePhotoSettings } from './settings/usePhotoSettings';
import { useGitHubSettings } from './settings/useGitHubSettings';
import { useNotionSettings } from './settings/useNotionSettings';
import { useSettingsInitialization } from './settings/useSettingsInitialization';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * Settings Provider Component
 * 
 * Manages all application settings using focused hooks for different categories.
 * Automatically encrypts sensitive data when security is enabled and
 * provides seamless migration between storage modes.
 */
export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  // Use category-specific hooks
  const displaySettings = useDisplaySettings();
  const weatherSettings = useWeatherSettings();
  const photoSettings = usePhotoSettings();
  const githubSettings = useGitHubSettings();
  const notionSettings = useNotionSettings();

  // Initialize all settings from storage
  useSettingsInitialization({
    setTheme: displaySettings.setTheme,
    setDefaultView: displaySettings.setDefaultView,
    setZipCode: weatherSettings.setZipCode,
    setWeatherApiKey: weatherSettings.setWeatherApiKey,
    setUseManualLocation: weatherSettings.setUseManualLocation,
    setPublicAlbumUrl: photoSettings.setPublicAlbumUrl,
    setGithubOwner: githubSettings.setGithubOwner,
    setGithubRepo: githubSettings.setGithubRepo,
    setNotionToken: notionSettings.setNotionToken,
    setNotionDatabaseId: notionSettings.setNotionDatabaseId,
    setBackgroundDuration: photoSettings.setBackgroundDuration,
    setSelectedAlbum: photoSettings.setSelectedAlbum,
  });

  return (
    <SettingsContext.Provider
      value={{
        ...displaySettings,
        ...weatherSettings,
        ...photoSettings,
        ...githubSettings,
        ...notionSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Hook to access settings context
 * 
 * Must be used within a SettingsProvider component.
 * Provides access to all application settings and their setters.
 * 
 * @throws Error if used outside SettingsProvider
 */
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
