
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Monitor, CloudSun, Calendar, LogOut } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import PhotosTab from './settings/PhotosTab';
import DisplayTab from './settings/DisplayTab';
import WeatherTab from './settings/WeatherTab';
import CalendarsTab from './settings/CalendarsTab';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

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
  const { user, signOut } = useAuth();

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setActualTheme(newTheme);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      onOpenChange(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Settings
            </DialogTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user?.full_name || user?.email || 'Guest User'}
              </span>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="calendars" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="calendars" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100">
              <Calendar className="h-4 w-4" />
              Calendars
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100">
              <Camera className="h-4 w-4" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="display" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100">
              <Monitor className="h-4 w-4" />
              Display
            </TabsTrigger>
            <TabsTrigger value="weather" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100">
              <CloudSun className="h-4 w-4" />
              Weather
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendars" className="space-y-4 mt-6">
            <CalendarsTab />
          </TabsContent>

          <TabsContent value="photos" className="space-y-4 mt-6">
            <PhotosTab />
          </TabsContent>

          <TabsContent value="display" className="space-y-4 mt-6">
            <DisplayTab 
              theme={theme}
              onThemeChange={handleThemeChange}
              defaultView={defaultView}
              onDefaultViewChange={setDefaultView}
            />
          </TabsContent>

          <TabsContent value="weather" className="space-y-4 mt-6">
            <WeatherTab 
              zipCode={zipCode}
              onZipCodeChange={setZipCode}
              weatherApiKey={weatherApiKey}
              onWeatherApiKeyChange={setWeatherApiKey}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
