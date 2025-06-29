
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WeatherSettingsProps {
  zipCode: string;
  onZipCodeChange: (zipCode: string) => void;
  weatherApiKey: string;
  onWeatherApiKeyChange: (apiKey: string) => void;
}

const WeatherSettings = ({
  zipCode,
  onZipCodeChange,
  weatherApiKey,
  onWeatherApiKeyChange
}: WeatherSettingsProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="api-key" className="text-gray-700 dark:text-gray-300">OpenWeatherMap API Key</Label>
        <Input
          id="api-key"
          type="password"
          placeholder="Enter your OpenWeatherMap API key"
          value={weatherApiKey}
          onChange={(e) => onWeatherApiKeyChange(e.target.value)}
          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
        />
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="zipcode" className="text-gray-700 dark:text-gray-300">Zip Code</Label>
        <Input
          id="zipcode"
          placeholder="Enter your zip code (e.g., 90210)"
          value={zipCode}
          onChange={(e) => onZipCodeChange(e.target.value)}
          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
        />
      </div>
    </div>
  );
};

export default WeatherSettings;
