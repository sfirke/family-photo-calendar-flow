
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const WeatherInfo = () => {
  return (
    <div className="space-y-4">
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
          <li>Updates every 30 minutes for current weather</li>
        </ul>
      </div>
    </div>
  );
};

export default WeatherInfo;
