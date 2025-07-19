
import React from 'react';
import { getWeatherIcon } from '@/utils/weatherIcons';

interface WeatherDisplayProps {
  weather: { temp: number; condition: string; highTemp?: number; lowTemp?: number };
  className?: string;
  forceWhite?: boolean;
}

const WeatherDisplay = ({ weather, className = '', forceWhite = false }: WeatherDisplayProps) => {

  const textColor = forceWhite ? 'text-white' : 'text-gray-600 dark:text-gray-300';
  
  // Use highTemp if available, otherwise fallback to temp
  const displayTemp = weather.highTemp ?? weather.temp;
  const lowTemp = weather.lowTemp ?? (weather.temp - 10);

  return (
    <div className={`flex items-center gap-2 ${textColor} ${className}`}>
      {getWeatherIcon(weather.condition, { size: "h-4 w-4" })}
      <div className="flex flex-col items-center">
        <span className="font-bold text-lg leading-tight">{displayTemp}°</span>
        <span className="text-xs opacity-75">Low {lowTemp}°</span>
      </div>
    </div>
  );
};

export default WeatherDisplay;
