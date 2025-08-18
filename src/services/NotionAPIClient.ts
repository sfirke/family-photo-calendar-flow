import type {
  PageObjectResponse,
  DatabaseObjectResponse,
  QueryDatabaseResponse,
} from '@notionhq/client/build/src/api-endpoints';

/**
 * Notion API Client with CORS Proxy
 * 
 * Handles all Notion API calls through a CORS proxy to resolve browser CORS restrictions.
 */

interface NotionRequest {
  url: string;
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  body?: string;
}

interface ProxyResponse {
  contents: string;
  status: {
    http_code: number;
  };
}

export class NotionAPIClient {
  private readonly corsProxy = 'https://api.allorigins.win/raw';
  private readonly baseURL = 'https://api.notion.com/v1';
  
  private async makeRequest<T = unknown>(endpoint: string, token: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Prepare headers
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Use CORS proxy for the request
    const proxyUrl = `${this.corsProxy}?url=${encodeURIComponent(url)}`;
    
    try {
      const response = await fetch(proxyUrl, {
        method: options.method || 'GET',
        headers: {
          ...headers,
          // Remove Authorization from proxy headers and add it to the proxied request
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: options.body,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

  const data = await response.json();
  return data as T;
    } catch (error) {
      console.error(`Notion API request failed for ${endpoint}:`, error);
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): Error {
    if (error && typeof error === 'object') {
      const errObj = error as { code?: string; message?: string };
      if (errObj.code) {
        switch (errObj.code) {
          case 'unauthorized':
            return new Error('Invalid Notion token. Please check your integration token and ensure it has the correct permissions.');
          case 'restricted_resource':
            return new Error('Access forbidden. Please ensure your integration has access to the requested page or database.');
          case 'object_not_found':
            return new Error('Page or database not found. Please check the URL and ensure the page/database exists and is shared with your integration.');
          case 'rate_limited':
            return new Error('Rate limit exceeded. Please wait a moment and try again.');
          default:
            return new Error(`Notion API error: ${errObj.message || 'Unknown error'}`);
        }
      }
      if (errObj.message) {
        if (errObj.message.includes('Failed to fetch') || errObj.message.includes('NetworkError')) {
          return new Error('Network error: Unable to reach Notion API. Please check your internet connection and try again.');
        }
        return new Error(`Unexpected error: ${errObj.message}`);
      }
    }
    return new Error('An unknown error occurred while connecting to Notion.');
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      await this.makeRequest('/users/me', token);
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  async getIntegrationInfo(token: string): Promise<{ type?: string; name?: string; workspace?: { name?: string; id?: string } }> {
    return this.makeRequest('/users/me', token);
  }

  async getDatabase(databaseId: string, token: string): Promise<DatabaseObjectResponse> {
    return this.makeRequest(`/databases/${databaseId}`, token);
  }

  async queryDatabase(databaseId: string, token: string, filter?: unknown): Promise<QueryDatabaseResponse> {
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

  async getPage(pageId: string, token: string): Promise<PageObjectResponse> {
    return this.makeRequest(`/pages/${pageId}`, token);
  }
}

export const notionAPIClient = new NotionAPIClient();
