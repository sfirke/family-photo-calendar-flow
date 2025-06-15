
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchWeatherData, WeatherData } from '@/services/weatherService';
import { useSettings } from './SettingsContext';

interface WeatherContextType {
  weatherData: WeatherData | null;
  isLoading: boolean;
  getWeatherForDate: (date: Date) => { temp: number; condition: string };
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export const WeatherProvider = ({ children }: { children: React.ReactNode }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { zipCode, weatherApiKey } = useSettings();

  useEffect(() => {
    const loadWeather = async () => {
      if (!zipCode) return;
      
      setIsLoading(true);
      try {
        const data = await fetchWeatherData(zipCode, weatherApiKey);
        setWeatherData(data);
      } catch (error) {
        console.error('Failed to load weather:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWeather();
  }, [zipCode, weatherApiKey]);

  const getWeatherForDate = (date: Date) => {
    if (!weatherData?.forecast) {
      return { temp: 75, condition: 'Sunny' };
    }

    const dateString = date.toISOString().split('T')[0];
    const forecast = weatherData.forecast.find(f => f.date === dateString);
    
    return forecast 
      ? { temp: forecast.temp, condition: forecast.condition }
      : { temp: weatherData.temperature, condition: weatherData.condition };
  };

  return (
    <WeatherContext.Provider value={{
      weatherData,
      isLoading,
      getWeatherForDate
    }}>
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = () => {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
};
