
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Camera, Monitor, CloudSun, Calendar } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import AccountTab from './settings/AccountTab';
import PhotosTab from './settings/PhotosTab';
import DisplayTab from './settings/DisplayTab';
import WeatherTab from './settings/WeatherTab';
import CalendarsTab from './settings/CalendarsTab';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const { theme, setTheme, defaultView, setDefaultView, zipCode, setZipCode } = useSettings();
  const { setTheme: setActualTheme } = useTheme();

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setActualTheme(newTheme);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>App Settings</DialogTitle>
          <DialogDescription>
            Configure your family calendar app preferences and connect your Google account
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="calendars" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendars
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="display" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Display
            </TabsTrigger>
            <TabsTrigger value="weather" className="flex items-center gap-2">
              <CloudSun className="h-4 w-4" />
              Weather
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-4">
            <AccountTab />
          </TabsContent>

          <TabsContent value="calendars" className="space-y-4">
            <CalendarsTab />
          </TabsContent>

          <TabsContent value="photos" className="space-y-4">
            <PhotosTab />
          </TabsContent>

          <TabsContent value="display" className="space-y-4">
            <DisplayTab 
              theme={theme}
              onThemeChange={handleThemeChange}
              defaultView={defaultView}
              onDefaultViewChange={setDefaultView}
            />
          </TabsContent>

          <TabsContent value="weather" className="space-y-4">
            <WeatherTab 
              zipCode={zipCode}
              onZipCodeChange={setZipCode}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
