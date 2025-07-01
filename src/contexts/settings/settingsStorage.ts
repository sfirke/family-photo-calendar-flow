
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

// Type-safe sensitive keys with const assertion
const SENSITIVE_KEYS = ['zipCode', 'weatherApiKey', 'publicAlbumUrl', 'githubOwner', 'githubRepo', 'notionIntegrationToken'] as const;
type SensitiveKey = typeof SENSITIVE_KEYS[number];

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

      // Load sensitive settings with type-safe assignment
      const sensitiveSettings: Partial<LoadedSettings> = {};
      
      for (const key of SENSITIVE_KEYS) {
        try {
          const secureValue = await this.retrieveWithFallback(key);
          if (secureValue) {
            this.assignSensitiveSetting(sensitiveSettings, key, secureValue);
          }
        } catch (error) {
          console.warn(`Failed to load ${key}:`, error);
          // Fallback to localStorage
          const fallbackValue = localStorage.getItem(key);
          if (fallbackValue) {
            this.assignSensitiveSetting(sensitiveSettings, key, fallbackValue);
          }
        }
      }

      return { ...nonSensitiveSettings, ...sensitiveSettings };
    } catch (error) {
      console.error('Error loading settings:', error);
      return {};
    }
  }

  /**
   * Type-safe assignment of sensitive settings
   */
  private static assignSensitiveSetting(
    settings: Partial<LoadedSettings>, 
    key: SensitiveKey, 
    value: string
  ): void {
    switch (key) {
      case 'zipCode':
        settings.zipCode = value;
        break;
      case 'weatherApiKey':
        settings.weatherApiKey = value;
        break;
      case 'publicAlbumUrl':
        settings.publicAlbumUrl = value;
        break;
      case 'githubOwner':
        settings.githubOwner = value;
        break;
      case 'githubRepo':
        settings.githubRepo = value;
        break;
      case 'notionIntegrationToken':
        settings.notionIntegrationToken = value;
        break;
      default:
        console.warn(`Unknown sensitive key: ${key}`);
    }
  }

  /**
   * Retrieve a setting with automatic fallback handling
   */
  private static async retrieveWithFallback(key: string): Promise<string | null> {
    try {
      // Try secure storage first
      const secureValue = await secureStorage.retrieve(key, 'defaultPassword');
      if (secureValue) {
        return secureValue;
      }
    } catch (error) {
      console.warn(`Secure storage failed for ${key}, trying localStorage:`, error);
    }
    
    // Fallback to localStorage
    const localValue = localStorage.getItem(key);
    
    // If we found a plain text value and secure storage is available, migrate it
    if (localValue && secureStorage.exists('test')) {
      try {
        await secureStorage.store(key, localValue, 'defaultPassword');
        console.log(`Migrated ${key} to secure storage`);
        localStorage.removeItem(key);
        return localValue;
      } catch (migrationError) {
        console.warn(`Failed to migrate ${key}:`, migrationError);
      }
    }
    
    return localValue;
  }

  /**
   * Migrate sensitive settings from localStorage to secure storage
   */
  private static async migrateSensitiveSettings() {
    for (const key of SENSITIVE_KEYS) {
      const oldValue = localStorage.getItem(key);
      if (oldValue) {
        try {
          await secureStorage.store(key, oldValue, 'defaultPassword');
          localStorage.removeItem(key);
          console.log(`Successfully migrated ${key}`);
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

  /**
   * Clear corrupted data and reset to defaults
   */
  static async clearCorruptedData() {
    for (const key of SENSITIVE_KEYS) {
      try {
        secureStorage.remove(key);
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to clear ${key}:`, error);
      }
    }
    
    console.log('Cleared potentially corrupted settings data');
  }
}
