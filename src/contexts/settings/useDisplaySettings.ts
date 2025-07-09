
/**
 * Display Settings Hook
 * 
 * Manages display-related settings like theme and default view.
 */

import { useState, useEffect } from 'react';
import { SettingsStorage } from './settingsStorage';

export const useDisplaySettings = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [defaultView, setDefaultView] = useState<'month' | 'week' | 'timeline'>('month');


  // Auto-save theme to localStorage
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Auto-save default view to localStorage
  useEffect(() => {
    localStorage.setItem('defaultView', defaultView);
  }, [defaultView]);

  return {
    theme,
    setTheme,
    defaultView,
    setDefaultView,
  };
};
