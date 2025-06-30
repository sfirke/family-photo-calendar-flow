
/**
 * Settings Storage Utilities
 * 
 * Centralized storage management for application settings with
 * automatic encryption and migration between storage modes.
 */

import { SecureStorage } from '@/utils/security/secureStorage';

export class SettingsStorage {
  /**
   * Load all settings from appropriate storage on app initialization
   */
  static async loadAllSettings() {
    try {
      // Load non-sensitive settings from regular localStorage
      const nonSensitiveSettings = {
        theme: localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null,
        defaultView: localStorage.getItem('defaultView') as 'month' | 'week' | 'timeline' | null,
        backgroundDuration: localStorage.getItem('backgroundDuration'),
        selectedAlbum: localStorage.getItem('selectedAlbum'),
      };

      // Load sensitive settings from secure storage (with fallback to localStorage)
      let sensitiveSettings = {};
      try {
        sensitiveSettings = {
          zipCode: await SecureStorage.getItem('zipCode') || localStorage.getItem('zipCode'),
          weatherApiKey: await SecureStorage.getItem('weatherApiKey') || localStorage.getItem('weatherApiKey'),
          publicAlbumUrl: await SecureStorage.getItem('publicAlbumUrl') || localStorage.getItem('publicAlbumUrl'),
          githubOwner: await SecureStorage.getItem('githubOwner') || localStorage.getItem('githubOwner'),
          githubRepo: await SecureStorage.getItem('githubRepo') || localStorage.getItem('githubRepo'),
        };

        // Automatic migration: Move unencrypted sensitive data to secure storage
        if (SecureStorage.isEncryptionEnabled()) {
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
    const sensitiveKeys = ['zipCode', 'weatherApiKey', 'publicAlbumUrl', 'githubOwner', 'githubRepo'];
    
    for (const key of sensitiveKeys) {
      const oldValue = localStorage.getItem(key);
      if (oldValue) {
        try {
          await SecureStorage.setItem(key, oldValue);
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
      if (isSensitive && SecureStorage.isEncryptionEnabled()) {
        await SecureStorage.setItem(key, value);
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
      if (isSensitive && SecureStorage.isEncryptionEnabled()) {
        await SecureStorage.removeItem(key);
      }
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove ${key}:`, error);
    }
  }
}
