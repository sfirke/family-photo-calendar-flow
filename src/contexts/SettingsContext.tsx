
import React, { createContext, useContext, useState, useEffect } from 'react';
import { SecureStorage } from '@/utils/security/secureStorage';
import { InputValidator } from '@/utils/security/inputValidation';

interface SettingsContextType {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  defaultView: 'month' | 'week' | 'timeline';
  setDefaultView: (view: 'month' | 'week' | 'timeline') => void;
  zipCode: string;
  setZipCode: (zipCode: string) => void;
  backgroundDuration: number;
  setBackgroundDuration: (duration: number) => void;
  selectedAlbum: string | null;
  setSelectedAlbum: (albumId: string | null) => void;
  weatherApiKey: string;
  setWeatherApiKey: (apiKey: string) => void;
  publicAlbumUrl: string;
  setPublicAlbumUrl: (url: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [defaultView, setDefaultView] = useState<'month' | 'week' | 'timeline'>('month');
  const [zipCode, setZipCode] = useState('90210');
  const [backgroundDuration, setBackgroundDuration] = useState(30); // Default 30 minutes
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [weatherApiKey, setWeatherApiKey] = useState('');
  const [publicAlbumUrl, setPublicAlbumUrl] = useState('');

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load non-sensitive settings from regular localStorage
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
        const savedView = localStorage.getItem('defaultView') as 'month' | 'week' | 'timeline' | null;
        const savedDuration = localStorage.getItem('backgroundDuration');
        const savedAlbum = localStorage.getItem('selectedAlbum');

        if (savedTheme) setTheme(savedTheme);
        if (savedView) setDefaultView(savedView);
        if (savedDuration) setBackgroundDuration(parseInt(savedDuration));
        if (savedAlbum) setSelectedAlbum(savedAlbum);

        // Load sensitive settings from secure storage (if available)
        try {
          const savedZipCode = await SecureStorage.getItem('zipCode') || localStorage.getItem('zipCode');
          const savedApiKey = await SecureStorage.getItem('weatherApiKey') || localStorage.getItem('weatherApiKey');
          const savedPublicAlbumUrl = await SecureStorage.getItem('publicAlbumUrl') || localStorage.getItem('publicAlbumUrl');

          if (savedZipCode) setZipCode(savedZipCode);
          if (savedApiKey) setWeatherApiKey(savedApiKey);
          if (savedPublicAlbumUrl) setPublicAlbumUrl(savedPublicAlbumUrl);

          // Migrate old unencrypted data to secure storage
          if (SecureStorage.isEncryptionEnabled()) {
            const oldZipCode = localStorage.getItem('zipCode');
            const oldApiKey = localStorage.getItem('weatherApiKey');
            const oldAlbumUrl = localStorage.getItem('publicAlbumUrl');

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
          }
        } catch (error) {
          console.warn('Could not load secure settings:', error);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Save non-sensitive settings to localStorage
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

  // Save sensitive settings to secure storage
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

  // Enhanced setters with validation
  const setValidatedZipCode = (newZipCode: string) => {
    const validation = InputValidator.validateZipCode(newZipCode);
    if (validation.isValid || newZipCode === '') {
      setZipCode(newZipCode);
    } else {
      console.warn('Invalid zip code:', validation.error);
    }
  };

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
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
