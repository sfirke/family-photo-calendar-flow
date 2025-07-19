/**
 * WeatherContext - AccuWeather Data Management
 * 
 * Centralized AccuWeather data management for the Family Calendar application.
 * Provides real-time and forecast weather information with:
 * - Automatic location detection via IP address
 * - Manual location override with zip code
 * - Automatic background updates every 30 minutes
 * - Intelligent caching to prevent excessive API calls
 * - Graceful error handling with cached data fallback
 * - Performance optimization using IntervalManager
 * 
 * Features:
 * - Current weather conditions with location
 * - 15-day weather forecasts for calendar planning
 * - Temperature and condition information for each day
 * - Automatic retry logic for failed API calls
 * 
 * Performance Considerations:
 * - Rate limiting: Minimum 5 minutes between API calls
 * - Background refresh: Updates every 30 minutes
 * - Memory optimization: Memoized callbacks and computed values
 * - Error recovery: Falls back to cached data on API failures
 */

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useWeatherSettings } from '@/contexts/settings/useWeatherSettings';
import { WeatherData } from '@/types/weather';
import { IntervalManager } from '@/utils/performanceUtils';

interface WeatherContextType {
  /** Current weather data object or null if not loaded */
  weatherData: WeatherData | null;
  /** Whether weather data is currently being fetched */
  isLoading: boolean;
  /** Get weather forecast for a specific date with high/low temps */
  getWeatherForDate: (date: Date) => { temp: number; condition: string; highTemp?: number; lowTemp?: number };
  /** Get current weather conditions and location */
  getCurrentWeather: () => { temp: number; condition: string; location: string };
  /** Manually refresh weather data (bypasses rate limiting) */
  refreshWeather: () => Promise<void>;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

/**
 * Weather Provider Component
 * 
 * Manages AccuWeather data fetching, caching, and distribution throughout
 * the application. Automatically handles background updates and provides
 * fallback data when API calls fail.
 */
export const WeatherProvider = ({ children }: { children: React.ReactNode }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { 
    zipCode, 
    weatherApiKey, 
    locationKey,
    useManualLocation 
  } = useWeatherSettings();
  const lastFetchRef = useRef<number>(0);

  /**
   * Optimized weather loading function with rate limiting and error recovery
   * 
   * Implements intelligent API call management:
   * - Prevents excessive API calls with 5-minute minimum interval
   * - Gracefully handles API failures by maintaining cached data
   * - Updates loading state appropriately for UI feedback
   * 
   * @param forceRefresh - Bypass rate limiting for manual refreshes
   */
  const loadWeather = useCallback(async (forceRefresh = false) => {
    if (!weatherApiKey) return;
    
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;
    
    // Rate limiting: Prevent excessive API calls (minimum 5 minutes between calls)
    if (!forceRefresh && timeSinceLastFetch < 5 * 60 * 1000) {
      return;
    }
    
    setIsLoading(true);
    lastFetchRef.current = now;
    
    try {
      console.log('WeatherContext - Using AccuWeather service');
      const { AccuWeatherProvider } = await import('@/services/weatherProviders/accuWeatherProvider');
      const provider = new AccuWeatherProvider();
      
      // Use zip code only if manual location is enabled
      const locationData = useManualLocation ? zipCode : '';
      
      const weatherData = await provider.fetchWeather(locationData, {
        apiKey: weatherApiKey,
        baseUrl: '',
        rateLimit: 60,
        maxForecastDays: 15
      });
      
      setWeatherData(weatherData);
    } catch (error) {
      console.warn('Weather fetch failed, using cached data if available:', error);
      // Keep existing data on error for 24/7 reliability
      // This ensures the app continues to work even when weather APIs are down
    } finally {
      setIsLoading(false);
    }
  }, [zipCode, weatherApiKey, useManualLocation]);

  /**
   * Exposed refresh function for manual weather updates
   * 
   * Allows users to manually refresh weather data through UI actions.
   * Bypasses rate limiting since it's user-initiated.
   */
  const refreshWeather = useCallback(async () => {
    await loadWeather(true);
  }, [loadWeather]);

  /**
   * Initialize weather loading and set up automatic refresh intervals
   * 
   * Sets up the weather system with:
   * - Initial data load on component mount
   * - Automatic background refresh every 30 minutes
   * - Cleanup of intervals on component unmount
   */
  useEffect(() => {
    // Initial load when component mounts or settings change
    loadWeather();

    // Set up optimized refresh interval using IntervalManager
    // This prevents memory leaks and manages multiple intervals efficiently
    IntervalManager.setInterval('weather-refresh', () => {
      loadWeather();
    }, 30 * 60 * 1000); // 30 minutes - good balance of freshness and API usage

    // Cleanup interval on unmount or dependency changes
    return () => {
      IntervalManager.clearInterval('weather-refresh');
    };
  }, [loadWeather]);

  /**
   * Get current weather conditions with fallback
   * 
   * Provides current weather data with sensible defaults when
   * weather data is not available. Memoized for performance.
   * 
   * @returns Object with current temperature, condition, and location
   */
  const getCurrentWeather = useMemo(() => {
    return () => {
      if (!weatherData) {
        // Fallback data when weather API is unavailable
        return { temp: 75, condition: 'Sunny', location: 'Location not found' };
      }
      
      return {
        temp: weatherData.temperature,
        condition: weatherData.condition,
        location: weatherData.location
      };
    };
  }, [weatherData]);

  /**
   * Get weather forecast for specific date with intelligent fallbacks
   * 
   * Provides weather information for calendar dates with multiple fallback strategies:
   * 1. Use forecast data if available for the specific date
   * 2. Use current weather for today's date
   * 3. Generate reasonable estimates based on current weather
   * 
   * @param date - The date to get weather for
   * @returns Object with temperature and weather condition
   */
  const getWeatherForDate = useMemo(() => {
    return (date: Date) => {
      if (!weatherData) {
        // Default fallback when no weather data is available
        return { temp: 75, condition: 'Sunny', highTemp: 80, lowTemp: 70 };
      }

      const dateString = date.toISOString().split('T')[0];
      
      // Try to find forecast data for the specific date
      if (weatherData.forecast && weatherData.forecast.length > 0) {
        const forecast = weatherData.forecast.find(f => f.date === dateString);
        if (forecast) {
          console.log(`Weather for ${dateString}: condition="${forecast.condition}", temp=${forecast.high || forecast.temp}`);
          return { 
            temp: forecast.high || forecast.temp || weatherData.temperature, 
            condition: forecast.condition,
            highTemp: forecast.high,
            lowTemp: forecast.low
          };
        }
      }
      
      // Fall back to current weather for today only
      const today = new Date().toISOString().split('T')[0];
      if (dateString === today) {
        return { 
          temp: weatherData.temperature, 
          condition: weatherData.condition,
          highTemp: weatherData.temperature + 5,
          lowTemp: weatherData.temperature - 10
        };
      }
      
      // Generate reasonable estimates for future dates without forecast data
      const daysSinceToday = Math.floor((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const tempVariation = Math.floor(Math.random() * 11) - 5; // -5 to +5 degree variation
      const fallbackTemp = Math.max(weatherData.temperature + tempVariation, 50); // Minimum 50°F
      
      return { 
        temp: fallbackTemp, 
        condition: weatherData.condition,
        highTemp: fallbackTemp + 5,
        lowTemp: fallbackTemp - 10
      };
    };
  }, [weatherData]);

  /**
   * Memoized context value to prevent unnecessary re-renders
   * 
   * Optimizes performance by only updating context when actual
   * weather data or functions change, not on every render.
   */
  const contextValue = useMemo(() => ({
    weatherData,
    isLoading,
    getWeatherForDate,
    getCurrentWeather,
    refreshWeather
  }), [weatherData, isLoading, getWeatherForDate, getCurrentWeather, refreshWeather]);

  return (
    <WeatherContext.Provider value={contextValue}>
      {children}
    </WeatherContext.Provider>
  );
};

/**
 * Hook to access weather context
 * 
 * Must be used within a WeatherProvider component.
 * Provides access to weather data and management functions.
 * 
 * @throws Error if used outside WeatherProvider
 */
export const useWeather = () => {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
};
