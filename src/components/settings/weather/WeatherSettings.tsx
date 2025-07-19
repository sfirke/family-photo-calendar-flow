
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Shield, Lock, MapPin, Loader2 } from 'lucide-react';
import { useSecurity } from '@/contexts/SecurityContext';
import SecurityUnlockBanner from '@/components/security/SecurityUnlockBanner';

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
  const [userIpAddress, setUserIpAddress] = useState<string>('');
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Allow editing even when security is enabled - users can edit and re-encrypt
  const fieldsDisabled = false;

  console.log('WeatherSettings - Security state:', { 
    isSecurityEnabled, 
    hasLockedData, 
    fieldsDisabled,
    zipCode: zipCode ? `${zipCode.substring(0, 3)}...` : 'empty',
    weatherApiKey: weatherApiKey ? `${weatherApiKey.substring(0, 8)}...` : 'empty',
    useManualLocation
  });

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('WeatherSettings - Zip code input change:', e.target.value);
    onZipCodeChange(e.target.value);
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('WeatherSettings - API key input change:', e.target.value.substring(0, 8) + '...');
    onWeatherApiKeyChange(e.target.value);
  };

  // Check for geolocation permission and get IP address
  useEffect(() => {
    if (!useManualLocation) {
      checkLocationPermission();
      getUserIP();
    }
  }, [useManualLocation]);

  const checkLocationPermission = async () => {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        setLocationPermission(permission.state);
        
        permission.addEventListener('change', () => {
          setLocationPermission(permission.state);
        });
      } catch (error) {
        console.log('Geolocation permission check not supported');
        setLocationPermission('unknown');
      }
    }
  };

  const getUserIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      setUserIpAddress(data.ip);
    } catch (error) {
      console.error('Failed to get IP address:', error);
      setUserIpAddress('Unable to detect');
    }
  };

  const requestLocationPermission = async () => {
    setIsDetectingLocation(true);
    
    try {
      if ('geolocation' in navigator) {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('Location granted:', position.coords);
              setLocationPermission('granted');
              resolve(position);
            },
            (error) => {
              console.error('Location denied:', error);
              setLocationPermission('denied');
              reject(error);
            }
          );
        });
      }
    } catch (error) {
      console.error('Location permission error:', error);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Show unlock banner if data is locked */}
      <SecurityUnlockBanner onUnlock={onSecurityUnlock} />


      {/* API Key Configuration */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="api-key" className="text-gray-700 dark:text-gray-300">
            AccuWeather API Key
          </Label>
          {isSecurityEnabled && (
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <Lock className="h-3 w-3" />
              <span>Encrypted</span>
            </div>
          )}
        </div>
        <Input
          id="api-key"
          type="password"
          placeholder="Enter your AccuWeather API key"
          value={weatherApiKey}
          onChange={handleApiKeyChange}
          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
        />
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Get a free API key from{' '}
          <a 
            href="https://developer.accuweather.com/getting-started" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            AccuWeather Developer Portal
          </a>
          {isSecurityEnabled && (
            <span className="text-green-600 dark:text-green-400 ml-2">
              • Data will be encrypted automatically
            </span>
          )}
        </div>
      </div>

      {/* Location Settings */}
      <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <Label className="text-sm font-medium text-green-900 dark:text-green-100">Automatic Location Detection</Label>
              <p className="text-xs text-green-700 dark:text-green-300">
                Using your IP address to automatically detect your location
              </p>
            </div>
          </div>
          <Switch
            checked={useManualLocation}
            onCheckedChange={(checked) => {
              setUseManualLocation(checked);
              onUseManualLocationChange(checked);
            }}
          />
        </div>
          
          {!useManualLocation && (
            <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700 space-y-3">
              <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                <MapPin className="h-3 w-3" />
                <span>Location detected automatically • More accurate • No manual input required</span>
              </div>
              
              {/* IP Address Display */}
              {userIpAddress && (
                <div className="bg-green-100 dark:bg-green-800/50 p-2 rounded text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-green-800 dark:text-green-200">Detected IP Address:</span>
                    <span className="font-mono text-green-900 dark:text-green-100">{userIpAddress}</span>
                  </div>
                </div>
              )}
              
              {/* Location Permission Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-green-700 dark:text-green-300">Location Permission:</span>
                  <div className="flex items-center gap-2">
                    {locationPermission === 'granted' && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                        Granted
                      </Badge>
                    )}
                    {locationPermission === 'denied' && (
                      <Badge variant="destructive" className="text-xs">
                        Denied
                      </Badge>
                    )}
                    {(locationPermission === 'prompt' || locationPermission === 'unknown') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={requestLocationPermission}
                        disabled={isDetectingLocation}
                        className="h-6 px-2 text-xs border-green-300 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-900/50"
                      >
                        {isDetectingLocation ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Requesting...
                          </>
                        ) : (
                          'Request Permission'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                
                {locationPermission === 'denied' && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Location permission denied. Using IP-based location detection as fallback.
                  </p>
                )}
                
                {locationPermission === 'granted' && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Location permission granted. Using precise GPS coordinates when available.
                  </p>
                )}
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
      )

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
