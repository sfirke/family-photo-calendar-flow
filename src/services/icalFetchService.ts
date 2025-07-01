
// Enhanced CORS proxy options with timeout and error handling
const CORS_PROXIES = [
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://cors-anywhere.herokuapp.com/${url}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
  (url: string) => `https://cors.bridged.cc/${url}`,
];

// Timeout for fetch requests
const FETCH_TIMEOUT = 15000; // 15 seconds

export class ICalFetchService {
  static async fetchICalData(url: string): Promise<string> {
    console.log('Attempting to fetch iCal from:', url);
    
    // Enhanced URL validation
    if (!this.isValidICalUrl(url)) {
      throw new Error('Invalid iCal URL format. Please provide a valid .ics or Google Calendar URL.');
    }
    
    // Try direct fetch first
    try {
      const data = await this.fetchWithTimeout(url, {
        mode: 'cors',
        headers: {
          'Accept': 'text/calendar, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (compatible; FamilyCalendarApp/1.0)',
        }
      });
      
      if (this.isValidICalData(data)) {
        console.log('Direct fetch successful, data length:', data.length);
        return data;
      } else {
        console.log('Direct fetch returned invalid data:', data.substring(0, 100));
      }
    } catch (error) {
      console.log('Direct fetch failed, trying proxies:', error);
    }

    // Try proxies with enhanced error handling
    let lastError: Error | null = null;
    
    for (let i = 0; i < CORS_PROXIES.length; i++) {
      try {
        const proxyUrl = CORS_PROXIES[i](url);
        console.log(`Trying proxy ${i + 1}/${CORS_PROXIES.length}:`, proxyUrl);
        
        const data = await this.fetchWithTimeout(proxyUrl, {
          headers: {
            'Accept': 'text/calendar, text/plain, */*',
          }
        });

        if (this.isValidICalData(data)) {
          console.log(`Proxy ${i + 1} successful, data length:`, data.length);
          return data;
        } else {
          console.log(`Proxy ${i + 1} returned invalid data:`, data.substring(0, 100));
          lastError = new Error(`Proxy ${i + 1} returned invalid calendar data`);
        }
      } catch (error) {
        console.log(`Proxy ${i + 1} failed:`, error);
        lastError = error instanceof Error ? error : new Error(`Proxy ${i + 1} failed`);
      }
    }

    // Provide specific error message based on the last error
    const errorMessage = this.getSpecificErrorMessage(lastError);
    throw new Error(errorMessage);
  }

  private static async fetchWithTimeout(url: string, options: RequestInit): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.text();
      
      // Check for common error responses
      if (this.isErrorResponse(data)) {
        throw new Error(`Server returned error: ${data.substring(0, 100)}`);
      }
      
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. The calendar server may be slow or unavailable.');
      }
      throw error;
    }
  }

  private static isValidICalUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Check for common iCal URL patterns
      const validPatterns = [
        /\.ics$/i,
        /ical/i,
        /calendar/i,
        /webcal:/i,
        /calendar\.google\.com/i,
        /outlook\.live\.com/i,
        /outlook\.office365\.com/i
      ];
      
      return validPatterns.some(pattern => pattern.test(url));
    } catch {
      return false;
    }
  }

  private static isValidICalData(data: string): boolean {
    if (!data || typeof data !== 'string' || data.length < 50) {
      return false;
    }

    const lowerData = data.toLowerCase().trim();
    
    // Check for error indicators
    const errorIndicators = [
      'offline', 'error', 'not found', '404', '500', '503',
      'access denied', 'forbidden', 'unauthorized', 'timeout',
      'maintenance', 'unavailable', 'invalid request'
    ];
    
    if (errorIndicators.some(indicator => lowerData.includes(indicator))) {
      console.log('Data appears to be an error message:', data.substring(0, 100));
      return false;
    }

    // Must contain basic iCal structure
    const hasVCalendar = lowerData.includes('begin:vcalendar');
    const hasEndVCalendar = lowerData.includes('end:vcalendar');
    
    if (!hasVCalendar || !hasEndVCalendar) {
      console.log('Data does not contain valid iCal structure');
      return false;
    }

    return true;
  }

  private static isErrorResponse(data: string): boolean {
    const lowerData = data.toLowerCase().trim();
    
    // Check for common error responses
    const errorResponses = [
      'offline',
      'error',
      'not found',
      'access denied',
      'forbidden',
      'unauthorized',
      'bad request',
      'internal server error',
      'service unavailable',
      'gateway timeout'
    ];
    
    return errorResponses.some(error => lowerData === error || lowerData.startsWith(error));
  }

  private static getSpecificErrorMessage(lastError: Error | null): string {
    if (lastError?.message.includes('timeout')) {
      return 'Calendar sync timed out. The server may be slow or temporarily unavailable. Please try again later.';
    }
    
    if (lastError?.message.includes('403') || lastError?.message.includes('forbidden')) {
      return 'Access denied to calendar. Please check that the calendar URL is publicly accessible or verify sharing permissions.';
    }
    
    if (lastError?.message.includes('404') || lastError?.message.includes('not found')) {
      return 'Calendar not found. Please verify the URL is correct and the calendar exists.';
    }
    
    if (lastError?.message.includes('offline')) {
      return 'Calendar service is offline. Please try again when you have an internet connection.';
    }
    
    return 'Failed to fetch calendar data. Please check that the URL is publicly accessible and try again. If this is a Google Calendar, make sure it\'s set to public or you\'re using the correct sharing URL.';
  }
}
