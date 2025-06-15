
import React from 'react';
import { Sun, Cloud, CloudRain, Snowflake } from 'lucide-react';

interface WeatherWidgetProps {
  zipCode: string;
}

const WeatherWidget = ({ zipCode }: WeatherWidgetProps) => {
  // Mock weather data - in a real app, this would fetch from a weather API
  const weatherData = {
    temperature: 75,
    condition: 'Sunny',
    location: 'Detroit, MI'
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return <Sun className="h-6 w-6 text-yellow-400" />;
      case 'cloudy':
      case 'partly cloudy':
        return <Cloud className="h-6 w-6 text-gray-300" />;
      case 'rain':
      case 'rainy':
        return <CloudRain className="h-6 w-6 text-blue-400" />;
      case 'snow':
      case 'snowy':
        return <Snowflake className="h-6 w-6 text-blue-200" />;
      default:
        return <Sun className="h-6 w-6 text-yellow-400" />;
    }
  };

  return (
    <div className="flex items-center gap-3 text-white">
      {getWeatherIcon(weatherData.condition)}
      <div>
        <div className="text-2xl font-light">{weatherData.temperature}°F</div>
        <div className="text-sm text-white/70">
          {weatherData.condition} • {weatherData.location}
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
