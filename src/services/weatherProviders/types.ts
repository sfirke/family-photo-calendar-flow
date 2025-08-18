/**
 * Weather Provider Types
 * 
 * Defines interfaces and types for the weather provider system,
 * supporting multiple weather APIs with extended forecast capabilities.
 */

export interface WeatherForecastDay {
  date: string;
  temp?: number;
  high?: number;
  low?: number;
  condition: string;
  description?: string;
  humidity?: number;
  windSpeed?: number;
  uvIndex?: number;
}

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  description?: string;
  humidity?: number;
  windSpeed?: number;
  uvIndex?: number;
  forecast: WeatherForecastDay[];
  lastUpdated: string;
  provider: string;
}

export interface WeatherProviderConfig {
  apiKey: string;
  baseUrl: string;
  rateLimit: number; // requests per minute
  maxForecastDays: number;
}

export interface WeatherProvider {
  name: string;
  displayName: string;
  maxForecastDays: number;
  requiresApiKey: boolean;
  
  /**
   * Fetch current weather and forecast data
   */
  fetchWeather(zipCode: string, config: WeatherProviderConfig): Promise<WeatherData>;
  
  /**
   * Validate API key format (basic validation)
   */
  validateApiKey(apiKey: string): boolean;
  
  /**
   * Get provider-specific configuration requirements
   */
  getConfigRequirements(): {
    apiKeyUrl?: string;
    documentation?: string;
    pricingUrl?: string;
  };
}

export type WeatherProviderName = 'nws';