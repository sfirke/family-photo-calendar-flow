/**
 * Weather Provider Factory
 * 
 * Manages weather provider instances and provides a unified
 * interface for accessing different weather APIs.
 */

import { WeatherProvider, WeatherProviderFactory as IWeatherProviderFactory, WeatherProviderName } from './types';
import { OpenWeatherMapProvider } from './openWeatherMapProvider';
import { AccuWeatherProvider } from './accuWeatherProvider';
import { DirectAccuWeatherProvider } from './directAccuWeatherProvider';

export class WeatherProviderFactory implements IWeatherProviderFactory {
  private providers: Map<string, WeatherProvider> = new Map();

  constructor() {
    // Register all available providers
    this.registerProvider(new OpenWeatherMapProvider());
    this.registerProvider(new AccuWeatherProvider());
    this.registerProvider(new DirectAccuWeatherProvider());
  }

  private registerProvider(provider: WeatherProvider): void {
    this.providers.set(provider.name, provider);
  }

  getProvider(providerName: string): WeatherProvider {
    console.log('WeatherProviderFactory - getProvider called with:', {
      providerName,
      availableProviders: Array.from(this.providers.keys()),
      providersMap: Array.from(this.providers.entries()).map(([key, provider]) => ({
        key,
        name: provider.name,
        displayName: provider.displayName
      }))
    });
    
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      console.warn(`Weather provider '${providerName}' not found, falling back to default`);
      console.log('WeatherProviderFactory - using default provider');
      return this.getDefaultProvider();
    }
    
    console.log('WeatherProviderFactory - found provider:', {
      name: provider.name,
      displayName: provider.displayName
    });
    return provider;
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getDefaultProvider(): WeatherProvider {
    // Direct AccuWeather as primary choice (no Supabase dependency), fallback to regular AccuWeather
    return this.providers.get('accuweather-direct') || this.providers.get('accuweather') || this.providers.get('openweathermap')!;
  }

  /**
   * Get provider with fallback chain
   * Tries providers in order of preference based on forecast requirements
   */
  getProviderWithFallback(preferredProvider?: string, requiredForecastDays?: number): WeatherProvider {
    console.log('WeatherProviderFactory - getProviderWithFallback called with:', {
      preferredProvider,
      requiredForecastDays,
      availableProviders: Array.from(this.providers.keys())
    });
    
    // If specific provider requested, try it first
    if (preferredProvider) {
      const provider = this.providers.get(preferredProvider);
      console.log('WeatherProviderFactory - checking preferred provider:', {
        preferredProvider,
        found: !!provider,
        providerName: provider?.name,
        displayName: provider?.displayName,
        maxForecastDays: provider?.maxForecastDays,
        meetsRequirement: !requiredForecastDays || (provider?.maxForecastDays || 0) >= requiredForecastDays
      });
      
      if (provider && (!requiredForecastDays || provider.maxForecastDays >= requiredForecastDays)) {
        console.log('WeatherProviderFactory - using preferred provider:', provider.displayName);
        return provider;
      }
    }

    // Find best provider based on forecast requirements
    if (requiredForecastDays) {
      const suitableProviders = Array.from(this.providers.values())
        .filter(p => p.maxForecastDays >= requiredForecastDays)
        .sort((a, b) => b.maxForecastDays - a.maxForecastDays); // Sort by capability descending
      
      if (suitableProviders.length > 0) {
        return suitableProviders[0];
      }
    }

    // Fallback to default
    return this.getDefaultProvider();
  }

  /**
   * Get providers that support specific forecast range
   */
  getProvidersForForecastRange(days: number): WeatherProvider[] {
    return Array.from(this.providers.values())
      .filter(provider => provider.maxForecastDays >= days)
      .sort((a, b) => b.maxForecastDays - a.maxForecastDays);
  }
}

// Export singleton instance
export const weatherProviderFactory = new WeatherProviderFactory();