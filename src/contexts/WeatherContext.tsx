
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { fetchWeatherData, WeatherData } from '@/services/weatherService';
import { useSettings } from './SettingsContext';

interface WeatherContextType {
  weatherData: WeatherData | null;
  isLoading: boolean;
  getWeatherForDate: (date: Date) => { temp: number; condition: string };
  getCurrentWeather: () => { temp: number; condition: string; location: string };
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export const WeatherProvider = ({ children }: { children: React.ReactNode }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { zipCode, weatherApiKey } = useSettings();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadWeather = async () => {
    if (!zipCode) return;
    
    setIsLoading(true);
    try {
      const data = await fetchWeatherData(zipCode, weatherApiKey);
      setWeatherData(data);
      console.log('Weather data loaded/refreshed with extended forecast:', data.forecast.length, 'days');
    } catch (error) {
      console.error('Failed to load weather:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load weather data initially
    loadWeather();

    // Set up 30-minute refresh interval
    const THIRTY_MINUTES = 30 * 60 * 1000; // 30 minutes in milliseconds
    
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    refreshIntervalRef.current = setInterval(() => {
      console.log('Refreshing weather data (30-minute interval)');
      loadWeather();
    }, THIRTY_MINUTES);

    // Cleanup interval on unmount or when dependencies change
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [zipCode, weatherApiKey]);

  const getCurrentWeather = () => {
    if (!weatherData) {
      return { temp: 75, condition: 'Sunny', location: 'Location not found' };
    }
    
    return {
      temp: weatherData.temperature,
      condition: weatherData.condition,
      location: weatherData.location
    };
  };

  const getWeatherForDate = (date: Date) => {
    if (!weatherData) {
      return { temp: 75, condition: 'Sunny' };
    }

    const dateString = date.toISOString().split('T')[0];
    
    // Try to find in extended forecast array
    if (weatherData.forecast && weatherData.forecast.length > 0) {
      const forecast = weatherData.forecast.find(f => f.date === dateString);
      if (forecast) {
        // Return the high temperature for the day
        return { temp: forecast.high || forecast.temp, condition: forecast.condition };
      }
    }
    
    // Fall back to current weather for today only
    const today = new Date().toISOString().split('T')[0];
    if (dateString === today) {
      return { temp: weatherData.temperature, condition: weatherData.condition };
    }
    
    // Final fallback with some variation
    const daysSinceToday = Math.floor((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const tempVariation = Math.floor(Math.random() * 11) - 5; // -5 to +5
    const fallbackTemp = Math.max(weatherData.temperature + tempVariation, 50);
    
    return { temp: fallbackTemp, condition: weatherData.condition };
  };

  return (
    <WeatherContext.Provider value={{
      weatherData,
      isLoading,
      getWeatherForDate,
      getCurrentWeather
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
