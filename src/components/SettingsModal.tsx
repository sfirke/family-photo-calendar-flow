
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Monitor, CloudSun, Calendar, Info } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getVersionInfo } from '@/utils/versionManager';
import OfflineIndicator from './OfflineIndicator';
import PhotosTab from './settings/PhotosTab';
import DisplayTab from './settings/DisplayTab';
import WeatherTab from './settings/WeatherTab';
import CalendarsTab from './settings/CalendarsTab';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const { 
    theme, 
    setTheme, 
    defaultView, 
    setDefaultView, 
    zipCode, 
    setZipCode,
    weatherApiKey,
    setWeatherApiKey
  } = useSettings();
  const { setTheme: setActualTheme } = useTheme();
  const [versionInfo, setVersionInfo] = useState<any>(null);

  useEffect(() => {
    const loadVersionInfo = async () => {
      try {
        const info = await getVersionInfo();
        setVersionInfo(info);
      } catch (error) {
        console.error('Failed to load version info:', error);
      }
    };

    if (open) {
      loadVersionInfo();
    }
  }, [open]);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setActualTheme(newTheme);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-4xl h-[90vh] sm:max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-0">
        <div className="p-4 sm:p-6">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
              <div>
                <DialogTitle className="text-gray-900 dark:text-gray-100 text-lg sm:text-xl">App Settings</DialogTitle>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Version {versionInfo?.version || '1.0.0'}
                    </span>
                  </div>
                  {versionInfo?.buildDate && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 sm:ml-2">
                      Built: {new Date(versionInfo.buildDate).toLocaleDateString()}
                    </span>
                  )}
                  {versionInfo?.gitHash && versionInfo.gitHash !== 'unknown' && (
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400 sm:ml-2">
                      #{versionInfo.gitHash.substring(0, 7)}
                    </span>
                  )}
                </div>
              </div>
              <OfflineIndicator />
            </div>
            <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              Configure your family calendar app preferences and manage your calendar feeds
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="calendars" className="w-full mt-4 sm:mt-6">
            {/* Responsive Tabs List */}
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 h-auto p-1">
              <TabsTrigger 
                value="calendars" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100 py-2 sm:py-3"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Calendars</span>
                <span className="sm:hidden">Cal</span>
              </TabsTrigger>
              <TabsTrigger 
                value="photos" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100 py-2 sm:py-3"
              >
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Photos</span>
                <span className="sm:hidden">Pic</span>
              </TabsTrigger>
              <TabsTrigger 
                value="display" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100 py-2 sm:py-3"
              >
                <Monitor className="h-4 w-4" />
                <span className="hidden sm:inline">Display</span>
                <span className="sm:hidden">Disp</span>
              </TabsTrigger>
              <TabsTrigger 
                value="weather" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100 py-2 sm:py-3"
              >
                <CloudSun className="h-4 w-4" />
                <span className="hidden sm:inline">Weather</span>
                <span className="sm:hidden">Wthr</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 sm:mt-6">
              <TabsContent value="calendars" className="space-y-4 mt-0">
                <CalendarsTab />
              </TabsContent>

              <TabsContent value="photos" className="space-y-4 mt-0">
                <PhotosTab />
              </TabsContent>

              <TabsContent value="display" className="space-y-4 mt-0">
                <DisplayTab 
                  theme={theme}
                  onThemeChange={handleThemeChange}
                  defaultView={defaultView}
                  onDefaultViewChange={setDefaultView}
                />
              </TabsContent>

              <TabsContent value="weather" className="space-y-4 mt-0">
                <WeatherTab 
                  zipCode={zipCode}
                  onZipCodeChange={setZipCode}
                  weatherApiKey={weatherApiKey}
                  onWeatherApiKeyChange={setWeatherApiKey}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
