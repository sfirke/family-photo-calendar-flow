/**
 * Settings Storage Service using IndexedDB
 * 
 * Centralized settings management using IndexedDB for persistence
 * with fallback to localStorage for compatibility.
 */

import { secureStorage } from '@/utils/security/secureStorage';

const DB_NAME = 'FamilyCalendarSettingsDB';
const DB_VERSION = 1;
const SETTINGS_STORE = 'settings';

interface StoredSetting {
  id: string;
  value: string;
  isSensitive: boolean;
  updatedAt: Date;
}

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
  notionToken?: string | null;
  notionDatabaseId?: string | null;
}

class SettingsStorageService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      // Close existing connection if any
      if (this.db) {
        this.db.close();
        this.db = null;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Settings IndexedDB error:', request.error);
        this.initPromise = null;
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('Settings IndexedDB connection established');
        
        // Handle unexpected close
        this.db.onclose = () => {
          console.warn('Settings IndexedDB connection closed');
          this.db = null;
          this.initPromise = null;
        };
        
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('Upgrading Settings IndexedDB schema');
        
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          const store = db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
          store.createIndex('isSensitive', 'isSensitive', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          console.log('Created settings object store');
        }
      };
    });

    return this.initPromise;
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  /**
   * Save a setting to IndexedDB
   */
  async saveSetting(key: string, value: string, isSensitive: boolean = false): Promise<void> {
    try {
      const db = await this.ensureDB();
      
      const setting: StoredSetting = {
        id: key,
        value: isSensitive && secureStorage.exists('test') ? 
          await secureStorage.store(key, value, 'defaultPassword').then(() => value) : value,
        isSensitive,
        updatedAt: new Date()
      };

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([SETTINGS_STORE], 'readwrite');
        
        transaction.oncomplete = () => {
          // Also save to localStorage as fallback
          if (!isSensitive || !secureStorage.exists('test')) {
            localStorage.setItem(key, value);
          }
          console.log(`Setting '${key}' saved successfully`);
          resolve();
        };
        
        transaction.onerror = () => {
          console.error(`Error saving setting '${key}':`, transaction.error);
          // Fallback to localStorage
          localStorage.setItem(key, value);
          resolve(); // Don't reject, we have fallback
        };

        const store = transaction.objectStore(SETTINGS_STORE);
        store.put(setting);
      });
    } catch (error) {
      console.warn(`Failed to save setting '${key}' to IndexedDB, using localStorage:`, error);
      localStorage.setItem(key, value);
    }
  }

  /**
   * Get a setting from IndexedDB with localStorage fallback
   */
  async getSetting(key: string, isSensitive: boolean = false): Promise<string | null> {
    try {
      const db = await this.ensureDB();
      
      return new Promise((resolve) => {
        const transaction = db.transaction([SETTINGS_STORE], 'readonly');
        const store = transaction.objectStore(SETTINGS_STORE);
        const request = store.get(key);

        request.onsuccess = async () => {
          const result = request.result;
          if (result) {
            // Try to get decrypted value if it's sensitive
            if (result.isSensitive && secureStorage.exists('test')) {
              try {
                const decryptedValue = await secureStorage.retrieve(key, 'defaultPassword');
                resolve(decryptedValue || localStorage.getItem(key));
                return;
              } catch (error) {
                console.warn(`Failed to decrypt setting '${key}':`, error);
              }
            }
            resolve(result.value);
          } else {
            // Fallback to localStorage
            resolve(localStorage.getItem(key));
          }
        };

        request.onerror = () => {
          console.warn(`Error reading setting '${key}' from IndexedDB:`, request.error);
          // Fallback to localStorage
          resolve(localStorage.getItem(key));
        };
      });
    } catch (error) {
      console.warn(`Failed to get setting '${key}' from IndexedDB:`, error);
      return localStorage.getItem(key);
    }
  }

  /**
   * Load all settings from IndexedDB
   */
  async loadAllSettings(): Promise<LoadedSettings> {
    try {
      const db = await this.ensureDB();
      
      return new Promise((resolve) => {
        const transaction = db.transaction([SETTINGS_STORE], 'readonly');
        const store = transaction.objectStore(SETTINGS_STORE);
        const request = store.getAll();

        request.onsuccess = async () => {
          const results = request.result || [];
          const settings: LoadedSettings = {};

          // Process each setting
          for (const result of results) {
            try {
              if (result.isSensitive && secureStorage.exists('test')) {
                // Try to decrypt sensitive settings
                const decryptedValue = await secureStorage.retrieve(result.id, 'defaultPassword');
                (settings as any)[result.id] = decryptedValue || localStorage.getItem(result.id);
              } else {
                (settings as any)[result.id] = result.value;
              }
            } catch (error) {
              console.warn(`Failed to decrypt setting '${result.id}':`, error);
              (settings as any)[result.id] = localStorage.getItem(result.id);
            }
          }

          // Fill in any missing settings from localStorage
          const settingKeys = [
            'theme', 'defaultView', 'backgroundDuration', 'selectedAlbum',
            'zipCode', 'weatherApiKey', 'publicAlbumUrl', 'githubOwner', 
            'githubRepo', 'notion_token', 'notion_database_id'
          ];

          for (const key of settingKeys) {
            if (!(settings as any)[key]) {
              const localValue = localStorage.getItem(key);
              if (localValue) {
                (settings as any)[key] = localValue;
              }
            }
          }

          // Map notion keys correctly
          settings.notionToken = (settings as any).notion_token;
          settings.notionDatabaseId = (settings as any).notion_database_id;

          console.log('Loaded all settings from IndexedDB:', settings);
          resolve(settings);
        };

        request.onerror = () => {
          console.warn('Error loading settings from IndexedDB:', request.error);
          // Fallback to localStorage only
          const settings: LoadedSettings = {
            theme: localStorage.getItem('theme') as any,
            defaultView: localStorage.getItem('defaultView') as any,
            backgroundDuration: localStorage.getItem('backgroundDuration'),
            selectedAlbum: localStorage.getItem('selectedAlbum'),
            zipCode: localStorage.getItem('zipCode'),
            weatherApiKey: localStorage.getItem('weatherApiKey'),
            publicAlbumUrl: localStorage.getItem('publicAlbumUrl'),
            githubOwner: localStorage.getItem('githubOwner'),
            githubRepo: localStorage.getItem('githubRepo'),
            notionToken: localStorage.getItem('notion_token'),
            notionDatabaseId: localStorage.getItem('notion_database_id'),
          };
          resolve(settings);
        };
      });
    } catch (error) {
      console.error('Error loading settings from IndexedDB:', error);
      // Complete fallback to localStorage
      return {
        theme: localStorage.getItem('theme') as any,
        defaultView: localStorage.getItem('defaultView') as any,
        backgroundDuration: localStorage.getItem('backgroundDuration'),
        selectedAlbum: localStorage.getItem('selectedAlbum'),
        zipCode: localStorage.getItem('zipCode'),
        weatherApiKey: localStorage.getItem('weatherApiKey'),
        publicAlbumUrl: localStorage.getItem('publicAlbumUrl'),
        githubOwner: localStorage.getItem('githubOwner'),
        githubRepo: localStorage.getItem('githubRepo'),
        notionToken: localStorage.getItem('notion_token'),
        notionDatabaseId: localStorage.getItem('notion_database_id'),
      };
    }
  }

  /**
   * Remove a setting
   */
  async removeSetting(key: string, isSensitive: boolean = false): Promise<void> {
    try {
      const db = await this.ensureDB();
      
      return new Promise((resolve) => {
        const transaction = db.transaction([SETTINGS_STORE], 'readwrite');
        
        transaction.oncomplete = () => {
          console.log(`Setting '${key}' removed successfully`);
          resolve();
        };
        
        transaction.onerror = () => {
          console.warn(`Error removing setting '${key}':`, transaction.error);
          resolve(); // Don't reject
        };

        const store = transaction.objectStore(SETTINGS_STORE);
        store.delete(key);
      });
    } catch (error) {
      console.warn(`Failed to remove setting '${key}':`, error);
    } finally {
      // Always remove from localStorage and secure storage
      localStorage.removeItem(key);
      if (isSensitive && secureStorage.exists('test')) {
        secureStorage.remove(key);
      }
    }
  }
}

const settingsStorageService = new SettingsStorageService();

// Legacy compatibility functions
export const getStorageValue = async (key: string, isSensitive: boolean = false): Promise<string | null> => {
  return settingsStorageService.getSetting(key, isSensitive);
};

export const saveStorageValue = async (key: string, value: string, isSensitive: boolean = false): Promise<void> => {
  return settingsStorageService.saveSetting(key, value, isSensitive);
};

export class SettingsStorage {
  static async getStorageValue(key: string, isSensitive: boolean = false): Promise<string | null> {
    return settingsStorageService.getSetting(key, isSensitive);
  }

  static async loadAllSettings(): Promise<LoadedSettings> {
    return settingsStorageService.loadAllSettings();
  }

  static getSetting(key: string, isSensitive: boolean = false): string | null {
    // Synchronous fallback - only use localStorage
    return localStorage.getItem(key);
  }

  static async saveSetting(key: string, value: string, isSensitive: boolean = false) {
    return settingsStorageService.saveSetting(key, value, isSensitive);
  }

  static async removeSetting(key: string, isSensitive: boolean = false) {
    return settingsStorageService.removeSetting(key, isSensitive);
  }
}