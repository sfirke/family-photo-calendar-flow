/**
 * Weather CORS Proxy Service
 * 
 * Provides CORS proxy functionality specifically for weather API calls.
 * This service handles the CORS restrictions that occur when the app
 * is installed as a PWA on iOS devices.
 */

export interface WeatherProxyConfig {
  url: string;
  requiresJsonResponse: boolean;
  responseProperty?: string;
  supportsParams?: boolean;
}

// Weather-specific CORS proxies optimized for API calls
export const WEATHER_CORS_PROXIES: WeatherProxyConfig[] = [
  { 
    url: 'https://api.allorigins.win/get?url=', 
    requiresJsonResponse: true, 
    responseProperty: 'contents',
    supportsParams: true
  },
  { 
    url: 'https://api.codetabs.com/v1/proxy?quest=', 
    requiresJsonResponse: false,
    supportsParams: true
  },
  { 
    url: 'https://cors-anywhere.herokuapp.com/', 
    requiresJsonResponse: false,
    supportsParams: true
  },
  { 
    url: 'https://thingproxy.freeboard.io/fetch/', 
    requiresJsonResponse: false,
    supportsParams: true
  }
];

export class WeatherCorsProxyService {
  private static instance: WeatherCorsProxyService;
  private proxyIndex = 0;

  static getInstance(): WeatherCorsProxyService {
    if (!WeatherCorsProxyService.instance) {
      WeatherCorsProxyService.instance = new WeatherCorsProxyService();
    }
    return WeatherCorsProxyService.instance;
  }

  /**
   * Attempt to fetch weather data with CORS proxy fallback
   */
  async fetchWithProxy(url: string): Promise<Response> {
    // First try direct fetch (works in browser and development)
    try {
      console.log('WeatherCorsProxy - Trying direct fetch:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors'
      });

      if (response.ok) {
        console.log('WeatherCorsProxy - Direct fetch successful');
        return response;
      }
    } catch (error) {
      console.log('WeatherCorsProxy - Direct fetch failed, trying proxies:', error);
    }

    // If direct fetch fails, try proxy services
    return this.tryProxyServices(url);
  }

  /**
   * Try proxy services sequentially
   */
  private async tryProxyServices(targetUrl: string): Promise<Response> {
    let lastError: Error | null = null;

    for (let i = 0; i < WEATHER_CORS_PROXIES.length; i++) {
      const proxyConfig = WEATHER_CORS_PROXIES[i];
      
      try {
        console.log(`WeatherCorsProxy - Trying proxy ${i + 1}/${WEATHER_CORS_PROXIES.length}:`, proxyConfig.url);
        
        const proxyUrl = this.buildProxyUrl(proxyConfig, targetUrl);
        console.log('WeatherCorsProxy - Proxy URL:', proxyUrl);

        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: this.getProxyHeaders(proxyConfig),
          mode: 'cors'
        });

        if (!response.ok) {
          console.log(`WeatherCorsProxy - Proxy ${i + 1} failed with status:`, response.status);
          continue;
        }

        // Extract content based on proxy type
        const content = await this.extractResponseContent(response, proxyConfig);
        
        // Validate that we got valid JSON content
        if (this.isValidWeatherResponse(content)) {
          console.log(`WeatherCorsProxy - Proxy ${i + 1} successful`);
          
          // Create a Response object from the extracted content
          return new Response(content, {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          console.log(`WeatherCorsProxy - Proxy ${i + 1} returned invalid weather data`);
          continue;
        }

      } catch (error) {
        console.log(`WeatherCorsProxy - Proxy ${i + 1} failed:`, error);
        lastError = error as Error;
        continue;
      }
    }

    // All proxies failed
    throw new Error(`All CORS proxies failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  private buildProxyUrl(proxyConfig: WeatherProxyConfig, targetUrl: string): string {
    if (proxyConfig.url.includes('allorigins.win') || proxyConfig.url.includes('codetabs.com')) {
      return proxyConfig.url + encodeURIComponent(targetUrl);
    }
    return proxyConfig.url + targetUrl;
  }

  private getProxyHeaders(proxyConfig: WeatherProxyConfig): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (proxyConfig.requiresJsonResponse) {
      headers['Accept'] = 'application/json';
    } else {
      headers['Accept'] = 'application/json, text/html, */*';
    }

    return headers;
  }

  private async extractResponseContent(response: Response, proxyConfig: WeatherProxyConfig): Promise<string> {
    if (proxyConfig.requiresJsonResponse && proxyConfig.responseProperty) {
      const data = await response.json();
      return data[proxyConfig.responseProperty] || '';
    }
    return await response.text();
  }

  private isValidWeatherResponse(content: string): boolean {
    if (!content || content.trim().length === 0) {
      return false;
    }

    // Check if it's valid JSON
    try {
      const parsed = JSON.parse(content);
      
      // Check for common weather API response patterns
      if (Array.isArray(parsed) || 
          parsed.Key || 
          parsed.LocalizedName || 
          parsed.Temperature || 
          parsed.DailyForecasts ||
          parsed.WeatherText) {
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Reset proxy rotation (useful for testing)
   */
  resetProxyRotation(): void {
    this.proxyIndex = 0;
  }
}

// Export singleton instance
export const weatherCorsProxy = WeatherCorsProxyService.getInstance();