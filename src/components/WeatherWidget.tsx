
import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, Snowflake } from 'lucide-react';
import { fetchWeatherData, WeatherData } from '@/services/weatherService';

interface WeatherWidgetProps {
  zipCode: string;
}

const WeatherWidget = ({ zipCode }: WeatherWidgetProps) => {
  const [weatherData, setWeatherData] = useState<WeatherData>({
    temperature: 75,
    condition: 'Sunny',
    location: 'Loading...',
    forecast: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWeather = async () => {
      if (!zipCode) return;
      
      setIsLoading(true);
      try {
        const data = await fetchWeatherData(zipCode);
        setWeatherData(data);
      } catch (error) {
        console.error('Failed to load weather:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWeather();
  }, [zipCode]);

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

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-white">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        <div>
          <div className="text-2xl font-light">--°F</div>
          <div className="text-sm text-white/70">Loading...</div>
        </div>
      </div>
    );
  }

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
