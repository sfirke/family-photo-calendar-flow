
/**
 * Notion Service Facade
 * 
 * Main entry point for Notion operations, coordinating all services
 */

import { NotionDatabaseService } from './NotionDatabaseService';
import { NotionEventMapper } from './NotionEventMapper';
import { NotionUrlValidator } from '@/utils/notion/NotionUrlValidator';
import { NotionDatabase, NotionPage } from '@/types/notion';

export class NotionServiceFacade {
  static async testToken(token: string): Promise<boolean> {
    try {
      const service = new NotionDatabaseService(token);
      return await service.testToken();
    } catch (error) {
      console.error('Token test failed:', error);
      return false;
    }
  }

  static extractDatabaseId(url: string): string | null {
    return NotionUrlValidator.extractDatabaseId(url);
  }

  static isValidNotionUrl(url: string): boolean {
    return NotionUrlValidator.isValidNotionUrl(url);
  }

  static async fetchDatabase(databaseId: string, token: string): Promise<NotionDatabase | null> {
    try {
      const service = new NotionDatabaseService(token);
      return await service.fetchDatabase(databaseId);
    } catch (error) {
      console.error('Error fetching Notion database:', error);
      throw error;
    }
  }

  static async fetchDatabaseEntries(databaseId: string, token: string): Promise<any[]> {
    try {
      const service = new NotionDatabaseService(token);
      return await service.fetchAllDatabaseEntries(databaseId);
    } catch (error) {
      console.error('Error fetching Notion database entries:', error);
      throw error;
    }
  }

  static pageToEvent(page: NotionPage, calendar: any, propertyMappings?: any) {
    return NotionEventMapper.pageToEvent(page, calendar, propertyMappings);
  }
}
