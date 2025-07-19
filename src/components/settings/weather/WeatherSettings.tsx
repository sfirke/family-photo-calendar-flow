import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, MapPin, Lock, AlertTriangle } from 'lucide-react';
import { useSecurity } from '@/contexts/SecurityContext';

interface WeatherSettingsProps {
  zipCode: string;
  onZipCodeChange: (zipCode: string) => void;
  weatherApiKey: string;
  onWeatherApiKeyChange: (apiKey: string) => void;
  onSecurityUnlock?: () => void;
  onUseManualLocationChange: (useManual: boolean) => void;
}

const WeatherSettings = ({
  zipCode,
  onZipCodeChange,
  weatherApiKey,
  onWeatherApiKeyChange,
  onSecurityUnlock,
  onUseManualLocationChange
}: WeatherSettingsProps) => {
  const { isSecurityEnabled, hasLockedData } = useSecurity();
  const [useManualLocation, setUseManualLocation] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');

  // Load manual location preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('useManualLocation');
    if (saved !== null) {
      const useManual = saved === 'true';
      setUseManualLocation(useManual);
      onUseManualLocationChange(useManual);
    }
  }, [onUseManualLocationChange]);

  const fieldsDisabled = false;

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onZipCodeChange(e.target.value);
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onWeatherApiKeyChange(e.target.value);
  };

  const checkLocationPermission = async () => {
    if (!navigator.geolocation) {
      setLocationPermission('unknown');
      return;
    }

    try {
      if ('permissions' in navigator) {
        const permission = await (navigator as any).permissions.query({ name: 'geolocation' });
        setLocationPermission(permission.state);
      } else {
        // For older browsers, try to get location to check permission
        (navigator as any).geolocation.getCurrentPosition(
          () => setLocationPermission('granted'),
          () => setLocationPermission('denied'),
          { timeout: 5000 }
        );
      }
    } catch (error) {
      setLocationPermission('unknown');
    }
  };

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        (navigator as any).geolocation.getCurrentPosition(
          (pos) => {
            resolve(pos);
          },
          reject,
          { timeout: 10000 }
        );
      });

      setLocationPermission('granted');
      setUseManualLocation(false);
      onUseManualLocationChange(false);
      localStorage.setItem('useManualLocation', 'false');
    } catch (error) {
      setLocationPermission('denied');
      alert('Location access denied. You can still use manual location entry.');
    }
  };

  const toggleManualLocation = () => {
    const newValue = !useManualLocation;
    setUseManualLocation(newValue);
    onUseManualLocationChange(newValue);
    localStorage.setItem('useManualLocation', newValue.toString());
  };

  const handleUnlockSecurity = async () => {
    onSecurityUnlock?.();
  };

  useEffect(() => {
    checkLocationPermission();
  }, []);

  return (
    <div className="space-y-4">
      {/* API Key */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="apikey" className="text-gray-700 dark:text-gray-300">
            AccuWeather API Key
          </Label>
          {isSecurityEnabled && (
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <Lock className="h-3 w-3" />
              <span>Encrypted</span>
            </div>
          )}
        </div>
        
        {hasLockedData && !weatherApiKey ? (
          <div className="space-y-2">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <Lock className="h-4 w-4" />
                <span className="text-sm">Encrypted weather settings detected. Unlock to access.</span>
              </div>
            </div>
            <Button 
              onClick={handleUnlockSecurity}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Lock className="h-4 w-4 mr-2" />
              Unlock Security to Access Weather Settings
            </Button>
          </div>
        ) : (
          <>
            <Input
              id="apikey"
              type="password"
              placeholder="Enter your AccuWeather API key"
              value={weatherApiKey}
              onChange={handleApiKeyChange}
              disabled={fieldsDisabled}
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
            {isSecurityEnabled && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Your API key will be encrypted automatically when saved.
              </p>
            )}
          </>
        )}
        
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Get your free API key from{' '}
          <a 
            href="https://developer.accuweather.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            AccuWeather Developer Portal
          </a>
        </p>
      </div>

      {/* Location Settings */}
      <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Location Settings</h4>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {useManualLocation ? 'Manual Location Entry' : 'Automatic Location (IP-based)'}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {useManualLocation 
                  ? 'Using zip code for weather location'
                  : 'Using IP address to detect location automatically'
                }
              </div>
            </div>
            <Button
              onClick={toggleManualLocation}
              variant={useManualLocation ? "default" : "outline"}
              size="sm"
            >
              {useManualLocation ? 'Switch to Auto' : 'Use Manual'}
            </Button>
          </div>

          {!useManualLocation && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-700 dark:text-green-300">Location Permission:</span>
                <div className="flex items-center gap-2">
                  {locationPermission === 'granted' && (
                    <span className="text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 px-2 py-1 rounded">
                      Granted
                    </span>
                  )}
                  {locationPermission === 'denied' && (
                    <span className="text-xs bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 px-2 py-1 rounded">
                      Denied
                    </span>
                  )}
                  {(locationPermission === 'prompt' || locationPermission === 'unknown') && (
                    <Button
                      onClick={requestLocation}
                      variant="outline"
                      size="sm"
                      className="text-xs py-1 px-2 h-auto"
                    >
                      Request Permission
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Automatic location uses IP address geolocation and doesn't require browser location permission.
              </div>
            </div>
          )}

          {useManualLocation && (
            <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
              <div className="text-xs text-green-700 dark:text-green-300">
                Manual location entry enabled. Enter your zip code below.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zip Code */}
      {useManualLocation && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="zipcode" className="text-gray-700 dark:text-gray-300">
              Zip Code (Manual Override)
            </Label>
            {isSecurityEnabled && (
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <Lock className="h-3 w-3" />
                <span>Encrypted</span>
              </div>
            )}
          </div>
          <Input
            id="zipcode"
            placeholder="Enter zip code to override automatic location"
            value={zipCode}
            onChange={handleZipCodeChange}
            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
          {isSecurityEnabled && (
            <p className="text-xs text-green-600 dark:text-green-400">
              Your zip code will be encrypted automatically when saved.
            </p>
          )}
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Manual location will override automatic IP-based detection.
          </p>
        </div>
      )}

      {/* Security Notice */}
      {!isSecurityEnabled && !hasLockedData && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">Security Notice</p>
              <p>Your API key is stored unencrypted. Enable security in the Security tab for enhanced protection.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherSettings;