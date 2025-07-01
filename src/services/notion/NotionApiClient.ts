
/**
 * Notion API Client
 * 
 * Core HTTP client for Notion API with authentication and error handling
 */

import { NOTION_CONFIG, NOTION_ERRORS } from '@/utils/notion/NotionApiConfig';

export class NotionApiClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Notion-Version': NOTION_CONFIG.VERSION,
      'Content-Type': 'application/json',
    };
  }

  private async handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Notion API error: ${response.status} - ${errorText}`);
      
      switch (response.status) {
        case 401:
          throw new Error(NOTION_ERRORS.UNAUTHORIZED);
        case 403:
          throw new Error(NOTION_ERRORS.FORBIDDEN);
        case 404:
          throw new Error(NOTION_ERRORS.NOT_FOUND);
        case 429:
          throw new Error(NOTION_ERRORS.RATE_LIMITED);
        default:
          throw new Error(`${NOTION_ERRORS.INVALID_REQUEST}: ${response.status}`);
      }
    }

    return response.json();
  }

  async get(endpoint: string): Promise<any> {
    try {
      const response = await fetch(`${NOTION_CONFIG.API_BASE}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(NOTION_ERRORS.NETWORK_ERROR);
    }
  }

  async post(endpoint: string, body: any): Promise<any> {
    try {
      const response = await fetch(`${NOTION_CONFIG.API_BASE}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      return this.handleResponse(response);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(NOTION_ERRORS.NETWORK_ERROR);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.get('/users/me');
      return true;
    } catch (error) {
      console.error('Token test failed:', error);
      return false;
    }
  }
}
