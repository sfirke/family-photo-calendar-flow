
import React from 'react';
import { Sun, Cloud, CloudRain, Snowflake } from 'lucide-react';

interface WeatherDisplayProps {
  weather: { temp: number; condition: string; highTemp?: number; lowTemp?: number };
  className?: string;
  forceWhite?: boolean;
}

const WeatherDisplay = ({ weather, className = '', forceWhite = false }: WeatherDisplayProps) => {
  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return <Sun className="h-4 w-4 text-yellow-400" />;
      case 'cloudy':
      case 'partly cloudy':
        return <Cloud className="h-4 w-4 text-gray-300" />;
      case 'rain':
      case 'rainy':
        return <CloudRain className="h-4 w-4 text-blue-400" />;
      case 'snow':
      case 'snowy':
        return <Snowflake className="h-4 w-4 text-blue-200" />;
      default:
        return <Sun className="h-4 w-4 text-yellow-400" />;
    }
  };

  const textColor = forceWhite ? 'text-white' : 'text-gray-600 dark:text-gray-300';
  
  // Use highTemp if available, otherwise fallback to temp
  const displayTemp = weather.highTemp ?? weather.temp;
  const lowTemp = weather.lowTemp ?? (weather.temp - 10);

  return (
    <div className={`flex items-center gap-2 ${textColor} ${className}`}>
      {getWeatherIcon(weather.condition)}
      <div className="flex flex-col items-center">
        <span className="font-bold text-lg leading-tight">{displayTemp}°</span>
        <span className="text-xs opacity-75">Low {lowTemp}°</span>
      </div>
    </div>
  );
};

export default WeatherDisplay;
