
/**
 * Notion Database Service
 * 
 * Handles database operations and data fetching
 */

import { NotionApiClient } from './NotionApiClient';
import { NotionDatabase, NotionDatabaseResponse } from '@/types/notion';
import { NOTION_CONFIG } from '@/utils/notion/NotionApiConfig';

export class NotionDatabaseService {
  private apiClient: NotionApiClient;

  constructor(token: string) {
    this.apiClient = new NotionApiClient(token);
  }

  async fetchDatabase(databaseId: string): Promise<NotionDatabase | null> {
    try {
      const data = await this.apiClient.get(`/databases/${databaseId}`);
      
      return {
        id: data.id,
        title: data.title?.[0]?.plain_text || 'Untitled Database',
        properties: data.properties || {},
        url: `https://www.notion.so/${databaseId}`
      };
    } catch (error) {
      console.error('Error fetching Notion database:', error);
      throw error;
    }
  }

  async fetchAllDatabaseEntries(databaseId: string): Promise<any[]> {
    let allPages: any[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore && allPages.length < NOTION_CONFIG.MAX_PAGES) {
      const response = await this.fetchDatabaseEntries(databaseId, cursor);
      if (!response) break;

      allPages = [...allPages, ...response.results];
      cursor = response.next_cursor || undefined;
      hasMore = response.has_more;
    }

    return allPages;
  }

  private async fetchDatabaseEntries(databaseId: string, cursor?: string): Promise<NotionDatabaseResponse | null> {
    try {
      const body: any = {
        page_size: NOTION_CONFIG.PAGE_SIZE
      };
      
      if (cursor) {
        body.start_cursor = cursor;
      }

      const data = await this.apiClient.post(`/databases/${databaseId}/query`, body);
      
      return {
        results: data.results || [],
        next_cursor: data.next_cursor || null,
        has_more: data.has_more || false
      };
    } catch (error) {
      console.error('Error fetching Notion database entries:', error);
      throw error;
    }
  }

  async testToken(): Promise<boolean> {
    return this.apiClient.testConnection();
  }
}
