/**
 * AccuWeather Provider
 * 
 * Implements AccuWeather API integration with support for
 * up to 30-day forecasts (depending on subscription level).
 */

import { WeatherProvider, WeatherData, WeatherProviderConfig } from './types';

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
    
    try {
      // Get location key using IP address for more accurate location
      const locationKey = await this.getLocationKeyByIP(config.apiKey, baseUrl);
      
      // Fetch current conditions
      const currentData = await this.getCurrentConditions(locationKey, config.apiKey, baseUrl);
      
      // Fetch 15-day forecast
      const forecastData = await this.getForecast(locationKey, config.apiKey, baseUrl);
      
      return {
        location: currentData.location,
        temperature: currentData.temperature,
        condition: currentData.condition,
        description: currentData.description,
        humidity: currentData.humidity,
        windSpeed: currentData.windSpeed,
        uvIndex: currentData.uvIndex,
        forecast: forecastData,
        lastUpdated: new Date().toISOString(),
        provider: this.displayName
      };
    } catch (error) {
      console.error('AccuWeather API error:', error);
      throw error;
    }
  }

  private async getLocationKeyByIP(apiKey: string, baseUrl: string): Promise<string> {
    const response = await fetch(
      `${baseUrl}/locations/v1/cities/ipaddress?apikey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`IP location lookup failed: ${response.status}`);
    }

    const location: AccuWeatherLocationResponse = await response.json();
    
    if (!location || !location.Key) {
      throw new Error('Location not found for current IP');
    }

    return location.Key;
  }

  private async getCurrentConditions(locationKey: string, apiKey: string, baseUrl: string) {
    const response = await fetch(
      `${baseUrl}/currentconditions/v1/${locationKey}?apikey=${apiKey}&details=true`
    );

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
    const response = await fetch(
      `${baseUrl}/forecasts/v1/daily/15day/${locationKey}?apikey=${apiKey}&details=true&metric=false`
    );

    if (!response.ok) {
      throw new Error(`15-day forecast failed: ${response.status}`);
    }

    const forecast: AccuWeatherForecastResponse = await response.json();
    return this.formatForecastData(forecast);
  }

  private async getLocationName(locationKey: string, apiKey: string, baseUrl: string): Promise<string> {
    try {
      const response = await fetch(
        `${baseUrl}/locations/v1/${locationKey}?apikey=${apiKey}`
      );

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
    const condition = accuWeatherCondition.toLowerCase();
    
    if (condition.includes('sunny') || condition.includes('clear')) return 'Clear';
    if (condition.includes('cloud')) return 'Cloudy';
    if (condition.includes('rain') || condition.includes('shower')) return 'Rain';
    if (condition.includes('snow')) return 'Snow';
    if (condition.includes('storm') || condition.includes('thunder')) return 'Thunderstorm';
    if (condition.includes('fog') || condition.includes('mist')) return 'Fog';
    
    return 'Clear'; // Default fallback
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