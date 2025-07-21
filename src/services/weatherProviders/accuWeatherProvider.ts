/**
 * AccuWeather Provider
 * 
 * Implements AccuWeather API integration via Supabase Edge Function
 * to eliminate CORS issues and provide server-side caching.
 */

import { WeatherProvider, WeatherData, WeatherProviderConfig } from './types';
import { mapAccuWeatherCondition } from '@/utils/weatherIcons';
import { supabase } from '@/integrations/supabase/client';

export class AccuWeatherProvider implements WeatherProvider {
  name = 'accuweather';
  displayName = 'AccuWeather';
  maxForecastDays = 30;
  requiresApiKey = true;

  async fetchWeather(zipCode: string, config: WeatherProviderConfig): Promise<WeatherData> {
    console.log('AccuWeatherProvider - Fetching weather via Supabase edge function');
    
    try {
      const { data, error } = await supabase.functions.invoke('weather-proxy', {
        body: {
          zipCode: zipCode.trim(),
          apiKey: config.apiKey
        }
      });

      if (error) {
        console.error('AccuWeatherProvider - Edge function error:', error);
        throw new Error(`Weather service error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No weather data received from service');
      }

      // If there's an error in the response data
      if (data.error) {
        throw new Error(data.error);
      }

      console.log('AccuWeatherProvider - Raw response:', data);

      // Transform the server response to our WeatherData format
      const weatherData: WeatherData = {
        location: this.extractLocationName(data),
        temperature: this.extractTemperature(data),
        condition: this.extractCondition(data),
        description: this.extractDescription(data),
        humidity: this.extractHumidity(data),
        windSpeed: this.extractWindSpeed(data),
        uvIndex: this.extractUVIndex(data),
        forecast: this.extractForecast(data),
        lastUpdated: data.lastUpdated || new Date().toISOString(),
        provider: this.displayName
      };

      console.log('AccuWeatherProvider - Transformed weather data:', weatherData);
      return weatherData;

    } catch (error) {
      console.error('AccuWeatherProvider - API error:', error);
      
      // Enhanced error messages for common issues
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Invalid API key')) {
          throw new Error('Invalid AccuWeather API key or access denied');
        }
        if (error.message.includes('400') || error.message.includes('location not found')) {
          throw new Error('Location not found - please check your zip code');
        }
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          throw new Error('API rate limit exceeded - please try again later');
        }
        if (error.message.includes('timeout') || error.message.includes('network')) {
          throw new Error('Weather service temporarily unavailable - please try again');
        }
      }
      
      throw error;
    }
  }

  private extractLocationName(data: any): string {
    // Try to get location from current conditions first, then fall back
    if (data.current?.locationName) {
      return data.current.locationName;
    }
    
    // Create a reasonable location name from available data
    return 'Current Location';
  }

  private extractTemperature(data: any): number {
    if (data.current?.Temperature?.Imperial?.Value) {
      return Math.round(data.current.Temperature.Imperial.Value);
    }
    return 72; // Fallback temperature
  }

  private extractCondition(data: any): string {
    if (data.current?.WeatherText) {
      return this.mapCondition(data.current.WeatherText);
    }
    return 'Clear';
  }

  private extractDescription(data: any): string {
    if (data.current?.WeatherText) {
      return data.current.WeatherText;
    }
    return 'Weather conditions unavailable';
  }

  private extractHumidity(data: any): number {
    if (data.current?.RelativeHumidity !== undefined) {
      return data.current.RelativeHumidity;
    }
    return 50; // Fallback humidity
  }

  private extractWindSpeed(data: any): number {
    if (data.current?.Wind?.Speed?.Imperial?.Value !== undefined) {
      return data.current.Wind.Speed.Imperial.Value;
    }
    return 5; // Fallback wind speed
  }

  private extractUVIndex(data: any): number {
    if (data.current?.UVIndex !== undefined) {
      return data.current.UVIndex;
    }
    return 3; // Fallback UV index
  }

  private extractForecast(data: any): Array<{
    date: string;
    high: number;
    low: number;
    condition: string;
    description: string;
  }> {
    if (data.forecast?.DailyForecasts && Array.isArray(data.forecast.DailyForecasts)) {
      return data.forecast.DailyForecasts.map((day: any) => ({
        date: new Date(day.Date).toISOString().split('T')[0],
        high: Math.round(day.Temperature.Maximum.Value),
        low: Math.round(day.Temperature.Minimum.Value),
        condition: this.mapCondition(day.Day.IconPhrase),
        description: day.Day.LongPhrase || day.Day.IconPhrase
      }));
    }

    // Fallback forecast if none available
    return this.getMinimalForecast();
  }

  private getMinimalForecast() {
    // Return a basic 3-day forecast as fallback
    const today = new Date();
    return Array.from({ length: 3 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      return {
        date: date.toISOString().split('T')[0],
        high: 75,
        low: 60,
        condition: 'Clear',
        description: 'Weather forecast temporarily unavailable'
      };
    });
  }

  private mapCondition(accuWeatherCondition: string): string {
    return mapAccuWeatherCondition(accuWeatherCondition);
  }

  validateApiKey(apiKey: string): boolean {
    // AccuWeather API keys are typically 32 character alphanumeric strings
    return /^[a-zA-Z0-9]{32}$/.test(apiKey);
  }

  getConfigRequirements() {
    return {
      apiKeyUrl: 'https://developer.accuweather.com/',
      documentation: 'https://developer.accuweather.com/accuweather-forecast-api/apis',
      pricingUrl: 'https://developer.accuweather.com/packages'
    };
  }
}