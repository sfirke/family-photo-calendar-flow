/**
 * PWA Weather Test Service
 * 
 * Specialized testing service to validate weather functionality
 * in PWA environments, particularly iOS Safari PWA mode.
 */

import { weatherCorsProxy } from './corsProxyService';

export interface PWATestResult {
  success: boolean;
  method: 'direct' | 'proxy';
  proxyUsed?: string;
  error?: string;
  responseTime: number;
  data?: any;
}

export class PWAWeatherTestService {
  /**
   * Comprehensive test for weather API accessibility in PWA environment
   */
  static async testWeatherConnectivity(apiKey: string): Promise<{
    ipLocation: PWATestResult;
    currentConditions: PWATestResult;
    forecast: PWATestResult;
    summary: {
      allSuccessful: boolean;
      corsProxyRequired: boolean;
      recommendations: string[];
    };
  }> {
    console.log('🧪 PWA Weather Test - Starting comprehensive connectivity test');
    
    const results = {
      ipLocation: await this.testIPLocation(apiKey),
      currentConditions: { success: false, method: 'direct' as const, responseTime: 0 } as PWATestResult,
      forecast: { success: false, method: 'direct' as const, responseTime: 0 } as PWATestResult
    };

    // If IP location was successful, test current conditions
    if (results.ipLocation.success && results.ipLocation.data?.Key) {
      const locationKey = results.ipLocation.data.Key;
      results.currentConditions = await this.testCurrentConditions(locationKey, apiKey);
      results.forecast = await this.testForecast(locationKey, apiKey);
    }

    const summary = this.generateTestSummary(results);
    
    console.log('🧪 PWA Weather Test - Results:', {
      ipLocation: results.ipLocation.success,
      currentConditions: results.currentConditions.success,
      forecast: results.forecast.success,
      corsRequired: summary.corsProxyRequired
    });

    return { ...results, summary };
  }

  /**
   * Test IP-based location detection
   */
  private static async testIPLocation(apiKey: string): Promise<PWATestResult> {
    const url = `https://dataservice.accuweather.com/locations/v1/cities/ipaddress?apikey=${apiKey}`;
    return this.testEndpoint(url, 'IP Location');
  }

  /**
   * Test current weather conditions
   */
  private static async testCurrentConditions(locationKey: string, apiKey: string): Promise<PWATestResult> {
    const url = `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${apiKey}&details=true`;
    return this.testEndpoint(url, 'Current Conditions');
  }

  /**
   * Test weather forecast
   */
  private static async testForecast(locationKey: string, apiKey: string): Promise<PWATestResult> {
    const url = `https://dataservice.accuweather.com/forecasts/v1/daily/5day/${locationKey}?apikey=${apiKey}&details=true&metric=false`;
    return this.testEndpoint(url, 'Forecast');
  }

  /**
   * Test a specific endpoint with both direct and proxy methods
   */
  private static async testEndpoint(url: string, endpointName: string): Promise<PWATestResult> {
    console.log(`🧪 Testing ${endpointName}:`, url);
    
    const startTime = Date.now();
    
    try {
      // Use the CORS proxy service which tries direct first, then proxies
      const response = await weatherCorsProxy.fetchWithProxy(url);
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        const method = this.determineMethodUsed(response);
        
        console.log(`✅ ${endpointName} successful via ${method}`);
        
        return {
          success: true,
          method,
          responseTime,
          data,
          proxyUsed: method === 'proxy' ? 'CORS Proxy Service' : undefined
        };
      } else {
        return {
          success: false,
          method: 'direct',
          responseTime,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.log(`❌ ${endpointName} failed:`, error);
      
      return {
        success: false,
        method: 'direct',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Determine if response came from direct fetch or proxy
   */
  private static determineMethodUsed(response: Response): 'direct' | 'proxy' {
    // Check response headers or other indicators to determine method
    const contentType = response.headers.get('content-type');
    const server = response.headers.get('server');
    
    // If content-type suggests it went through our proxy construction
    if (response.status === 200 && (!server || server.includes('proxy'))) {
      return 'proxy';
    }
    
    return 'direct';
  }

  /**
   * Generate test summary and recommendations
   */
  private static generateTestSummary(results: any) {
    const allSuccessful = results.ipLocation.success && 
                         results.currentConditions.success && 
                         results.forecast.success;
    
    const corsProxyRequired = results.ipLocation.method === 'proxy' ||
                             results.currentConditions.method === 'proxy' ||
                             results.forecast.method === 'proxy';
    
    const recommendations: string[] = [];
    
    if (!allSuccessful) {
      recommendations.push('Some weather API endpoints are not accessible');
      
      if (!results.ipLocation.success) {
        recommendations.push('Location detection failed - manual zip code entry required');
      }
      
      if (!results.currentConditions.success || !results.forecast.success) {
        recommendations.push('Weather data retrieval issues - check API key and quota');
      }
    }
    
    if (corsProxyRequired) {
      recommendations.push('CORS proxy is being used - this is normal for PWA environments');
    }
    
    if (allSuccessful && !corsProxyRequired) {
      recommendations.push('Direct API access working - optimal performance');
    }
    
    return {
      allSuccessful,
      corsProxyRequired,
      recommendations
    };
  }

  /**
   * Quick connectivity check for UI feedback
   */
  static async quickConnectivityCheck(apiKey: string): Promise<{
    connected: boolean;
    method: 'direct' | 'proxy';
    message: string;
  }> {
    try {
      const result = await this.testIPLocation(apiKey);
      
      return {
        connected: result.success,
        method: result.method,
        message: result.success 
          ? `Connected via ${result.method === 'proxy' ? 'CORS proxy' : 'direct access'}`
          : `Connection failed: ${result.error}`
      };
    } catch (error) {
      return {
        connected: false,
        method: 'direct',
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Detect if running in PWA mode
   */
  static isPWAMode(): boolean {
    // Check if running in standalone mode (PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Check for PWA-specific navigator properties
    const isNavigatorStandalone = (window.navigator as any).standalone === true;
    
    // Check user agent for PWA indicators
    const userAgent = navigator.userAgent;
    const isPWAUserAgent = userAgent.includes('PWA') || userAgent.includes('wv');
    
    return isStandalone || isNavigatorStandalone || isPWAUserAgent;
  }

  /**
   * Get environment info for debugging
   */
  static getEnvironmentInfo() {
    return {
      isPWA: this.isPWAMode(),
      userAgent: navigator.userAgent,
      displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
      platform: navigator.platform,
      vendor: navigator.vendor,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };
  }
}