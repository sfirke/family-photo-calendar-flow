
/**
 * SettingsModal Component
 * 
 * Main configuration interface for the Family Calendar application.
 * Provides tabbed access to different settings categories including:
 * - Calendar management (iCal feeds, local events)
 * - Photo backgrounds (Google Photos integration)
 * - Display preferences (theme, default view)
 * - Weather configuration (API keys, location)
 * - Notion integration (database access tokens)
 * - App updates (manual check and install, GitHub repository configuration)
 * - Security settings (client-side encryption)
 * 
 * Features:
 * - Responsive design for mobile and desktop
 * - Security integration with client-side encryption
 * - Real-time settings validation and persistence
 * - Version information display
 * - Offline status indication
 * - Manual update management
 * - GitHub repository configuration for release checking
 * - Notion workspace integration
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useSettings } from '@/contexts/SettingsContext';
import { useSettingsModal } from '@/hooks/useSettingsModal';
import SettingsModalHeader from './settings/SettingsModalHeader';
import SettingsTabNavigation from './settings/SettingsTabNavigation';
import SecurityTab from './settings/SecurityTab';
import PhotosTab from './settings/PhotosTab';
import DisplayTab from './settings/DisplayTab';
import WeatherTab from './settings/WeatherTab';
import CalendarsTab from './settings/CalendarsTab';
import NotionTab from './settings/NotionTab';
import UpdateTab from './settings/UpdateTab';

interface SettingsModalProps {
  /** Controls modal visibility */
  open: boolean;
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void;
}

/**
 * Main settings modal component with tabbed interface
 * Integrates all application configuration options in one place
 */
const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  // Context hooks for settings management
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
  
  const { handleThemeChange } = useSettingsModal();

  /**
   * Handle theme changes and apply them immediately
   * Updates both settings context and theme context
   */
  const onThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    handleThemeChange(newTheme);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-0 fixed top-[5vh] left-[50%] translate-x-[-50%] translate-y-0">
        <div className="p-4 sm:p-6">
          <SettingsModalHeader />

          {/* Main tabbed interface - responsive grid layout */}
          <Tabs defaultValue="calendars" className="w-full mt-4 sm:mt-6">
            <SettingsTabNavigation />

            <div className="mt-4 sm:mt-6">
              {/* Calendar management content */}
              <TabsContent value="calendars" className="space-y-4 mt-0">
                <CalendarsTab />
              </TabsContent>

              {/* Photo backgrounds content */}
              <TabsContent value="photos" className="space-y-4 mt-0">
                <PhotosTab />
              </TabsContent>

              {/* Display preferences content */}
              <TabsContent value="display" className="space-y-4 mt-0">
                <DisplayTab 
                  theme={theme}
                  onThemeChange={onThemeChange}
                  defaultView={defaultView}
                  onDefaultViewChange={setDefaultView}
                />
              </TabsContent>

              {/* Weather configuration content */}
              <TabsContent value="weather" className="space-y-4 mt-0">
                <WeatherTab 
                  zipCode={zipCode}
                  onZipCodeChange={setZipCode}
                  weatherApiKey={weatherApiKey}
                  onWeatherApiKeyChange={setWeatherApiKey}
                />
              </TabsContent>

              {/* Notion integration content */}
              <TabsContent value="notion" className="space-y-4 mt-0">
                <NotionTab />
              </TabsContent>

              {/* App updates content */}
              <TabsContent value="updates" className="space-y-4 mt-0">
                <UpdateTab />
              </TabsContent>

              {/* Security settings content */}
              <TabsContent value="security" className="space-y-4 mt-0">
                <SecurityTab />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
