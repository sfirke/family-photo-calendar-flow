import { NotionPage, NotionDatabase, NotionApiResponse, NotionEvent } from '@/types/notion';

interface RequestDebugInfo {
  url: string;
  method: string;
  headers: Record<string, string>;
  status: number;
  statusText: string;
  responseText: string;
  contentType: string | null;
}

class NotionService {
  private baseUrl = 'https://api.notion.com/v1';
  private version = '2022-06-28';

  private validateTokenFormat(token: string): boolean {
    // Notion integration tokens should start with "ntn_" and be at least 50 characters
    return token.startsWith('ntn_') && token.length >= 50;
  }

  private async checkNetworkConnectivity(): Promise<boolean> {
    try {
      // Simple connectivity check
      const response = await fetch('https://api.notion.com', { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      return true;
    } catch (error) {
      console.warn('Network connectivity check failed:', error);
      return false;
    }
  }

  private normalizeHeaders(headers?: HeadersInit): Record<string, string> {
    if (!headers) return {};
    
    // If it's already a plain object, return it
    if (headers.constructor === Object) {
      return headers as Record<string, string>;
    }
    
    // If it's a Headers object
    if (headers instanceof Headers) {
      const normalized: Record<string, string> = {};
      headers.forEach((value, key) => {
        normalized[key] = value;
      });
      return normalized;
    }
    
    // If it's an array of arrays
    if (Array.isArray(headers)) {
      const normalized: Record<string, string> = {};
      headers.forEach(([key, value]) => {
        normalized[key] = value;
      });
      return normalized;
    }
    
    // Fallback: return empty object
    return {};
  }

  private logRequestDebug(debugInfo: RequestDebugInfo, error?: Error) {
    console.group('🔍 Notion API Request Debug');
    console.log('URL:', debugInfo.url);
    console.log('Method:', debugInfo.method);
    console.log('Headers:', debugInfo.headers);
    console.log('Status:', debugInfo.status, debugInfo.statusText);
    console.log('Content-Type:', debugInfo.contentType);
    console.log('Response Text:', debugInfo.responseText);
    if (error) {
      console.error('Error:', error);
    }
    console.groupEnd();
  }

  private async makeRequest(endpoint: string, token: string, options: RequestInit = {}) {
    // Validate token format first
    if (!this.validateTokenFormat(token)) {
      throw new Error('Invalid token format. Notion tokens should start with "ntn_" and be at least 50 characters long.');
    }

    // Check network connectivity
    const isOnline = await this.checkNetworkConnectivity();
    if (!isOnline) {
      throw new Error('Network connectivity issue detected. Please check your internet connection.');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const baseHeaders = {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': this.version,
      'Content-Type': 'application/json',
    };
    
    // Normalize and merge headers
    const normalizedOptionHeaders = this.normalizeHeaders(options.headers);
    const headers = { ...baseHeaders, ...normalizedOptionHeaders };

    let response: Response;
    let responseText: string = '';
    let debugInfo: RequestDebugInfo;

    try {
      console.log(`🚀 Making Notion API request to: ${url}`);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Get response text for debugging
      responseText = await response.text();
      const contentType = response.headers.get('content-type');

      debugInfo = {
        url,
        method: options.method || 'GET',
        headers,
        status: response.status,
        statusText: response.statusText,
        responseText: responseText.substring(0, 500), // Limit for logging
        contentType,
      };

      // Check if response is not ok
      if (!response.ok) {
        this.logRequestDebug(debugInfo);
        
        // Try to parse error as JSON if possible
        let errorMessage = `Notion API error: ${response.status} - ${response.statusText}`;
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = `Notion API error: ${response.status} - ${errorData.message || response.statusText}`;
          } catch (parseError) {
            // Fallback to status text if JSON parsing fails
          }
        } else {
          // Handle non-JSON error responses
          if (responseText.includes('Offline') || responseText.includes('offline')) {
            errorMessage = 'Notion API appears to be offline or unreachable. Please try again later.';
          } else if (responseText.includes('Unauthorized') || response.status === 401) {
            errorMessage = 'Invalid Notion token. Please check your integration token and ensure it has the correct permissions.';
          } else if (responseText.includes('Forbidden') || response.status === 403) {
            errorMessage = 'Access forbidden. Please ensure your integration has access to the requested page or database.';
          } else if (response.status >= 500) {
            errorMessage = 'Notion server error. Please try again later.';
          }
        }
        
        throw new Error(errorMessage);
      }

      // Check if response is JSON
      if (!contentType || !contentType.includes('application/json')) {
        this.logRequestDebug(debugInfo);
        
        if (responseText.includes('Offline') || responseText.includes('offline')) {
          throw new Error('Notion API is currently offline or unreachable. Please try again later.');
        }
        
        throw new Error(`Unexpected response format. Expected JSON but received: ${contentType || 'unknown'}`);
      }

      // Parse JSON response
      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        this.logRequestDebug(debugInfo, parseError as Error);
        throw new Error(`Failed to parse Notion API response as JSON. Response: ${responseText.substring(0, 100)}...`);
      }

    } catch (error) {
      // Handle fetch errors (network issues, timeouts, etc.)
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. The Notion API may be slow to respond. Please try again.');
        }
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error('Network error: Unable to reach Notion API. Please check your internet connection and try again.');
        }

        // Re-throw our custom errors
        if (error.message.includes('Notion') || error.message.includes('Invalid token')) {
          throw error;
        }
      }

      // Log debug info for unexpected errors
      if (debugInfo!) {
        this.logRequestDebug(debugInfo!, error as Error);
      }

      throw new Error(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPage(pageId: string, token: string): Promise<NotionPage> {
    return this.makeRequest(`/pages/${pageId}`, token);
  }

  async getDatabase(databaseId: string, token: string): Promise<NotionDatabase> {
    return this.makeRequest(`/databases/${databaseId}`, token);
  }

  async queryDatabase(databaseId: string, token: string, filter?: any): Promise<NotionApiResponse> {
    return this.makeRequest(`/databases/${databaseId}/query`, token, {
      method: 'POST',
      body: JSON.stringify({
        filter,
        sorts: [
          {
            property: 'Date',
            direction: 'ascending'
          }
        ]
      }),
    });
  }

  extractPageIdFromUrl(url: string): string | null {
    // Handle various Notion URL formats
    const patterns = [
      /notion\.so\/([a-f0-9]{32})/,
      /notion\.so\/.*-([a-f0-9]{32})/,
      /notion\.so\/.*\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        // Remove hyphens if present and ensure 32 character format
        return match[1].replace(/-/g, '');
      }
    }

    return null;
  }

  transformToEvents(pages: NotionPage[], calendarId: string, calendarName: string, color: string): NotionEvent[] {
    return pages.map(page => {
      const title = this.extractTitle(page);
      const date = this.extractDate(page);
      const time = this.extractTime(page) || 'All day';
      const description = this.extractDescription(page);
      const location = this.extractLocation(page);

      return {
        id: `notion_${page.id}`,
        title,
        date,
        time,
        description,
        location,
        calendarId,
        calendarName,
        source: 'notion' as const,
        color,
        properties: page.properties,
        notionPageId: page.id,
        notionUrl: page.url || `https://notion.so/${page.id}`
      };
    });
  }

  private extractTitle(page: NotionPage): string {
    const titleProperty = Object.values(page.properties).find(
      prop => prop.type === 'title'
    );
    
    if (titleProperty && titleProperty.title && titleProperty.title[0]) {
      return titleProperty.title[0].plain_text || 'Untitled';
    }
    
    return 'Untitled';
  }

  private extractDate(page: NotionPage): Date {
    // Look for date properties
    const dateProperty = Object.values(page.properties).find(
      prop => prop.type === 'date'
    );
    
    if (dateProperty && dateProperty.date && dateProperty.date.start) {
      return new Date(dateProperty.date.start);
    }
    
    // Fallback to creation date
    return new Date(page.created_time);
  }

  private extractTime(page: NotionPage): string | null {
    const dateProperty = Object.values(page.properties).find(
      prop => prop.type === 'date'
    );
    
    if (dateProperty && dateProperty.date && dateProperty.date.start) {
      const dateString = dateProperty.date.start;
      const timeMatch = dateString.match(/T(\d{2}:\d{2})/);
      return timeMatch ? timeMatch[1] : null;
    }
    
    return null;
  }

  private extractDescription(page: NotionPage): string {
    // Look for rich text properties that might contain description
    const textProperties = Object.values(page.properties).filter(
      prop => prop.type === 'rich_text'
    );
    
    for (const prop of textProperties) {
      if (prop.rich_text && prop.rich_text[0]) {
        return prop.rich_text[0].plain_text || '';
      }
    }
    
    return '';
  }

  private extractLocation(page: NotionPage): string {
    // Look for location or place properties
    const locationProps = Object.values(page.properties).filter(
      prop => prop.type === 'rich_text' || prop.type === 'select'
    );
    
    for (const prop of locationProps) {
      if (prop.name && prop.name.toLowerCase().includes('location')) {
        if (prop.type === 'rich_text' && prop.rich_text && prop.rich_text[0]) {
          return prop.rich_text[0].plain_text || '';
        }
        if (prop.type === 'select' && prop.select) {
          return prop.select.name || '';
        }
      }
    }
    
    return '';
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      console.log('🔐 Validating Notion token...');
      
      // First check token format
      if (!this.validateTokenFormat(token)) {
        console.error('❌ Invalid token format');
        return false;
      }

      // Test the token by calling the users/me endpoint
      await this.makeRequest('/users/me', token);
      console.log('✅ Notion token validation successful');
      return true;
    } catch (error) {
      console.error('❌ Notion token validation failed:', error);
      return false;
    }
  }
}

export const notionService = new NotionService();
