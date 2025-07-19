
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Zap, Calendar, ExternalLink } from 'lucide-react';
import { useSecurity } from '@/contexts/SecurityContext';
import { enhancedWeatherService } from '@/services/enhancedWeatherService';
import SecurityUnlockBanner from '@/components/security/SecurityUnlockBanner';

interface WeatherSettingsProps {
  zipCode: string;
  onZipCodeChange: (zipCode: string) => void;
  weatherApiKey: string;
  onWeatherApiKeyChange: (apiKey: string) => void;
  weatherProvider: string;
  onWeatherProviderChange: (provider: string) => void;
  useEnhancedService: boolean;
  onUseEnhancedServiceChange: (use: boolean) => void;
  onSecurityUnlock?: () => void;
}

const WeatherSettings = ({
  zipCode,
  onZipCodeChange,
  weatherApiKey,
  onWeatherApiKeyChange,
  weatherProvider,
  onWeatherProviderChange,
  useEnhancedService,
  onUseEnhancedServiceChange,
  onSecurityUnlock
}: WeatherSettingsProps) => {
  const { isSecurityEnabled, hasLockedData } = useSecurity();

  // Allow editing even when security is enabled - users can edit and re-encrypt
  const fieldsDisabled = false;

  // Get available providers information
  const availableProviders = enhancedWeatherService.getAvailableProviders();
  const currentProviderInfo = availableProviders.find(p => p.name === weatherProvider);

  console.log('WeatherSettings - Security state:', { 
    isSecurityEnabled, 
    hasLockedData, 
    fieldsDisabled,
    zipCode: zipCode ? `${zipCode.substring(0, 3)}...` : 'empty',
    weatherApiKey: weatherApiKey ? `${weatherApiKey.substring(0, 8)}...` : 'empty',
    weatherProvider,
    useEnhancedService
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
    <div className="space-y-6">
      {/* Show unlock banner if data is locked */}
      <SecurityUnlockBanner onUnlock={onSecurityUnlock} />

      {/* Enhanced Service Toggle */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <Label className="text-sm font-medium text-blue-900 dark:text-blue-100">Enhanced Weather Service</Label>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Extended forecasts up to 30 days with multiple provider support
              </p>
            </div>
          </div>
          <Switch
            checked={useEnhancedService}
            onCheckedChange={onUseEnhancedServiceChange}
          />
        </div>
        
        {useEnhancedService && (
          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
              <Calendar className="h-3 w-3" />
              <span>Monthly forecasts • Multiple providers • Enhanced caching</span>
            </div>
          </div>
        )}
      </div>

      {/* Weather Provider Selection */}
      {useEnhancedService && (
        <div className="space-y-3">
          <Label className="text-gray-700 dark:text-gray-300">Weather Provider</Label>
          <Select value={weatherProvider} onValueChange={onWeatherProviderChange}>
            <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
              <SelectValue placeholder="Select weather provider" />
            </SelectTrigger>
            <SelectContent>
              {availableProviders.map((provider) => (
                <SelectItem key={provider.name} value={provider.name}>
                  <div className="flex items-center justify-between w-full">
                    <span>{provider.displayName}</span>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge variant="secondary" className="text-xs">
                        {provider.maxForecastDays} days
                      </Badge>
                      {provider.requiresApiKey && (
                        <Badge variant="outline" className="text-xs">
                          API Key Required
                        </Badge>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {currentProviderInfo && (
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>• Forecast range: Up to {currentProviderInfo.maxForecastDays} days</p>
              {currentProviderInfo.config.apiKeyUrl && (
                <p className="flex items-center gap-1">
                  • Get API key: 
                  <a 
                    href={currentProviderInfo.config.apiKeyUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    {currentProviderInfo.displayName}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* API Key Configuration */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="api-key" className="text-gray-700 dark:text-gray-300">
            {useEnhancedService && currentProviderInfo 
              ? `${currentProviderInfo.displayName} API Key`
              : 'OpenWeatherMap API Key'
            }
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
          placeholder={`Enter your ${useEnhancedService && currentProviderInfo ? currentProviderInfo.displayName : 'OpenWeatherMap'} API key`}
          value={weatherApiKey}
          onChange={handleApiKeyChange}
          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
        />
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {useEnhancedService && currentProviderInfo?.config.apiKeyUrl ? (
            <>
              Get a free API key from{' '}
              <a 
                href={currentProviderInfo.config.apiKeyUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {currentProviderInfo.displayName}
              </a>
            </>
          ) : (
            <>
              Get a free API key from{' '}
              <a 
                href="https://openweathermap.org/api" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                OpenWeatherMap
              </a>
            </>
          )}
          {isSecurityEnabled && (
            <span className="text-green-600 dark:text-green-400 ml-2">
              • Data will be encrypted automatically
            </span>
          )}
        </div>
      </div>

      {/* Zip Code */}
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
          placeholder="Enter your zip code (e.g., 90210)"
          value={zipCode}
          onChange={handleZipCodeChange}
          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
        />
        {isSecurityEnabled && (
          <p className="text-xs text-green-600 dark:text-green-400">
            Your zip code will be encrypted automatically when saved.
          </p>
        )}
      </div>

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
