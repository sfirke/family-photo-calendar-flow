/**
 * National Weather Service Provider
 * 
 * Implements National Weather Service API integration for weather data.
 * Uses the free NWS API at api.weather.gov with no API key required.
 */

import { WeatherProvider, WeatherData, WeatherProviderConfig } from './types';
import { mapNWSCondition } from '@/utils/weatherIcons';
import { weatherStorageService } from '@/services/weatherStorageService';

export class NWSProvider implements WeatherProvider {
  name = 'nws';
  displayName = 'National Weather Service';
  maxForecastDays = 7;
  requiresApiKey = false;

  async fetchWeather(coordinates: string, config: WeatherProviderConfig): Promise<WeatherData> {
  // debug removed: fetchWeather invocation details
    
    if (!coordinates) {
      throw new Error('Coordinates are required for National Weather Service API');
    }

    const [lat, lon] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
    
    if (isNaN(lat) || isNaN(lon)) {
      throw new Error('Invalid coordinates format. Expected "latitude,longitude"');
    }

    try {
      // Step 1: Get grid point data for the coordinates
  const pointsUrl = `https://api.weather.gov/points/${lat},${lon}`;
      
      const pointsResponse = await fetch(pointsUrl);
      if (!pointsResponse.ok) {
        throw new Error(`Failed to get grid points: ${pointsResponse.status} ${pointsResponse.statusText}`);
      }
      
  const pointsData = await pointsResponse.json();

      // Step 2: Get current conditions and forecast URLs
      const forecastUrl = pointsData.properties.forecast;
      const observationStationsUrl = pointsData.properties.observationStations;
      const gridId = pointsData.properties.gridId;
      const gridX = pointsData.properties.gridX;
      const gridY = pointsData.properties.gridY;

      // Step 3: Get forecast data
  // debug removed: fetching forecast
      const forecastResponse = await fetch(forecastUrl);
      if (!forecastResponse.ok) {
        throw new Error(`Failed to get forecast: ${forecastResponse.status} ${forecastResponse.statusText}`);
      }
      
  const forecastData = await forecastResponse.json();

      // Step 4: Get current observations
      let currentData = null;
      let stationsData = null;
      try {
  // debug removed: fetching observation stations
        const stationsResponse = await fetch(observationStationsUrl);
        if (stationsResponse.ok) {
          stationsData = await stationsResponse.json();
          const stations = stationsData.features;
          
          if (stations && stations.length > 0) {
            // Try the first few stations to get current observations
            for (let i = 0; i < Math.min(3, stations.length); i++) {
              try {
                const stationId = stations[i].properties.stationIdentifier;
                const observationsUrl = `https://api.weather.gov/stations/${stationId}/observations/latest`;
                
                const observationResponse = await fetch(observationsUrl);
                if (observationResponse.ok) {
                  currentData = await observationResponse.json();
                  break; // Success, stop trying other stations
                }
              } catch (error) {
                console.warn('NWSProvider - Failed to get observations from station:', stations[i].properties.stationIdentifier, error);
                continue; // Try next station
              }
            }
          }
        }
      } catch (error) {
        console.warn('NWSProvider - Failed to get current observations:', error);
      }

      // Store raw data in tiered storage
      const rawData = {
        points: pointsData,
        forecast: forecastData,
        current: currentData,
        stations: stationsData,
        lastUpdated: new Date().toISOString()
      };
      await this.storeWeatherDataInTieredStorage(rawData, coordinates);

      // Transform data to our WeatherData format
      const weatherData: WeatherData = {
        location: this.extractLocationName(pointsData, currentData, stationsData),
        temperature: this.extractTemperature(currentData, forecastData),
        condition: this.extractCondition(currentData, forecastData),
        description: this.extractDescription(currentData, forecastData),
        humidity: this.extractHumidity(currentData),
        windSpeed: this.extractWindSpeed(currentData),
        uvIndex: this.extractUVIndex(currentData),
        forecast: this.extractForecast(forecastData),
        lastUpdated: new Date().toISOString(),
        provider: this.displayName
      };

  // debug removed: transformed weather data summary

      return weatherData;

    } catch (error) {
      console.error('NWSProvider - API error, checking tiered storage:', error);
      
      // Try to use tiered storage data when API fails
      const cachedRawData = await weatherStorageService.getRawNWSData();
      if (cachedRawData && cachedRawData.points) {
  // debug removed: using tiered storage fallback
        const weatherData: WeatherData = {
          location: this.extractLocationName(cachedRawData.points, cachedRawData.current, cachedRawData.stations),
          temperature: this.extractTemperature(cachedRawData.current, cachedRawData.forecast),
          condition: this.extractCondition(cachedRawData.current, cachedRawData.forecast),
          description: this.extractDescription(cachedRawData.current, cachedRawData.forecast),
          humidity: this.extractHumidity(cachedRawData.current),
          windSpeed: this.extractWindSpeed(cachedRawData.current),
          uvIndex: this.extractUVIndex(cachedRawData.current),
          forecast: this.extractForecast(cachedRawData.forecast),
          lastUpdated: cachedRawData.lastUpdated || new Date().toISOString(),
          provider: `${this.displayName} (Cached)`
        };
        return weatherData;
      }
      
      throw error;
    }
  }

  private async storeWeatherDataInTieredStorage(data: any, coordinates: string): Promise<void> {
    try {
      // Store raw data
      await weatherStorageService.saveRawNWSData(data);
      
      // Transform and store current weather data
      const transformedWeatherData: WeatherData = {
        location: this.extractLocationName(data.points, data.current, data.stations),
        temperature: this.extractTemperature(data.current, data.forecast),
        condition: this.extractCondition(data.current, data.forecast),
        description: this.extractDescription(data.current, data.forecast),
        humidity: this.extractHumidity(data.current),
        windSpeed: this.extractWindSpeed(data.current),
        uvIndex: this.extractUVIndex(data.current),
        forecast: this.extractForecast(data.forecast),
        lastUpdated: data.lastUpdated || new Date().toISOString(),
        provider: this.displayName
      };
      await weatherStorageService.saveCurrentWeather(transformedWeatherData);
      
      // Store forecast data
      if (data.forecast?.properties?.periods && Array.isArray(data.forecast.properties.periods)) {
        const forecasts = this.groupForecastsByDay(data.forecast.properties.periods);
        await weatherStorageService.saveForecastData(forecasts);
      }
      
  // debug removed: weather data stored in tiered storage
    } catch (error) {
      console.warn('NWSProvider - Failed to store weather data in tiered storage:', error);
    }
  }

  private groupForecastsByDay(periods: any[]): any[] {
    const dailyForecasts = new Map();
    
    periods.forEach(period => {
      const date = new Date(period.startTime).toISOString().split('T')[0];
      
      if (!dailyForecasts.has(date)) {
        dailyForecasts.set(date, {
          date,
          high: null,
          low: null,
          condition: this.mapCondition(period.shortForecast),
          description: period.detailedForecast
        });
      }
      
      const dailyForecast = dailyForecasts.get(date);
      
      // Determine if this is a day or night period
      if (period.isDaytime) {
        dailyForecast.high = period.temperature;
        if (!dailyForecast.condition) {
          dailyForecast.condition = this.mapCondition(period.shortForecast);
        }
      } else {
        dailyForecast.low = period.temperature;
      }
    });
    
    return Array.from(dailyForecasts.values()).slice(0, this.maxForecastDays);
  }

  private extractLocationName(pointsData: any, currentData?: any, stationsData?: any): string {
    // Use station name from stations API if available
    if (stationsData?.features?.[0]?.properties?.name) {
      return stationsData.features[0].properties.name;
    }
    
    if (currentData?.properties?.name) {
      return currentData.properties.name.split(',')[0];
    }
    
    if (currentData?.properties?.station) {
      return currentData.properties.station;
    }
    
    if (pointsData?.properties?.relativeLocation?.properties) {
      const location = pointsData.properties.relativeLocation.properties;
      // Use name property and truncate at comma if it exists
      if (location.name) {
        return location.name.split(',')[0];
      }
      return `${location.city}, ${location.state}`;
    }
    
    return 'Current Location';
  }

  private extractTemperature(currentData: any, forecastData?: any): number {
    if (currentData?.properties?.temperature?.value !== null) {
      // Convert Celsius to Fahrenheit
      const celsius = currentData.properties.temperature.value;
      return Math.round((celsius * 9/5) + 32);
    }
    
    // Fallback to first forecast period if no current temp
    if (forecastData?.properties?.periods?.[0]?.temperature) {
      return forecastData.properties.periods[0].temperature;
    }
    
    return 72; // Default fallback
  }

  private extractCondition(currentData: any, forecastData?: any): string {
    if (currentData?.properties?.textDescription) {
      return this.mapCondition(currentData.properties.textDescription);
    }
    
    if (forecastData?.properties?.periods?.[0]?.shortForecast) {
      return this.mapCondition(forecastData.properties.periods[0].shortForecast);
    }
    
    return 'Clear';
  }

  private extractDescription(currentData: any, forecastData?: any): string {
    if (currentData?.properties?.textDescription) {
      return currentData.properties.textDescription;
    }
    
    if (forecastData?.properties?.periods?.[0]?.detailedForecast) {
      return forecastData.properties.periods[0].detailedForecast;
    }
    
    return 'Weather conditions unavailable';
  }

  private extractHumidity(currentData: any): number {
    if (currentData?.properties?.relativeHumidity?.value !== null) {
      return Math.round(currentData.properties.relativeHumidity.value);
    }
    return 50; // Default fallback
  }

  private extractWindSpeed(currentData: any): number {
    if (currentData?.properties?.windSpeed?.value !== null) {
      // Convert m/s to mph
      const mps = currentData.properties.windSpeed.value;
      return Math.round(mps * 2.237);
    }
    return 5; // Default fallback
  }

  private extractUVIndex(currentData: any): number {
    // NWS doesn't typically provide UV index in current observations
    return 3; // Default fallback
  }

  private extractForecast(forecastData: any): Array<{
    date: string;
    high: number;
    low: number;
    condition: string;
    description: string;
  }> {
    if (forecastData?.properties?.periods && Array.isArray(forecastData.properties.periods)) {
      return this.groupForecastsByDay(forecastData.properties.periods);
    }

    return this.getMinimalForecast();
  }

  private getMinimalForecast() {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
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

  private mapCondition(nwsCondition: string): string {
    return mapNWSCondition(nwsCondition);
  }

  validateApiKey(apiKey: string): boolean {
    // NWS API doesn't require an API key
    return true;
  }

  getConfigRequirements() {
    return {
      documentation: 'https://www.weather.gov/documentation/services-web-api',
      pricingUrl: 'https://www.weather.gov/documentation/services-web-api'
    };
  }
}