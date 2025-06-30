
/**
 * SettingsContext - Application Configuration Management
 * 
 * Centralized settings management for the Family Calendar application.
 * Handles both secure and non-secure settings with automatic encryption
 * when security is enabled. Provides real-time settings synchronization
 * across all components.
 * 
 * Settings Categories:
 * - Display: Theme, default view, appearance preferences
 * - Weather: API keys, location settings (encrypted when possible)
 * - Photos: Album URLs, background settings (encrypted when possible)
 * - GitHub: Repository settings for update checking (encrypted when possible)
 * - Security: Encryption preferences and validation
 * 
 * Security Integration:
 * - Automatically encrypts sensitive data when security is enabled
 * - Graceful fallback to localStorage for non-encrypted storage
 * - Migration of existing plain-text data to encrypted storage
 * - Input validation for all user-provided data
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SecureStorage } from '@/utils/security/secureStorage';
import { InputValidator } from '@/utils/security/inputValidation';

interface SettingsContextType {
  // Display Settings
  /** Current theme preference (light/dark/system) */
  theme: 'light' | 'dark' | 'system';
  /** Update theme setting and apply immediately */
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  /** Default calendar view on app load */
  defaultView: 'month' | 'week' | 'timeline';
  /** Update default view preference */
  setDefaultView: (view: 'month' | 'week' | 'timeline') => void;
  
  // Weather Settings (Sensitive - encrypted when possible)
  /** User's zip code for weather location */
  zipCode: string;
  /** Update zip code with validation */
  setZipCode: (zipCode: string) => void;
  /** Weather service API key */
  weatherApiKey: string;
  /** Update weather API key with validation */
  setWeatherApiKey: (apiKey: string) => void;
  
  // Photo Settings (Sensitive - encrypted when possible)
  /** Google Photos public album URL */
  publicAlbumUrl: string;
  /** Update album URL with validation */
  setPublicAlbumUrl: (url: string) => void;
  
  // GitHub Settings (Sensitive - encrypted when possible)
  /** GitHub repository owner/username */
  githubOwner: string;
  /** Update GitHub owner with validation */
  setGithubOwner: (owner: string) => void;
  /** GitHub repository name */
  githubRepo: string;
  /** Update GitHub repo with validation */
  setGithubRepo: (repo: string) => void;
  
  // Background Settings
  /** Photo background rotation duration in minutes */
  backgroundDuration: number;
  /** Update background rotation timing */
  setBackgroundDuration: (duration: number) => void;
  /** Currently selected photo album ID */
  selectedAlbum: string | null;
  /** Update selected album */
  setSelectedAlbum: (albumId: string | null) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * Settings Provider Component
 * 
 * Manages all application settings with intelligent storage selection.
 * Automatically encrypts sensitive data when security is enabled and
 * provides seamless migration between storage modes.
 */
export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  // Display preferences (non-sensitive)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [defaultView, setDefaultView] = useState<'month' | 'week' | 'timeline'>('month');
  
  // Location and API settings (sensitive - encrypted when possible)
  const [zipCode, setZipCode] = useState('90210');
  const [weatherApiKey, setWeatherApiKey] = useState('');
  const [publicAlbumUrl, setPublicAlbumUrl] = useState('');
  
  // GitHub settings (sensitive - encrypted when possible)
  const [githubOwner, setGithubOwner] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  
  // Background and UI settings (non-sensitive)
  const [backgroundDuration, setBackgroundDuration] = useState(30); // Default 30 minutes
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);

  /**
   * Load all settings from appropriate storage on app initialization
   * 
   * Handles both regular localStorage and secure encrypted storage.
   * Includes automatic migration of existing unencrypted data to
   * secure storage when encryption is enabled.
   */
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load non-sensitive settings from regular localStorage
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
        const savedView = localStorage.getItem('defaultView') as 'month' | 'week' | 'timeline' | null;
        const savedDuration = localStorage.getItem('backgroundDuration');
        const savedAlbum = localStorage.getItem('selectedAlbum');

        // Apply loaded settings with fallback to defaults
        if (savedTheme) setTheme(savedTheme);
        if (savedView) setDefaultView(savedView);
        if (savedDuration) setBackgroundDuration(parseInt(savedDuration));
        if (savedAlbum) setSelectedAlbum(savedAlbum);

        // Load sensitive settings from secure storage (with fallback to localStorage)
        try {
          const savedZipCode = await SecureStorage.getItem('zipCode') || localStorage.getItem('zipCode');
          const savedApiKey = await SecureStorage.getItem('weatherApiKey') || localStorage.getItem('weatherApiKey');
          const savedPublicAlbumUrl = await SecureStorage.getItem('publicAlbumUrl') || localStorage.getItem('publicAlbumUrl');
          const savedGithubOwner = await SecureStorage.getItem('githubOwner') || localStorage.getItem('githubOwner');
          const savedGithubRepo = await SecureStorage.getItem('githubRepo') || localStorage.getItem('githubRepo');

          if (savedZipCode) setZipCode(savedZipCode);
          if (savedApiKey) setWeatherApiKey(savedApiKey);
          if (savedPublicAlbumUrl) setPublicAlbumUrl(savedPublicAlbumUrl);
          if (savedGithubOwner) setGithubOwner(savedGithubOwner);
          if (savedGithubRepo) setGithubRepo(savedGithubRepo);

          // Automatic migration: Move unencrypted sensitive data to secure storage
          if (SecureStorage.isEncryptionEnabled()) {
            const oldZipCode = localStorage.getItem('zipCode');
            const oldApiKey = localStorage.getItem('weatherApiKey');
            const oldAlbumUrl = localStorage.getItem('publicAlbumUrl');
            const oldGithubOwner = localStorage.getItem('githubOwner');
            const oldGithubRepo = localStorage.getItem('githubRepo');

            // Migrate and remove unencrypted versions
            if (oldZipCode) {
              await SecureStorage.setItem('zipCode', oldZipCode);
              localStorage.removeItem('zipCode');
            }
            if (oldApiKey) {
              await SecureStorage.setItem('weatherApiKey', oldApiKey);
              localStorage.removeItem('weatherApiKey');
            }
            if (oldAlbumUrl) {
              await SecureStorage.setItem('publicAlbumUrl', oldAlbumUrl);
              localStorage.removeItem('publicAlbumUrl');
            }
            if (oldGithubOwner) {
              await SecureStorage.setItem('githubOwner', oldGithubOwner);
              localStorage.removeItem('githubOwner');
            }
            if (oldGithubRepo) {
              await SecureStorage.setItem('githubRepo', oldGithubRepo);
              localStorage.removeItem('githubRepo');
            }
          }
        } catch (error) {
          console.warn('Could not load secure settings:', error);
          // Continue with regular localStorage fallback
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Auto-save non-sensitive settings to localStorage
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('defaultView', defaultView);
  }, [defaultView]);

  useEffect(() => {
    localStorage.setItem('backgroundDuration', backgroundDuration.toString());
  }, [backgroundDuration]);

  useEffect(() => {
    if (selectedAlbum) {
      localStorage.setItem('selectedAlbum', selectedAlbum);
    } else {
      localStorage.removeItem('selectedAlbum');
    }
  }, [selectedAlbum]);

  /**
   * Auto-save zip code to appropriate storage (secure or regular)
   * 
   * Automatically chooses encrypted storage when available,
   * falls back to localStorage when encryption is disabled.
   */
  useEffect(() => {
    const saveZipCode = async () => {
      try {
        if (SecureStorage.isEncryptionEnabled()) {
          await SecureStorage.setItem('zipCode', zipCode);
          localStorage.removeItem('zipCode'); // Remove unencrypted version
        } else {
          localStorage.setItem('zipCode', zipCode);
        }
      } catch (error) {
        console.warn('Failed to save zip code securely, using localStorage:', error);
        localStorage.setItem('zipCode', zipCode);
      }
    };
    saveZipCode();
  }, [zipCode]);

  /**
   * Auto-save weather API key to appropriate storage (secure or regular)
   */
  useEffect(() => {
    const saveApiKey = async () => {
      try {
        if (SecureStorage.isEncryptionEnabled()) {
          await SecureStorage.setItem('weatherApiKey', weatherApiKey);
          localStorage.removeItem('weatherApiKey'); // Remove unencrypted version
        } else {
          localStorage.setItem('weatherApiKey', weatherApiKey);
        }
      } catch (error) {
        console.warn('Failed to save API key securely, using localStorage:', error);
        localStorage.setItem('weatherApiKey', weatherApiKey);
      }
    };
    saveApiKey();
  }, [weatherApiKey]);

  /**
   * Auto-save public album URL to appropriate storage (secure or regular)
   */
  useEffect(() => {
    const savePublicAlbumUrl = async () => {
      try {
        if (SecureStorage.isEncryptionEnabled()) {
          await SecureStorage.setItem('publicAlbumUrl', publicAlbumUrl);
          localStorage.removeItem('publicAlbumUrl'); // Remove unencrypted version
        } else {
          localStorage.setItem('publicAlbumUrl', publicAlbumUrl);
        }
      } catch (error) {
        console.warn('Failed to save album URL securely, using localStorage:', error);
        localStorage.setItem('publicAlbumUrl', publicAlbumUrl);
      }
    };
    savePublicAlbumUrl();
  }, [publicAlbumUrl]);

  /**
   * Auto-save GitHub owner to appropriate storage (secure or regular)
   */
  useEffect(() => {
    const saveGithubOwner = async () => {
      try {
        if (SecureStorage.isEncryptionEnabled()) {
          await SecureStorage.setItem('githubOwner', githubOwner);
          localStorage.removeItem('githubOwner'); // Remove unencrypted version
        } else {
          localStorage.setItem('githubOwner', githubOwner);
        }
      } catch (error) {
        console.warn('Failed to save GitHub owner securely, using localStorage:', error);
        localStorage.setItem('githubOwner', githubOwner);
      }
    };
    saveGithubOwner();
  }, [githubOwner]);

  /**
   * Auto-save GitHub repo to appropriate storage (secure or regular)
   */
  useEffect(() => {
    const saveGithubRepo = async () => {
      try {
        if (SecureStorage.isEncryptionEnabled()) {
          await SecureStorage.setItem('githubRepo', githubRepo);
          localStorage.removeItem('githubRepo'); // Remove unencrypted version
        } else {
          localStorage.setItem('githubRepo', githubRepo);
        }
      } catch (error) {
        console.warn('Failed to save GitHub repo securely, using localStorage:', error);
        localStorage.setItem('githubRepo', githubRepo);
      }
    };
    saveGithubRepo();
  }, [githubRepo]);

  /**
   * Enhanced zip code setter with input validation
   * 
   * Validates zip code format before accepting the value.
   * Logs validation errors for debugging but allows empty strings.
   */
  const setValidatedZipCode = (newZipCode: string) => {
    const validation = InputValidator.validateZipCode(newZipCode);
    if (validation.isValid || newZipCode === '') {
      setZipCode(newZipCode);
    } else {
      console.warn('Invalid zip code:', validation.error);
    }
  };

  /**
   * Enhanced weather API key setter with input validation
   * 
   * Validates API key format before accepting the value.
   * Allows empty strings for disabling weather functionality.
   */
  const setValidatedWeatherApiKey = (apiKey: string) => {
    if (apiKey === '') {
      setWeatherApiKey(apiKey);
      return;
    }
    
    const validation = InputValidator.validateApiKey(apiKey);
    if (validation.isValid) {
      setWeatherApiKey(apiKey);
    } else {
      console.warn('Invalid API key:', validation.error);
    }
  };

  /**
   * Enhanced public album URL setter with input validation
   * 
   * Validates URL format before accepting the value.
   * Allows empty strings for disabling photo backgrounds.
   */
  const setValidatedPublicAlbumUrl = (url: string) => {
    if (url === '') {
      setPublicAlbumUrl(url);
      return;
    }
    
    const validation = InputValidator.validateUrl(url);
    if (validation.isValid) {
      setPublicAlbumUrl(url);
    } else {
      console.warn('Invalid album URL:', validation.error);
    }
  };

  /**
   * Enhanced GitHub owner setter with input validation
   * 
   * Validates GitHub username format before accepting the value.
   * Allows empty strings for disabling GitHub update checks.
   */
  const setValidatedGithubOwner = (owner: string) => {
    if (owner === '') {
      setGithubOwner(owner);
      return;
    }
    
    const validation = InputValidator.validateGithubUsername(owner);
    if (validation.isValid) {
      setGithubOwner(owner);
    } else {
      console.warn('Invalid GitHub owner:', validation.error);
    }
  };

  /**
   * Enhanced GitHub repo setter with input validation
   * 
   * Validates GitHub repository name format before accepting the value.
   * Allows empty strings for disabling GitHub update checks.
   */
  const setValidatedGithubRepo = (repo: string) => {
    if (repo === '') {
      setGithubRepo(repo);
      return;
    }
    
    const validation = InputValidator.validateGithubRepoName(repo);
    if (validation.isValid) {
      setGithubRepo(repo);
    } else {
      console.warn('Invalid GitHub repo:', validation.error);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme,
        defaultView,
        setDefaultView,
        zipCode,
        setZipCode: setValidatedZipCode,
        backgroundDuration,
        setBackgroundDuration,
        selectedAlbum,
        setSelectedAlbum,
        weatherApiKey,
        setWeatherApiKey: setValidatedWeatherApiKey,
        publicAlbumUrl,
        setPublicAlbumUrl: setValidatedPublicAlbumUrl,
        githubOwner,
        setGithubOwner: setValidatedGithubOwner,
        githubRepo,
        setGithubRepo: setValidatedGithubRepo,
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
