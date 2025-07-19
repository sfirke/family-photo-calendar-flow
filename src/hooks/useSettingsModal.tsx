
import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { getVersionInfo } from '@/utils/versionManager';
import { VersionInfo } from '@/types/ical';

export const useSettingsModal = () => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const { setTheme: setActualTheme } = useTheme();

  useEffect(() => {
    const loadVersionInfo = async () => {
      try {
        const info = await getVersionInfo();
        setVersionInfo(info);
      } catch (error) {
        console.error('Failed to load version info:', error);
      }
    };

    loadVersionInfo();
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setActualTheme(newTheme);
  };

  return {
    versionInfo,
    handleThemeChange
  };
};
