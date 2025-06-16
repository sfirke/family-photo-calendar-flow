import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { fetchWeatherData, WeatherData } from '@/services/weatherService';
import { useSettings } from './SettingsContext';
import { IntervalManager } from '@/utils/performanceUtils';

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
  const lastFetchRef = useRef<number>(0);

  // Optimized load function with caching and error recovery
  const loadWeather = useCallback(async (forceRefresh = false) => {
    if (!zipCode) return;
    
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;
    
    // Prevent excessive API calls (minimum 5 minutes between calls)
    if (!forceRefresh && timeSinceLastFetch < 5 * 60 * 1000) {
      return;
    }
    
    setIsLoading(true);
    lastFetchRef.current = now;
    
    try {
      const data = await fetchWeatherData(zipCode, weatherApiKey);
      setWeatherData(data);
    } catch (error) {
      console.warn('Weather fetch failed, using cached data if available:', error);
      // Keep existing data on error for 24/7 reliability
    } finally {
      setIsLoading(false);
    }
  }, [zipCode, weatherApiKey]);

  useEffect(() => {
    // Initial load
    loadWeather();

    // Set up optimized refresh interval using IntervalManager
    IntervalManager.setInterval('weather-refresh', () => {
      loadWeather();
    }, 30 * 60 * 1000); // 30 minutes

    // Cleanup on unmount
    return () => {
      IntervalManager.clearInterval('weather-refresh');
    };
  }, [loadWeather]);

  const getCurrentWeather = useMemo(() => {
    return () => {
      if (!weatherData) {
        return { temp: 75, condition: 'Sunny', location: 'Location not found' };
      }
      
      return {
        temp: weatherData.temperature,
        condition: weatherData.condition,
        location: weatherData.location
      };
    };
  }, [weatherData]);

  const getWeatherForDate = useMemo(() => {
    return (date: Date) => {
      if (!weatherData) {
        return { temp: 75, condition: 'Sunny' };
      }

      const dateString = date.toISOString().split('T')[0];
      
      // Try to find in extended forecast array
      if (weatherData.forecast && weatherData.forecast.length > 0) {
        const forecast = weatherData.forecast.find(f => f.date === dateString);
        if (forecast) {
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
  }, [weatherData]);

  const contextValue = useMemo(() => ({
    weatherData,
    isLoading,
    getWeatherForDate,
    getCurrentWeather
  }), [weatherData, isLoading, getWeatherForDate, getCurrentWeather]);

  return (
    <WeatherContext.Provider value={contextValue}>
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
