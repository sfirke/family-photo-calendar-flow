
import React, { createContext, useContext, useState } from 'react';
import { ViewMode } from '@/types/calendar';

type Theme = 'light' | 'dark' | 'system';

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  defaultView: ViewMode;
  setDefaultView: (view: ViewMode) => void;
  zipCode: string;
  setZipCode: (zipCode: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme;
    return stored || 'system';
  });

  const [defaultView, setDefaultView] = useState<ViewMode>(() => {
    const stored = localStorage.getItem('defaultView') as ViewMode;
    return stored || 'timeline';
  });

  const [zipCode, setZipCode] = useState(() => {
    return localStorage.getItem('zipCode') || '48226';
  });

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleSetDefaultView = (view: ViewMode) => {
    setDefaultView(view);
    localStorage.setItem('defaultView', view);
  };

  const handleSetZipCode = (newZipCode: string) => {
    setZipCode(newZipCode);
    localStorage.setItem('zipCode', newZipCode);
  };

  return (
    <SettingsContext.Provider value={{
      theme,
      setTheme: handleSetTheme,
      defaultView,
      setDefaultView: handleSetDefaultView,
      zipCode,
      setZipCode: handleSetZipCode,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
