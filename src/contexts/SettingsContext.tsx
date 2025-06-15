
import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  defaultView: 'month' | 'week' | 'timeline';
  setDefaultView: (view: 'month' | 'week' | 'timeline') => void;
  zipCode: string;
  setZipCode: (zipCode: string) => void;
  backgroundDuration: number;
  setBackgroundDuration: (duration: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [defaultView, setDefaultView] = useState<'month' | 'week' | 'timeline'>('month');
  const [zipCode, setZipCode] = useState('90210');
  const [backgroundDuration, setBackgroundDuration] = useState(30); // Default 30 minutes

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    const savedView = localStorage.getItem('defaultView') as 'month' | 'week' | 'timeline' | null;
    const savedZipCode = localStorage.getItem('zipCode');
    const savedDuration = localStorage.getItem('backgroundDuration');

    if (savedTheme) setTheme(savedTheme);
    if (savedView) setDefaultView(savedView);
    if (savedZipCode) setZipCode(savedZipCode);
    if (savedDuration) setBackgroundDuration(parseInt(savedDuration));
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('defaultView', defaultView);
  }, [defaultView]);

  useEffect(() => {
    localStorage.setItem('zipCode', zipCode);
  }, [zipCode]);

  useEffect(() => {
    localStorage.setItem('backgroundDuration', backgroundDuration.toString());
  }, [backgroundDuration]);

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme,
        defaultView,
        setDefaultView,
        zipCode,
        setZipCode,
        backgroundDuration,
        setBackgroundDuration,
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
