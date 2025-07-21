/**
 * AccuWeather Provider
 * 
 * Implements AccuWeather API integration with support for
 * up to 30-day forecasts (depending on subscription level).
 * 
 * Includes CORS proxy support for iOS PWA compatibility.
 */

import { WeatherProvider, WeatherData, WeatherProviderConfig } from './types';
import { mapAccuWeatherCondition } from '@/utils/weatherIcons';
import { weatherCorsProxy } from '@/utils/weather/corsProxyService';

interface AccuWeatherLocationResponse {
  Key: string;
  LocalizedName: string;
  Country: {
    LocalizedName: string;
  };
}

interface AccuWeatherCurrentResponse {
  LocalObservationDateTime: string;
  WeatherText: string;
  Temperature: {
    Imperial: {
      Value: number;
    };
  };
  RelativeHumidity: number;
  Wind: {
    Speed: {
      Imperial: {
        Value: number;
      };
    };
  };
  UVIndex: number;
}

interface AccuWeatherForecastResponse {
  DailyForecasts: Array<{
    Date: string;
    Temperature: {
      Minimum: {
        Value: number;
      };
      Maximum: {
        Value: number;
      };
    };
    Day: {
      IconPhrase: string;
      LongPhrase: string;
    };
    Night: {
      IconPhrase: string;
    };
  }>;
}

export class AccuWeatherProvider implements WeatherProvider {
  name = 'accuweather';
  displayName = 'AccuWeather';
  maxForecastDays = 30;
  requiresApiKey = true;

  async fetchWeather(zipCode: string, config: WeatherProviderConfig): Promise<WeatherData> {
    const baseUrl = 'https://dataservice.accuweather.com';
    console.log('AccuWeatherProvider - Starting enhanced weather fetch');
    
    try {
      // Get location key with enhanced error handling
      const locationKey = zipCode && zipCode.trim() 
        ? await this.getLocationKeyByZip(zipCode, config.apiKey, baseUrl)
        : await this.getLocationKeyByIP(config.apiKey, baseUrl);
      
      console.log(`AccuWeatherProvider - Using location key: ${locationKey}`);
      
      // Fetch current conditions and forecast concurrently
      const [currentData, forecastData] = await Promise.allSettled([
        this.getCurrentConditions(locationKey, config.apiKey, baseUrl),
        this.getForecast(locationKey, config.apiKey, baseUrl)
      ]);
      
      // Handle current conditions result
      if (currentData.status === 'rejected') {
        console.error('AccuWeatherProvider - Current conditions failed:', currentData.reason);
        throw new Error(`Failed to fetch current conditions: ${currentData.reason}`);
      }
      
      // Handle forecast result (allow partial failure)
      let forecast = [];
      if (forecastData.status === 'fulfilled') {
        forecast = forecastData.value;
      } else {
        console.warn('AccuWeatherProvider - Forecast failed, using minimal forecast:', forecastData.reason);
        forecast = this.getMinimalForecast();
      }
      
      const result = {
        location: currentData.value.location,
        temperature: currentData.value.temperature,
        condition: currentData.value.condition,
        description: currentData.value.description,
        humidity: currentData.value.humidity,
        windSpeed: currentData.value.windSpeed,
        uvIndex: currentData.value.uvIndex,
        forecast: forecast,
        lastUpdated: new Date().toISOString(),
        provider: this.displayName
      };
      
      console.log('AccuWeatherProvider - Successfully fetched weather data');
      return result;
    } catch (error) {
      console.error('AccuWeatherProvider - API error:', error);
      
      // Enhanced error messages for common issues
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error('Invalid AccuWeather API key or exceeded rate limit');
        }
        if (error.message.includes('404')) {
          throw new Error('Location not found - please check your zip code');
        }
        if (error.message.includes('timeout') || error.message.includes('CORS')) {
          throw new Error('Weather service temporarily unavailable - please try again');
        }
      }
      
      throw error;
    }
  }

  private async getLocationKeyByZip(zipCode: string, apiKey: string, baseUrl: string): Promise<string> {
    const url = `${baseUrl}/locations/v1/postalcodes/US/search?apikey=${apiKey}&q=${zipCode}`;
    const response = await weatherCorsProxy.fetchWithProxy(url);

    if (!response.ok) {
      throw new Error(`Zip code location lookup failed: ${response.status}`);
    }

    const locations: AccuWeatherLocationResponse[] = await response.json();
    
    if (!locations || locations.length === 0) {
      throw new Error('Location not found for provided zip code');
    }

    return locations[0].Key;
  }

  private async getLocationKeyByIP(apiKey: string, baseUrl: string): Promise<string> {
    const url = `${baseUrl}/locations/v1/cities/ipaddress?apikey=${apiKey}`;
    
    console.log('AccuWeatherProvider - Fetching location by IP with CORS proxy support');
    const response = await weatherCorsProxy.fetchWithProxy(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AccuWeatherProvider - IP location API error response:', errorText);
      throw new Error(`IP location lookup failed: ${response.status} - ${errorText}`);
    }

    const location: AccuWeatherLocationResponse = await response.json();
    
    if (!location || !location.Key) {
      throw new Error('Location not found for current IP');
    }

    return location.Key;
  }

  private async getCurrentConditions(locationKey: string, apiKey: string, baseUrl: string) {
    const url = `${baseUrl}/currentconditions/v1/${locationKey}?apikey=${apiKey}&details=true`;
    const response = await weatherCorsProxy.fetchWithProxy(url);

    if (!response.ok) {
      throw new Error(`Current conditions failed: ${response.status}`);
    }

    const current: AccuWeatherCurrentResponse[] = await response.json();
    
    if (!current || current.length === 0) {
      throw new Error('No current conditions data');
    }

    const data = current[0];
    
    // Get location name
    const locationName = await this.getLocationName(locationKey, apiKey, baseUrl);
    
    return {
      location: locationName,
      temperature: Math.round(data.Temperature.Imperial.Value),
      condition: this.mapCondition(data.WeatherText),
      description: data.WeatherText,
      humidity: data.RelativeHumidity,
      windSpeed: data.Wind?.Speed?.Imperial?.Value,
      uvIndex: data.UVIndex
    };
  }

  private async getForecast(locationKey: string, apiKey: string, baseUrl: string) {
    // Get 15-day forecast as specified
    const url = `${baseUrl}/forecasts/v1/daily/15day/${locationKey}?apikey=${apiKey}&details=true&metric=false`;
    const response = await weatherCorsProxy.fetchWithProxy(url);

    if (!response.ok) {
      throw new Error(`15-day forecast failed: ${response.status}`);
    }

    // Check if response is actually JSON
    const responseText = await response.text();
    
    
    if (responseText.trim() === 'Offline' || responseText.trim() === '') {
      console.warn('AccuWeatherProvider - Forecast API returned "Offline", falling back to 5-day forecast');
      // Try 5-day forecast as fallback
      return this.getFallbackForecast(locationKey, apiKey, baseUrl);
    }

    try {
      const forecast: AccuWeatherForecastResponse = JSON.parse(responseText);
      return this.formatForecastData(forecast);
    } catch (jsonError) {
      console.error('AccuWeatherProvider - Failed to parse forecast JSON:', jsonError);
      console.error('AccuWeatherProvider - Response text:', responseText);
      // Try 5-day forecast as fallback
      return this.getFallbackForecast(locationKey, apiKey, baseUrl);
    }
  }

  private async getFallbackForecast(locationKey: string, apiKey: string, baseUrl: string) {
    console.log('AccuWeatherProvider - Trying 5-day forecast fallback with CORS proxy');
    
    try {
      const url = `${baseUrl}/forecasts/v1/daily/5day/${locationKey}?apikey=${apiKey}&details=true&metric=false`;
      const response = await weatherCorsProxy.fetchWithProxy(url);

      if (!response.ok) {
        throw new Error(`5-day forecast failed: ${response.status}`);
      }

      const responseText = await response.text();
      
      
      if (responseText.trim() === 'Offline' || responseText.trim() === '') {
        console.warn('AccuWeatherProvider - 5-day forecast also returned "Offline", using minimal forecast');
        return this.getMinimalForecast();
      }

      try {
        const forecast: AccuWeatherForecastResponse = JSON.parse(responseText);
        return this.formatForecastData(forecast);
      } catch (jsonError) {
        console.error('AccuWeatherProvider - Failed to parse 5-day forecast JSON:', jsonError);
        return this.getMinimalForecast();
      }
    } catch (error) {
      console.error('AccuWeatherProvider - 5-day forecast fallback failed:', error);
      return this.getMinimalForecast();
    }
  }

  private getMinimalForecast() {
    
    // Return a basic 3-day forecast as absolute fallback
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

  private async getLocationName(locationKey: string, apiKey: string, baseUrl: string): Promise<string> {
    try {
      const url = `${baseUrl}/locations/v1/${locationKey}?apikey=${apiKey}`;
      const response = await weatherCorsProxy.fetchWithProxy(url);

      if (response.ok) {
        const location: AccuWeatherLocationResponse = await response.json();
        return `${location.LocalizedName}, ${location.Country.LocalizedName}`;
      }
    } catch (error) {
      console.warn('Failed to fetch location name:', error);
    }
    
    return 'Current Location';
  }

  private formatForecastData(data: AccuWeatherForecastResponse) {
    return data.DailyForecasts.map(day => ({
      date: new Date(day.Date).toISOString().split('T')[0],
      high: Math.round(day.Temperature.Maximum.Value),
      low: Math.round(day.Temperature.Minimum.Value),
      condition: this.mapCondition(day.Day.IconPhrase),
      description: day.Day.LongPhrase || day.Day.IconPhrase
    }));
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