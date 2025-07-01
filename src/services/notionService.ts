
/**
 * Notion Service - Legacy Compatibility Layer
 * 
 * Maintains backward compatibility while delegating to new modular services
 */

import { NotionServiceFacade } from './notion/NotionServiceFacade';

export class NotionService {
  /**
   * @deprecated Use NotionServiceFacade.testToken instead
   */
  static async testToken(token: string): Promise<boolean> {
    return NotionServiceFacade.testToken(token);
  }

  /**
   * @deprecated Use NotionUrlValidator.extractDatabaseId instead
   */
  static extractDatabaseId(url: string): string | null {
    return NotionServiceFacade.extractDatabaseId(url);
  }

  /**
   * @deprecated Use NotionUrlValidator.isValidNotionUrl instead
   */
  static isValidNotionUrl(url: string): boolean {
    return NotionServiceFacade.isValidNotionUrl(url);
  }

  /**
   * @deprecated Use NotionDatabaseService.fetchDatabase instead
   */
  static async fetchDatabase(databaseId: string, token: string) {
    return NotionServiceFacade.fetchDatabase(databaseId, token);
  }

  /**
   * @deprecated Use NotionDatabaseService.fetchDatabaseEntries instead
   */
  static async fetchDatabaseEntries(databaseId: string, token: string, cursor?: string) {
    // For backward compatibility, return old format
    const entries = await NotionServiceFacade.fetchDatabaseEntries(databaseId, token);
    return {
      results: entries,
      next_cursor: null,
      has_more: false
    };
  }

  /**
   * @deprecated Use NotionEventMapper.pageToEvent instead
   */
  static pageToEvent(page: any, calendar: any, propertyMappings?: any) {
    return NotionServiceFacade.pageToEvent(page, calendar, propertyMappings);
  }
}
