
/**
 * Settings Storage Utilities
 * 
 * Centralized storage management for application settings with
 * automatic encryption and migration between storage modes.
 */

import { secureStorage } from '@/utils/security/secureStorage';

interface LoadedSettings {
  theme?: 'light' | 'dark' | 'system' | null;
  defaultView?: 'month' | 'week' | 'timeline' | null;
  backgroundDuration?: string | null;
  selectedAlbum?: string | null;
  zipCode?: string | null;
  weatherApiKey?: string | null;
  publicAlbumUrl?: string | null;
  githubOwner?: string | null;
  githubRepo?: string | null;
  notionIntegrationToken?: string | null;
}

export class SettingsStorage {
  /**
   * Load all settings from appropriate storage on app initialization
   */
  static async loadAllSettings(): Promise<LoadedSettings> {
    try {
      // Load non-sensitive settings from regular localStorage
      const nonSensitiveSettings = {
        theme: localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null,
        defaultView: localStorage.getItem('defaultView') as 'month' | 'week' | 'timeline' | null,
        backgroundDuration: localStorage.getItem('backgroundDuration'),
        selectedAlbum: localStorage.getItem('selectedAlbum'),
      };

      // Load sensitive settings from secure storage (with fallback to localStorage)
      let sensitiveSettings: Partial<LoadedSettings> = {};
      try {
        sensitiveSettings = {
          zipCode: await secureStorage.retrieve('zipCode', 'defaultPassword') || localStorage.getItem('zipCode'),
          weatherApiKey: await secureStorage.retrieve('weatherApiKey', 'defaultPassword') || localStorage.getItem('weatherApiKey'),
          publicAlbumUrl: await secureStorage.retrieve('publicAlbumUrl', 'defaultPassword') || localStorage.getItem('publicAlbumUrl'),
          githubOwner: await secureStorage.retrieve('githubOwner', 'defaultPassword') || localStorage.getItem('githubOwner'),
          githubRepo: await secureStorage.retrieve('githubRepo', 'defaultPassword') || localStorage.getItem('githubRepo'),
          notionIntegrationToken: await secureStorage.retrieve('notionIntegrationToken', 'defaultPassword') || localStorage.getItem('notionIntegrationToken'),
        };

        // Automatic migration: Move unencrypted sensitive data to secure storage
        if (secureStorage.exists('test')) {
          await this.migrateSensitiveSettings();
        }
      } catch (error) {
        console.warn('Could not load secure settings:', error);
        // Fallback to localStorage
        sensitiveSettings = {
          zipCode: localStorage.getItem('zipCode'),
          weatherApiKey: localStorage.getItem('weatherApiKey'),
          publicAlbumUrl: localStorage.getItem('publicAlbumUrl'),
          githubOwner: localStorage.getItem('githubOwner'),
          githubRepo: localStorage.getItem('githubRepo'),
          notionIntegrationToken: localStorage.getItem('notionIntegrationToken'),
        };
      }

      return { ...nonSensitiveSettings, ...sensitiveSettings };
    } catch (error) {
      console.error('Error loading settings:', error);
      return {};
    }
  }

  /**
   * Migrate sensitive settings from localStorage to secure storage
   */
  private static async migrateSensitiveSettings() {
    const sensitiveKeys = ['zipCode', 'weatherApiKey', 'publicAlbumUrl', 'githubOwner', 'githubRepo', 'notionIntegrationToken'];
    
    for (const key of sensitiveKeys) {
      const oldValue = localStorage.getItem(key);
      if (oldValue) {
        try {
          await secureStorage.store(key, oldValue, 'defaultPassword');
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to migrate ${key}:`, error);
        }
      }
    }
  }

  /**
   * Save a setting to appropriate storage (secure or regular)
   */
  static async saveSetting(key: string, value: string, isSensitive: boolean = false) {
    try {
      if (isSensitive && secureStorage.exists('test')) {
        await secureStorage.store(key, value, 'defaultPassword');
        localStorage.removeItem(key); // Remove unencrypted version
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.warn(`Failed to save ${key} securely, using localStorage:`, error);
      localStorage.setItem(key, value);
    }
  }

  /**
   * Remove a setting from storage
   */
  static async removeSetting(key: string, isSensitive: boolean = false) {
    try {
      if (isSensitive && secureStorage.exists('test')) {
        secureStorage.remove(key);
      }
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove ${key}:`, error);
    }
  }
}
