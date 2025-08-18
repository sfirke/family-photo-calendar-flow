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
  // Direct Notion REST base (used in production only when behind a trusted proxy we control)
  private readonly baseURL = 'https://api.notion.com/v1';

  // Determine runtime environment capabilities
  private get useDevProxy(): boolean {
    // In Vite dev we expose a local proxy at /notion -> https://api.notion.com/v1
    return typeof window !== 'undefined' && !!(import.meta as any).env?.DEV;
  }

  private resolveUrl(endpoint: string): string {
    if (this.useDevProxy) {
      // Use relative path so browser hits Vite dev server (avoids CORS)
      return `/notion${endpoint}`;
    }
    // In production the static site cannot call Notion API directly (CORS + secret exposure).
    // A serverless proxy must be provided; we point to baseURL so that if user deploys behind
    // a reverse proxy it will work. Otherwise request will fail with clear error.
    return `${this.baseURL}${endpoint}`;
  }

  private async makeRequest<T = unknown>(endpoint: string, token: string, options: RequestInit = {}): Promise<T> {
    const url = this.resolveUrl(endpoint);

    // Prepare headers (Authorization is required by Notion; okay in dev since user supplies their own token locally)
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };

    // If not using dev proxy AND running in browser, warn about likely CORS failure
    if (!this.useDevProxy && typeof window !== 'undefined') {
      console.warn('[NotionAPIClient] Direct browser call to Notion API – this will likely fail due to CORS. Configure a serverless proxy or deploy with one.');
    }

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
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
