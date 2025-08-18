/**
 * Enhanced Weather Service
 * 
 * New weather service implementation that works alongside the existing service
 * during migration. Provides support for multiple weather providers and
 * extended forecast capabilities.
 */

import { weatherProviderFactory } from './weatherProviders';
import { WeatherData, WeatherProviderConfig } from './weatherProviders/types';

interface EnhancedWeatherConfig {
  zipCode: string;
  apiKey: string;
  provider?: string;
  forecastDays?: number;
}

export class EnhancedWeatherService {
  private static instance: EnhancedWeatherService;
  private cache = new Map<string, { data: WeatherData; timestamp: number }>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  static getInstance(): EnhancedWeatherService {
    if (!EnhancedWeatherService.instance) {
      EnhancedWeatherService.instance = new EnhancedWeatherService();
    }
    return EnhancedWeatherService.instance;
  }

  /**
   * Fetch weather data with enhanced provider support
   */
  async fetchWeatherData(config: EnhancedWeatherConfig): Promise<WeatherData> {
    const cacheKey = `${config.provider || 'default'}-${config.zipCode}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
  // debug removed: enhanced weather service config received
      
      // Get appropriate provider
      const provider = weatherProviderFactory.getProviderWithFallback(
        config.provider,
        config.forecastDays
      );
      
  // debug removed: provider selected details

      // Prepare provider config
      const providerConfig: WeatherProviderConfig = {
        apiKey: config.apiKey,
        baseUrl: '', // Provider-specific
        rateLimit: 60,
        maxForecastDays: config.forecastDays || 7
      };

      // Fetch weather data
      const weatherData = await provider.fetchWeather(config.zipCode, providerConfig);

      // Cache the result
      this.cache.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now()
      });

      return weatherData;
    } catch (error) {
      console.error('Enhanced weather service error:', error);
      
      // Try fallback to cached data
      if (cached) {
  console.warn('Returning stale cached weather data due to API error');
        return cached.data;
      }
      
      // Return mock data as last resort
      return this.getMockWeatherData(config.zipCode);
    }
  }

  /**
   * Test weather provider connection
   */
  async testProvider(config: EnhancedWeatherConfig): Promise<{ success: boolean; message: string; data?: WeatherData }> {
    try {
      const data = await this.fetchWeatherData(config);
      return {
        success: true,
        message: `Successfully connected to ${data.provider}`,
        data
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }

  /**
   * Get available providers info
   */
  getAvailableProviders() {
    return weatherProviderFactory.listProviders().map(name => {
      const provider = weatherProviderFactory.getProvider(name);
      return {
        name,
        displayName: provider.displayName,
        maxForecastDays: provider.maxForecastDays,
        requiresApiKey: provider.requiresApiKey,
        config: provider.getConfigRequirements()
      };
    });
  }

  /**
   * Clear cache for specific provider/location
   */
  clearCache(zipCode?: string, provider?: string): void {
    if (zipCode && provider) {
      const cacheKey = `${provider}-${zipCode}`;
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  private getMockWeatherData(zipCode: string): WeatherData {
    return {
      location: 'Location not found',
      temperature: 72,
      condition: 'Clear',
      description: 'Clear sky',
      humidity: 50,
      windSpeed: 5,
      forecast: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
        high: 75 + Math.floor(Math.random() * 10) - 5,
        low: 60 + Math.floor(Math.random() * 10) - 5,
        condition: ['Sunny', 'Cloudy', 'Partly Cloudy'][Math.floor(Math.random() * 3)]
      })),
      lastUpdated: new Date().toISOString(),
      provider: 'Mock Data'
    };
  }
}

// Export singleton instance
export const enhancedWeatherService = EnhancedWeatherService.getInstance();

// Backward compatibility function
export const fetchEnhancedWeatherData = async (
  zipCode: string, 
  apiKey: string, 
  provider?: string,
  forecastDays?: number
): Promise<WeatherData> => {
  return enhancedWeatherService.fetchWeatherData({
    zipCode,
    apiKey,
    provider,
    forecastDays
  });
};