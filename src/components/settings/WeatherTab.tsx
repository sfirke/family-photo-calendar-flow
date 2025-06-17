
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CloudSun, Info, Key } from 'lucide-react';

interface WeatherTabProps {
  zipCode: string;
  onZipCodeChange: (zipCode: string) => void;
  weatherApiKey: string;
  onWeatherApiKeyChange: (apiKey: string) => void;
}

const WeatherTab = ({ zipCode, onZipCodeChange, weatherApiKey, onWeatherApiKeyChange }: WeatherTabProps) => {
  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <CloudSun className="h-5 w-5" />
            Weather Settings
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Configure weather display for your location using real-time weather data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <Alert className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              Weather data is provided by OpenWeatherMap API. The app displays current conditions 
              and 7-day forecasts including temperature and weather icons in calendar views.
            </AlertDescription>
          </Alert>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium mb-2 text-gray-900 dark:text-gray-100">Weather features:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Real-time current temperature and conditions</li>
              <li>7-day weather forecast for calendar views</li>
              <li>Weather icons in Month and Week calendar views</li>
              <li>Location-based weather using zip code</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeatherTab;
