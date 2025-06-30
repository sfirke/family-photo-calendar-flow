
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Lock } from 'lucide-react';
import { useSecurity } from '@/contexts/SecurityContext';
import SecurityUnlockBanner from '@/components/security/SecurityUnlockBanner';

interface WeatherSettingsProps {
  zipCode: string;
  onZipCodeChange: (zipCode: string) => void;
  weatherApiKey: string;
  onWeatherApiKeyChange: (apiKey: string) => void;
  onSecurityUnlock?: () => void;
}

const WeatherSettings = ({
  zipCode,
  onZipCodeChange,
  weatherApiKey,
  onWeatherApiKeyChange,
  onSecurityUnlock
}: WeatherSettingsProps) => {
  const { isSecurityEnabled, hasLockedData } = useSecurity();

  // Determine if fields should be disabled due to locked encrypted data
  const fieldsDisabled = hasLockedData;

  console.log('WeatherSettings - Security state:', { 
    isSecurityEnabled, 
    hasLockedData, 
    fieldsDisabled,
    zipCode: zipCode ? `${zipCode.substring(0, 3)}...` : 'empty',
    weatherApiKey: weatherApiKey ? `${weatherApiKey.substring(0, 8)}...` : 'empty'
  });

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('WeatherSettings - Zip code input change:', e.target.value);
    onZipCodeChange(e.target.value);
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('WeatherSettings - API key input change:', e.target.value.substring(0, 8) + '...');
    onWeatherApiKeyChange(e.target.value);
  };

  return (
    <div className="space-y-4">
      {/* Show unlock banner if data is locked */}
      <SecurityUnlockBanner onUnlock={onSecurityUnlock} />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="api-key" className="text-gray-700 dark:text-gray-300">OpenWeatherMap API Key</Label>
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
          placeholder={fieldsDisabled ? "Unlock security to edit API key" : "Enter your OpenWeatherMap API key"}
          value={fieldsDisabled ? "" : weatherApiKey}
          onChange={handleApiKeyChange}
          disabled={fieldsDisabled}
          className={`bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 ${
            fieldsDisabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
        {fieldsDisabled && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Your API key is encrypted and locked. Use the unlock form above to access it.
          </p>
        )}
        {!fieldsDisabled && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Get a free API key from{' '}
            <a 
              href="https://openweathermap.org/api" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              OpenWeatherMap
            </a>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="zipcode" className="text-gray-700 dark:text-gray-300">Zip Code</Label>
          {isSecurityEnabled && (
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <Lock className="h-3 w-3" />
              <span>Encrypted</span>
            </div>
          )}
        </div>
        <Input
          id="zipcode"
          placeholder={fieldsDisabled ? "Unlock security to edit zip code" : "Enter your zip code (e.g., 90210)"}
          value={fieldsDisabled ? "" : zipCode}
          onChange={handleZipCodeChange}
          disabled={fieldsDisabled}
          className={`bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 ${
            fieldsDisabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
        {fieldsDisabled && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Your zip code is encrypted and locked. Use the unlock form above to access it.
          </p>
        )}
      </div>

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
