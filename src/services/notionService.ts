import { NotionPage, NotionDatabase, NotionApiResponse, NotionEvent } from '@/types/notion';

interface RequestDebugInfo {
  url: string;
  method: string;
  headers: Record<string, string>;
  status: number;
  statusText: string;
  responseText: string;
  contentType: string | null;
  serviceWorkerResponse: boolean;
}

interface NotionIntegrationInfo {
  type: string;
  name: string;
  capabilities: {
    read_content: boolean;
    read_user_info: boolean;
  };
  workspace?: {
    name: string;
    id: string;
  };
}

class NotionService {
  private baseUrl = 'https://api.notion.com/v1';
  private version = '2022-02-22'; // Updated to latest stable version for internal integrations

  private validateTokenFormat(token: string): boolean {
    // Notion integration tokens should start with "ntn_" and be at least 50 characters
    return token.startsWith('ntn_') && token.length >= 50;
  }

  private detectServiceWorkerResponse(response: Response, responseText: string): boolean {
    // Detect if this response came from our service worker
    const contentType = response.headers.get('content-type');
    return (
      response.status === 200 && 
      responseText === 'Offline' && 
      contentType === 'text/plain'
    );
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

  private classifyError(error: Error, response?: Response): string {
    // Network connectivity errors
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return 'Network error: Unable to reach Notion API. Please check your internet connection and try again.';
    }

    // Timeout errors
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return 'Request timed out. The Notion API may be slow to respond. Please try again.';
    }

    // Service worker interference
    if (error.message.includes('Service worker')) {
      return 'Service worker is interfering with API requests. Please refresh the page or disable the service worker.';
    }

    // HTTP status errors
    if (response) {
      switch (response.status) {
        case 400:
          return 'Invalid request format. Please check your integration token format and try again.';
        case 401:
          return 'Invalid Notion token. Please check your integration token and ensure it has the correct permissions.';
        case 403:
          return 'Access forbidden. Please ensure your integration has access to the requested page or database. You may need to share the page/database with your integration.';
        case 404:
          return 'Page or database not found. Please check the URL and ensure the page/database exists and is shared with your integration.';
        case 429:
          return 'Rate limit exceeded. Please wait a moment and try again.';
        case 500:
        case 502:
        case 503:
        case 504:
          return 'Notion server error. Please try again later.';
        default:
          return `Notion API error: ${response.status} - ${response.statusText}`;
      }
    }

    return `Unexpected error: ${error.message}`;
  }

  private logRequestDebug(debugInfo: RequestDebugInfo, error?: Error) {
    console.group('🔍 Notion API Request Debug');
    console.log('URL:', debugInfo.url);
    console.log('Method:', debugInfo.method);
    console.log('Headers:', debugInfo.headers);
    console.log('Status:', debugInfo.status, debugInfo.statusText);
    console.log('Content-Type:', debugInfo.contentType);
    console.log('Service Worker Response:', debugInfo.serviceWorkerResponse);
    console.log('Response Text:', debugInfo.responseText);
    if (error) {
      console.error('Error:', error);
    }
    console.groupEnd();
  }

  private async makeRequest(endpoint: string, token: string, options: RequestInit = {}, bypassServiceWorker = false) {
    // Validate token format first
    if (!this.validateTokenFormat(token)) {
      throw new Error('Invalid token format. Notion tokens should start with "ntn_" and be at least 50 characters long.');
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

    // Add cache-busting for critical requests to bypass service worker
    if (bypassServiceWorker) {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
    }

    let response: Response;
    let responseText: string = '';
    let debugInfo: RequestDebugInfo;

    try {
      console.log(`🚀 Making Notion API request to: ${url}`);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const requestOptions: RequestInit = {
        ...options,
        headers,
        signal: controller.signal,
        mode: 'cors',
        cache: bypassServiceWorker ? 'no-cache' : 'default'
      };

      response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);

      // Get response text for debugging
      responseText = await response.text();
      const contentType = response.headers.get('content-type');
      const serviceWorkerResponse = this.detectServiceWorkerResponse(response, responseText);

      debugInfo = {
        url,
        method: options.method || 'GET',
        headers,
        status: response.status,
        statusText: response.statusText,
        responseText: responseText.substring(0, 500), // Limit for logging
        contentType,
        serviceWorkerResponse,
      };

      // Check for service worker interference
      if (serviceWorkerResponse) {
        this.logRequestDebug(debugInfo);
        throw new Error('Service worker is interfering with API requests. The request was intercepted and returned an "Offline" response instead of reaching the Notion API. Please refresh the page or disable the service worker.');
      }

      // Check if response is not ok
      if (!response.ok) {
        this.logRequestDebug(debugInfo);
        const errorMessage = this.classifyError(new Error(`HTTP ${response.status}`), response);
        
        // Try to parse error as JSON for additional context
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = JSON.parse(responseText);
            if (errorData.message) {
              throw new Error(`${errorMessage} (${errorData.message})`);
            }
          } catch (parseError) {
            // Fallback to classified error message
          }
        }
        
        throw new Error(errorMessage);
      }

      // Check if response is JSON
      if (!contentType || !contentType.includes('application/json')) {
        this.logRequestDebug(debugInfo);
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
        // Re-throw our custom errors
        if (error.message.includes('Notion') || 
            error.message.includes('Invalid token') || 
            error.message.includes('Service worker') ||
            error.message.includes('Access forbidden') ||
            error.message.includes('Rate limit') ||
            error.message.includes('server error')) {
          throw error;
        }

        // Classify and throw network/fetch errors
        const classifiedError = this.classifyError(error, response);
        throw new Error(classifiedError);
      }

      // Log debug info for unexpected errors
      if (debugInfo!) {
        this.logRequestDebug(debugInfo!, error as Error);
      }

      throw new Error(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getIntegrationInfo(token: string): Promise<NotionIntegrationInfo> {
    try {
      console.log('🔐 Getting Notion integration info...');
      const userInfo = await this.makeRequest('/users/me', token, {}, true); // Bypass service worker for critical requests
      
      return {
        type: userInfo.type || 'bot',
        name: userInfo.name || 'Unknown Integration',
        capabilities: {
          read_content: true, // Assume true if we can call the API
          read_user_info: true
        },
        workspace: userInfo.workspace ? {
          name: userInfo.workspace.name || 'Unknown Workspace',
          id: userInfo.workspace.id
        } : undefined
      };
    } catch (error) {
      console.error('Failed to get integration info:', error);
      throw new Error('Failed to retrieve integration information. Please check your token and try again.');
    }
  }

  async testPageAccess(pageId: string, token: string): Promise<boolean> {
    try {
      await this.makeRequest(`/pages/${pageId}`, token, {}, true);
      return true;
    } catch (error) {
      console.warn(`No access to page ${pageId}:`, error);
      return false;
    }
  }

  async testDatabaseAccess(databaseId: string, token: string): Promise<boolean> {
    try {
      await this.makeRequest(`/databases/${databaseId}`, token, {}, true);
      return true;
    } catch (error) {
      console.warn(`No access to database ${databaseId}:`, error);
      return false;
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

      // Test the token by getting integration info directly (no reachability check)
      const integrationInfo = await this.getIntegrationInfo(token);
      console.log('✅ Notion token validation successful:', integrationInfo);
      return true;
    } catch (error) {
      console.error('❌ Notion token validation failed:', error);
      return false;
    }
  }

  async validateCalendarAccess(url: string, token: string): Promise<{ hasAccess: boolean; resourceType: 'page' | 'database' | null; error?: string }> {
    const pageId = this.extractPageIdFromUrl(url);
    if (!pageId) {
      return { hasAccess: false, resourceType: null, error: 'Invalid Notion URL format' };
    }

    // Try database first, then page
    const databaseAccess = await this.testDatabaseAccess(pageId, token);
    if (databaseAccess) {
      return { hasAccess: true, resourceType: 'database' };
    }

    const pageAccess = await this.testPageAccess(pageId, token);
    if (pageAccess) {
      return { hasAccess: true, resourceType: 'page' };
    }

    return { 
      hasAccess: false, 
      resourceType: null, 
      error: 'Page/database not shared with integration or does not exist' 
    };
  }
}

export const notionService = new NotionService();
