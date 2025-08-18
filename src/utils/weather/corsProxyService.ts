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
  region?: 'global' | 'us' | 'eu' | 'asia';
  reliability?: 'high' | 'medium' | 'low';
  timeout?: number;
  headers?: Record<string, string>;
}

interface ProxyStats {
  successCount: number;
  failureCount: number;
  lastUsed: number;
  avgResponseTime: number;
  isBlacklisted: boolean;
  blacklistUntil?: number;
}

// Enhanced weather-specific CORS proxies with geographic distribution
export const WEATHER_CORS_PROXIES: WeatherProxyConfig[] = [
  // High reliability proxies
  { 
    url: 'https://api.allorigins.win/get?url=', 
    requiresJsonResponse: true, 
    responseProperty: 'contents',
    supportsParams: true,
    region: 'global',
    reliability: 'high',
    timeout: 12000
  },
  { 
    url: 'https://proxy.cors.sh/', 
    requiresJsonResponse: false,
    supportsParams: true,
    region: 'global',
    reliability: 'high',
    timeout: 10000
  },
  { 
    url: 'https://api.codetabs.com/v1/proxy?quest=', 
    requiresJsonResponse: false,
    supportsParams: true,
    region: 'global',
    reliability: 'medium',
    timeout: 15000
  },
  // Alternative high-performance proxies
  { 
    url: 'https://corsproxy.io/?', 
    requiresJsonResponse: false,
    supportsParams: true,
    region: 'us',
    reliability: 'high',
    timeout: 8000
  },
  { 
    url: 'https://cors-proxy.fringe.zone/get?url=', 
    requiresJsonResponse: true,
    responseProperty: 'data',
    supportsParams: true,
    region: 'us',
    reliability: 'medium',
    timeout: 12000
  },
  // European proxies for better geographic distribution
  { 
    url: 'https://cors.eu.org/', 
    requiresJsonResponse: false,
    supportsParams: true,
    region: 'eu',
    reliability: 'medium',
    timeout: 10000
  },
  // Fallback proxies (lower reliability but still useful)
  { 
    url: 'https://thingproxy.freeboard.io/fetch/', 
    requiresJsonResponse: false,
    supportsParams: true,
    region: 'global',
    reliability: 'low',
    timeout: 20000
  },
  { 
    url: 'https://cors-anywhere.herokuapp.com/', 
    requiresJsonResponse: false,
    supportsParams: true,
    region: 'us',
    reliability: 'low',
    timeout: 25000
  }
];

export class WeatherCorsProxyService {
  private static instance: WeatherCorsProxyService;
  private proxyStats: Map<string, ProxyStats> = new Map();
  private lastSuccessfulProxy?: WeatherProxyConfig;
  private maxRetries = 3;
  private retryDelayMs = 1000;

  static getInstance(): WeatherCorsProxyService {
    if (!WeatherCorsProxyService.instance) {
      WeatherCorsProxyService.instance = new WeatherCorsProxyService();
    }
    return WeatherCorsProxyService.instance;
  }

  constructor() {
    // Initialize stats for all proxies
    WEATHER_CORS_PROXIES.forEach(proxy => {
      this.proxyStats.set(proxy.url, {
        successCount: 0,
        failureCount: 0,
        lastUsed: 0,
        avgResponseTime: 0,
        isBlacklisted: false
      });
    });
  }

  /**
   * Attempt to fetch weather data with enhanced CORS proxy fallback
   */
  async fetchWithProxy(url: string): Promise<Response> {
  // debug removed: starting enhanced fetch
    
    // First try direct fetch (works in browser and development)
    try {
  // debug removed: trying direct fetch
      const startTime = Date.now();
      const response = await Promise.race([
        fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Weather-App/1.0'
          },
          mode: 'cors'
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Direct fetch timeout')), 8000)
        )
      ]) as Response;

      if (response.ok) {
        const text = await response.text();
        if (text === 'Offline' || text.includes('offline')) {
          // debug removed: direct fetch returned offline indicator
          throw new Error('Direct fetch returned offline response');
        }
  // debug removed: direct fetch success timing
        return new Response(text, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      }
    } catch (error) {
      // debug removed: direct fetch failed
    }

    // Use smart proxy selection with retry logic
    return this.trySmartProxySelection(url);
  }

  /**
   * Smart proxy selection with success rate tracking and retry logic
   */
  private async trySmartProxySelection(targetUrl: string): Promise<Response> {
    // Clean blacklisted proxies
    this.cleanBlacklist();
    
    // Get available proxies sorted by performance
    const sortedProxies = this.getSortedProxies();
    
  // debug removed: proxy trial count
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      if (attempt > 0) {
  // debug removed: retry attempt
        await this.delay(this.retryDelayMs * Math.pow(2, attempt)); // Exponential backoff
      }
      
      for (const proxy of sortedProxies) {
        const stats = this.proxyStats.get(proxy.url);
        if (!stats || stats.isBlacklisted) continue;
        
        try {
          const result = await this.tryProxy(proxy, targetUrl);
          if (result) {
            this.recordSuccess(proxy.url, Date.now() - performance.now());
            this.lastSuccessfulProxy = proxy;
            // debug removed: proxy success
            return result;
          }
        } catch (error) {
          // debug removed: proxy failure
          this.recordFailure(proxy.url);
          lastError = error as Error;
          
          // Blacklist if too many failures
          if (stats && stats.failureCount >= 3) {
            this.blacklistProxy(proxy.url);
          }
        }
      }
    }
    
    throw new Error(`All enhanced CORS proxies failed after ${this.maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  private async tryProxy(proxy: WeatherProxyConfig, targetUrl: string): Promise<Response | null> {
    const startTime = Date.now();
    const timeout = proxy.timeout || 15000;
    
  // debug removed: attempting proxy fetch
    
    const proxyUrl = this.buildProxyUrl(proxy, targetUrl);
    const headers = this.getProxyHeaders(proxy);
    
    const response = await Promise.race([
      fetch(proxyUrl, {
        method: 'GET',
        headers,
        mode: 'cors'
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Proxy timeout')), timeout)
      )
    ]) as Response;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const content = await this.extractResponseContent(response, proxy);
    
    if (content === 'Offline' || content.includes('offline')) {
      throw new Error('Proxy returned offline response');
    }
    
    if (!this.isValidWeatherResponse(content)) {
      throw new Error('Invalid weather response format');
    }
    
    const responseTime = Date.now() - startTime;
  // debug removed: proxy response time
    
    return new Response(content, {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private getSortedProxies(): WeatherProxyConfig[] {
    const now = Date.now();
    
    return [...WEATHER_CORS_PROXIES].sort((a, b) => {
      const statsA = this.proxyStats.get(a.url);
      const statsB = this.proxyStats.get(b.url);
      
      // Prioritize last successful proxy
      if (this.lastSuccessfulProxy?.url === a.url) return -1;
      if (this.lastSuccessfulProxy?.url === b.url) return 1;
      
      // Filter out blacklisted
      if (statsA?.isBlacklisted) return 1;
      if (statsB?.isBlacklisted) return -1;
      
      // Prioritize by reliability tier
      const reliabilityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
      const reliabilityDiff = (reliabilityOrder[a.reliability || 'medium']) - (reliabilityOrder[b.reliability || 'medium']);
      if (reliabilityDiff !== 0) return reliabilityDiff;
      
      // Then by success rate
      const successRateA = this.getSuccessRate(statsA);
      const successRateB = this.getSuccessRate(statsB);
      if (successRateA !== successRateB) return successRateB - successRateA;
      
      // Finally by recent usage (prefer fresh proxies)
      const recencyA = now - (statsA?.lastUsed || 0);
      const recencyB = now - (statsB?.lastUsed || 0);
      return recencyB - recencyA;
    });
  }

  private getSuccessRate(stats?: ProxyStats): number {
    if (!stats || (stats.successCount + stats.failureCount) === 0) return 0.5; // Neutral for untested
    return stats.successCount / (stats.successCount + stats.failureCount);
  }

  private recordSuccess(proxyUrl: string, responseTime: number): void {
    const stats = this.proxyStats.get(proxyUrl);
    if (stats) {
      stats.successCount++;
      stats.lastUsed = Date.now();
      stats.avgResponseTime = (stats.avgResponseTime + responseTime) / 2;
      stats.isBlacklisted = false;
      stats.blacklistUntil = undefined;
    }
  }

  private recordFailure(proxyUrl: string): void {
    const stats = this.proxyStats.get(proxyUrl);
    if (stats) {
      stats.failureCount++;
      stats.lastUsed = Date.now();
    }
  }

  private blacklistProxy(proxyUrl: string): void {
    const stats = this.proxyStats.get(proxyUrl);
    if (stats) {
      stats.isBlacklisted = true;
      stats.blacklistUntil = Date.now() + (5 * 60 * 1000); // 5 minutes
  // debug removed: proxy blacklisted
    }
  }

  private cleanBlacklist(): void {
    const now = Date.now();
    for (const [url, stats] of this.proxyStats.entries()) {
      if (stats.isBlacklisted && stats.blacklistUntil && now > stats.blacklistUntil) {
        stats.isBlacklisted = false;
        stats.blacklistUntil = undefined;
  // debug removed: removed from blacklist
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
   * Reset proxy statistics (useful for testing)
   */
  resetProxyStats(): void {
    this.proxyStats.clear();
    this.lastSuccessfulProxy = undefined;
    WEATHER_CORS_PROXIES.forEach(proxy => {
      this.proxyStats.set(proxy.url, {
        successCount: 0,
        failureCount: 0,
        lastUsed: 0,
        avgResponseTime: 0,
        isBlacklisted: false
      });
    });
  // debug removed: reset proxy statistics
  }

  /**
   * Get proxy performance statistics
   */
  getProxyStats(): Map<string, ProxyStats> {
    return new Map(this.proxyStats);
  }

  /**
   * Force retry a blacklisted proxy
   */
  clearBlacklist(proxyUrl?: string): void {
    if (proxyUrl) {
      const stats = this.proxyStats.get(proxyUrl);
      if (stats) {
        stats.isBlacklisted = false;
        stats.blacklistUntil = undefined;
  // debug removed: cleared single proxy blacklist
      }
    } else {
      for (const stats of this.proxyStats.values()) {
        stats.isBlacklisted = false;
        stats.blacklistUntil = undefined;
      }
  // debug removed: cleared all proxy blacklists
    }
  }
}

// Export singleton instance
export const weatherCorsProxy = WeatherCorsProxyService.getInstance();