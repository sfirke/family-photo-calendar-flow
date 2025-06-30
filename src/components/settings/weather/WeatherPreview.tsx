
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WeatherData, WeatherForecastDay } from '@/types/weather';

interface WeatherPreviewProps {
  weatherData: WeatherData;
}

const WeatherPreview = ({ weatherData }: WeatherPreviewProps) => {
  const formatCondition = (condition: string) => {
    return condition.charAt(0).toUpperCase() + condition.slice(1).toLowerCase();
  };

  return (
    <Card className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Weather Preview</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Current weather and 7-day forecast for {weatherData.location}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Current Weather</h4>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {weatherData.temperature}°F
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {formatCondition(weatherData.condition)}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">7-Day Forecast</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {weatherData.forecast.slice(0, 7).map((day: WeatherForecastDay, index: number) => {
                const date = new Date(day.date);
                const isToday = index === 0;
                return (
                  <div key={day.date} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {day.high || day.temp}°{day.low ? `/${day.low}°` : ''} {formatCondition(day.condition)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherPreview;
