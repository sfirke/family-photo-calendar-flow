
/**
 * SettingsModal Component
 * 
 * Main configuration interface for the Family Calendar application.
 * Provides tabbed access to different settings categories including:
 * - Calendar management (iCal feeds, local events)
 * - Photo backgrounds (Google Photos integration)
 * - Display preferences (theme, default view)
 * - Weather configuration (API keys, location)
 * - Security settings (client-side encryption)
 * 
 * Features:
 * - Responsive design for mobile and desktop
 * - Security integration with client-side encryption
 * - Real-time settings validation and persistence
 * - Version information display
 * - Offline status indication
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Monitor, CloudSun, Calendar, Info, Shield, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSecurity } from '@/contexts/SecurityContext';
import { useToast } from '@/hooks/use-toast';
import { getVersionInfo } from '@/utils/versionManager';
import OfflineIndicator from './OfflineIndicator';
import PhotosTab from './settings/PhotosTab';
import DisplayTab from './settings/DisplayTab';
import WeatherTab from './settings/WeatherTab';
import CalendarsTab from './settings/CalendarsTab';

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
  
  const { setTheme: setActualTheme } = useTheme();
  const { isSecurityEnabled, enableSecurity, disableSecurity, getSecurityStatus } = useSecurity();
  const { toast } = useToast();
  
  // Local state for version information and security form
  const [versionInfo, setVersionInfo] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEnabling, setIsEnabling] = useState(false);

  /**
   * Load version information when modal opens
   * Used for debugging and support purposes
   */
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

  /**
   * Handle theme changes and apply them immediately
   * Updates both settings context and theme context
   */
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setActualTheme(newTheme);
  };

  /**
   * Enable security with password validation
   * Implements client-side AES-256 encryption for sensitive data
   */
  const handleEnableSecurity = async () => {
    // Validate password requirements
    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      });
      return;
    }

    // Ensure password confirmation matches
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both password fields match.",
        variant: "destructive"
      });
      return;
    }

    setIsEnabling(true);
    try {
      const success = await enableSecurity(password);
      if (success) {
        toast({
          title: "Security enabled",
          description: "Your data will now be encrypted locally.",
        });
        // Clear password fields on success
        setPassword('');
        setConfirmPassword('');
      } else {
        toast({
          title: "Failed to enable security",
          description: "Please check your password and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Security error",
        description: "An error occurred while enabling security.",
        variant: "destructive"
      });
    } finally {
      setIsEnabling(false);
    }
  };

  /**
   * Disable security with user confirmation
   * Removes encryption and converts data to plain text storage
   */
  const handleDisableSecurity = () => {
    if (window.confirm('Are you sure you want to disable security? This will remove encryption from your data.')) {
      disableSecurity();
      toast({
        title: "Security disabled",
        description: "Your data is no longer encrypted.",
        variant: "destructive"
      });
    }
  };

  /**
   * Unlock existing encrypted data with password
   * Used when security was previously enabled but session expired
   */
  const handleUnlock = async () => {
    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter your security password.",
        variant: "destructive"
      });
      return;
    }

    setIsEnabling(true);
    try {
      const success = await enableSecurity(password);
      if (success) {
        toast({
          title: "Security unlocked",
          description: "Your encrypted data is now accessible.",
        });
        setPassword('');
      } else {
        toast({
          title: "Incorrect password",
          description: "Please check your password and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Unlock failed",
        description: "Failed to unlock security. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEnabling(false);
    }
  };

  // Security state detection for UI logic
  const hasSecuritySalt = localStorage.getItem('security_salt') !== null;
  const needsUnlock = hasSecuritySalt && !isSecurityEnabled;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-0 fixed top-[5vh] left-[50%] translate-x-[-50%] translate-y-0">
        <div className="p-4 sm:p-6">
          <DialogHeader>
            {/* Responsive header with version info and offline indicator */}
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
                  {/* Build date display for debugging */}
                  {versionInfo?.buildDate && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 sm:ml-2">
                      Built: {new Date(versionInfo.buildDate).toLocaleDateString()}
                    </span>
                  )}
                  {/* Git hash for version tracking */}
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
              <div className="mt-1 text-xs">
                Security: {getSecurityStatus()}
              </div>
            </DialogDescription>
          </DialogHeader>

          {/* Main tabbed interface - responsive grid layout */}
          <Tabs defaultValue="calendars" className="w-full mt-4 sm:mt-6">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 h-auto p-1">
              {/* Calendar management tab */}
              <TabsTrigger 
                value="calendars" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100 py-2 sm:py-3"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Calendars</span>
                <span className="sm:hidden">Cal</span>
              </TabsTrigger>
              
              {/* Photo backgrounds tab */}
              <TabsTrigger 
                value="photos" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100 py-2 sm:py-3"
              >
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Photos</span>
                <span className="sm:hidden">Pic</span>
              </TabsTrigger>
              
              {/* Display preferences tab */}
              <TabsTrigger 
                value="display" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100 py-2 sm:py-3"
              >
                <Monitor className="h-4 w-4" />
                <span className="hidden sm:inline">Display</span>
                <span className="sm:hidden">Disp</span>
              </TabsTrigger>
              
              {/* Weather configuration tab */}
              <TabsTrigger 
                value="weather" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100 py-2 sm:py-3"
              >
                <CloudSun className="h-4 w-4" />
                <span className="hidden sm:inline">Weather</span>
                <span className="sm:hidden">Wthr</span>
              </TabsTrigger>
              
              {/* Security settings tab */}
              <TabsTrigger 
                value="security" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100 py-2 sm:py-3"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Security</span>
                <span className="sm:hidden">Sec</span>
              </TabsTrigger>
            </TabsList>

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
                  onThemeChange={handleThemeChange}
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

              {/* Security settings content - integrated into main modal */}
              <TabsContent value="security" className="space-y-4 mt-0">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Security Settings</h3>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {needsUnlock 
                      ? "Enter your password to unlock encrypted data"
                      : "Configure client-side encryption for your sensitive data"
                    }
                  </p>

                  {/* Security status indicator */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      {isSecurityEnabled ? (
                        <Lock className="h-4 w-4 text-green-600" />
                      ) : (
                        <Unlock className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="text-sm font-medium">{getSecurityStatus()}</span>
                    </div>
                  </div>

                  {needsUnlock ? (
                    /* Unlock existing encrypted data interface */
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="unlock-password">Security Password</Label>
                        <Input
                          id="unlock-password"
                          type="password"
                          placeholder="Enter your security password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                        />
                      </div>
                      
                      <Button
                        onClick={handleUnlock}
                        disabled={isEnabling || !password}
                        className="w-full"
                      >
                        {isEnabling ? 'Unlocking...' : 'Unlock Security'}
                      </Button>
                    </div>
                  ) : (
                    /* Enable/Disable security interface */
                    <div className="space-y-4">
                      {!isSecurityEnabled ? (
                        /* Enable security form */
                        <>
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-start gap-2">
                              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                              <div className="text-sm text-blue-800 dark:text-blue-200">
                                <p className="font-medium mb-1">Enhanced Security</p>
                                <p>Encrypts API keys and sensitive data locally using AES-256 encryption.</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="new-password">Create Security Password</Label>
                            <Input
                              id="new-password"
                              type="password"
                              placeholder="Enter a strong password (min 8 characters)"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                              id="confirm-password"
                              type="password"
                              placeholder="Confirm your password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleEnableSecurity()}
                            />
                          </div>

                          <Button
                            onClick={handleEnableSecurity}
                            disabled={isEnabling || password.length < 8 || password !== confirmPassword}
                            className="w-full"
                          >
                            {isEnabling ? 'Enabling...' : 'Enable Security'}
                          </Button>
                        </>
                      ) : (
                        /* Security enabled - show disable option */
                        <>
                          <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Lock className="h-4 w-4 text-green-600 dark:text-green-400" />
                              <span className="text-sm text-green-800 dark:text-green-200">
                                Security is active - your data is encrypted
                              </span>
                            </div>
                          </div>

                          <Button
                            onClick={handleDisableSecurity}
                            variant="outline"
                            className="w-full text-red-600 border-red-300 hover:bg-red-50"
                          >
                            Disable Security
                          </Button>
                        </>
                      )}

                      {/* Security warning message */}
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                          <div className="text-xs text-amber-800 dark:text-amber-200">
                            <p className="font-medium">Important:</p>
                            <p>If you forget your password, your encrypted data cannot be recovered. Keep your password safe!</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
