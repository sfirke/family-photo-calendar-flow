import React, { createContext, useContext } from 'react';
import { WeatherData } from '@/types/weather';

export interface WeatherContextType {
  weatherData: WeatherData | null;
  isLoading: boolean;
  getWeatherForDate: (date: Date) => { temp: number; condition: string; highTemp?: number; lowTemp?: number };
  getCurrentWeather: () => { temp: number; condition: string; location: string };
  refreshWeather: (forceRefresh?: boolean) => Promise<void>;
}

export const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export const useWeather = () => {
  const context = useContext(WeatherContext);
  if (context === undefined) throw new Error('useWeather must be used within a WeatherProvider');
  return context;
};
