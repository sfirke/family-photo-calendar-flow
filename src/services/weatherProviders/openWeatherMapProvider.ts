/**
 * OpenWeatherMap Provider
 * 
 * Implements the existing OpenWeatherMap API integration
 * as part of the new provider system.
 */

import { WeatherProvider, WeatherData, WeatherProviderConfig } from './types';

interface OpenWeatherApiResponse {
  name: string;
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
  wind?: {
    speed: number;
  };
}

interface OpenWeatherForecastResponse {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      temp_min: number;
      temp_max: number;
      humidity: number;
    };
    weather: Array<{
      main: string;
      description: string;
    }>;
    wind?: {
      speed: number;
    };
  }>;
}

export class OpenWeatherMapProvider implements WeatherProvider {
  name = 'openweathermap';
  displayName = 'OpenWeatherMap';
  maxForecastDays = 5;
  requiresApiKey = true;

  async fetchWeather(zipCode: string, config: WeatherProviderConfig): Promise<WeatherData> {
    const baseUrl = 'https://api.openweathermap.org/data/2.5';
    
    try {
      // Fetch current weather
      const currentResponse = await fetch(
        `${baseUrl}/weather?zip=${zipCode}&appid=${config.apiKey}&units=imperial`
      );

      if (!currentResponse.ok) {
        throw new Error(`Current weather API error: ${currentResponse.status}`);
      }

      const currentData: OpenWeatherApiResponse = await currentResponse.json();

      // Fetch 5-day forecast
      const forecastResponse = await fetch(
        `${baseUrl}/forecast?zip=${zipCode}&appid=${config.apiKey}&units=imperial`
      );

      let forecastData: OpenWeatherForecastResponse | null = null;
      if (forecastResponse.ok) {
        forecastData = await forecastResponse.json();
      }

      return {
        location: currentData.name || 'Unknown Location',
        temperature: Math.round(currentData.main.temp),
        condition: currentData.weather[0]?.main || 'Unknown',
        description: currentData.weather[0]?.description || '',
        humidity: currentData.main.humidity,
        windSpeed: currentData.wind?.speed,
        forecast: forecastData ? this.formatForecastData(forecastData) : [],
        lastUpdated: new Date().toISOString(),
        provider: this.displayName
      };
    } catch (error) {
      console.error('OpenWeatherMap API error:', error);
      throw error;
    }
  }

  private formatForecastData(data: OpenWeatherForecastResponse) {
    // Group by day and take one forecast per day
    const dailyForecasts = new Map();
    
    data.list.forEach((item) => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toDateString();
      
      if (!dailyForecasts.has(dateKey)) {
        dailyForecasts.set(dateKey, {
          date: date.toISOString().split('T')[0],
          high: Math.round(item.main.temp_max),
          low: Math.round(item.main.temp_min),
          condition: item.weather[0]?.main || 'Unknown',
          description: item.weather[0]?.description || '',
          humidity: item.main.humidity,
          windSpeed: item.wind?.speed
        });
      }
    });
    
    return Array.from(dailyForecasts.values()).slice(0, this.maxForecastDays);
  }

  validateApiKey(apiKey: string): boolean {
    // Basic validation - OpenWeatherMap keys are typically 32 character hex strings
    return /^[a-f0-9]{32}$/i.test(apiKey);
  }

  getConfigRequirements() {
    return {
      apiKeyUrl: 'https://openweathermap.org/api',
      documentation: 'https://openweathermap.org/api/one-call-api',
      pricingUrl: 'https://openweathermap.org/price'
    };
  }
}