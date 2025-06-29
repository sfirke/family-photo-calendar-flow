
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, MapPin } from 'lucide-react';

interface WeatherSettingsProps {
  zipCode: string;
  onZipCodeChange: (zipCode: string) => void;
}

const WeatherSettings = ({
  zipCode,
  onZipCodeChange
}: WeatherSettingsProps) => {
  return (
    <div className="space-y-4">
      {/* API Key Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Key className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
              API Key Management
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Weather API keys are now managed securely on the server. Contact your administrator 
              to configure the OpenWeatherMap API key for weather data access.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="zipcode" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <MapPin className="h-4 w-4" />
          Zip Code
        </Label>
        <Input
          id="zipcode"
          placeholder="Enter your zip code (e.g., 90210)"
          value={zipCode}
          onChange={(e) => onZipCodeChange(e.target.value)}
          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
        />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enter your 5-digit US zip code to get accurate weather information for your location.
        </p>
      </div>
    </div>
  );
};

export default WeatherSettings;
