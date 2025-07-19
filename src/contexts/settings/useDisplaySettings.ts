
/**
 * Display Settings Hook
 * 
 * Manages display-related settings using tiered storage (cache → localStorage → IndexedDB).
 */

import { useState, useEffect } from 'react';
import { settingsStorageService } from '@/services/settingsStorageService';

export const useDisplaySettings = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [defaultView, setDefaultView] = useState<'month' | 'week' | 'timeline'>('month');

  // Load initial settings from tiered storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedTheme = await settingsStorageService.getValue('theme') as 'light' | 'dark' | 'system' | null;
        const savedDefaultView = await settingsStorageService.getValue('defaultView') as 'month' | 'week' | 'timeline' | null;
        
        if (savedTheme) {
          setTheme(savedTheme);
        }
        if (savedDefaultView) {
          setDefaultView(savedDefaultView);
        }
      } catch (error) {
        console.warn('Failed to load display settings:', error);
        // Fallback to localStorage for compatibility
        const fallbackTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
        const fallbackDefaultView = localStorage.getItem('defaultView') as 'month' | 'week' | 'timeline' | null;
        
        if (fallbackTheme) setTheme(fallbackTheme);
        if (fallbackDefaultView) setDefaultView(fallbackDefaultView);
      }
    };
    
    loadSettings();
  }, []);

  // Auto-save theme to tiered storage
  useEffect(() => {
    settingsStorageService.setValue('theme', theme).catch(error => {
      console.warn('Failed to save theme to tiered storage:', error);
      // Fallback to localStorage
      localStorage.setItem('theme', theme);
    });
  }, [theme]);

  // Auto-save default view to tiered storage
  useEffect(() => {
    settingsStorageService.setValue('defaultView', defaultView).catch(error => {
      console.warn('Failed to save defaultView to tiered storage:', error);
      // Fallback to localStorage
      localStorage.setItem('defaultView', defaultView);
    });
  }, [defaultView]);

  return {
    theme,
    setTheme,
    defaultView,
    setDefaultView,
  };
};
