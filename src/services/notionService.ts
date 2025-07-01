
import { Client } from '@notionhq/client';
import { 
  PageObjectResponse, 
  DatabaseObjectResponse, 
  QueryDatabaseResponse,
  GetUserResponse,
  APIErrorCode,
  APIResponseError,
  ClientErrorCode,
  isNotionClientError
} from '@notionhq/client/build/src/api-endpoints';
import { NotionEvent } from '@/types/notion';

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
  private createClient(token: string): Client {
    return new Client({
      auth: token,
      notionVersion: '2022-06-28'
    });
  }

  private validateTokenFormat(token: string): boolean {
    return token.startsWith('ntn_') && token.length >= 50;
  }

  private classifyNotionError(error: unknown): string {
    if (isNotionClientError(error)) {
      switch (error.code) {
        case ClientErrorCode.UnauthorizedUser:
          return 'Invalid Notion token. Please check your integration token and ensure it has the correct permissions.';
        case ClientErrorCode.RestrictedResource:
          return 'Access forbidden. Please ensure your integration has access to the requested page or database. You may need to share the page/database with your integration.';
        case ClientErrorCode.ObjectNotFound:
          return 'Page or database not found. Please check the URL and ensure the page/database exists and is shared with your integration.';
        case ClientErrorCode.RateLimited:
          return 'Rate limit exceeded. Please wait a moment and try again.';
        case ClientErrorCode.InvalidJSON:
          return 'Invalid request format. Please check your integration token format and try again.';
        case ClientErrorCode.InvalidRequest:
          return 'Invalid request. Please check the page/database URL and try again.';
        case ClientErrorCode.ValidationError:
          return 'Validation error. Please check your request parameters.';
        case ClientErrorCode.ConflictError:
          return 'Conflict error. The resource may have been modified by another process.';
        default:
          return `Notion API error: ${error.message}`;
      }
    }

    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return 'Network error: Unable to reach Notion API. Please check your internet connection and try again.';
      }
      
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        return 'Request timed out. The Notion API may be slow to respond. Please try again.';
      }

      return `Unexpected error: ${error.message}`;
    }

    return 'An unknown error occurred while connecting to Notion.';
  }

  async getIntegrationInfo(token: string): Promise<NotionIntegrationInfo> {
    if (!this.validateTokenFormat(token)) {
      throw new Error('Invalid token format. Notion tokens should start with "ntn_" and be at least 50 characters long.');
    }

    try {
      console.log('🔐 Getting Notion integration info...');
      const notion = this.createClient(token);
      const userInfo = await notion.users.me();
      
      return {
        type: userInfo.type || 'bot',
        name: userInfo.name || 'Unknown Integration',
        capabilities: {
          read_content: true,
          read_user_info: true
        },
        workspace: userInfo.type === 'bot' && 'workspace' in userInfo ? {
          name: userInfo.workspace?.name || 'Unknown Workspace',
          id: userInfo.workspace?.id || ''
        } : undefined
      };
    } catch (error) {
      console.error('Failed to get integration info:', error);
      const errorMessage = this.classifyNotionError(error);
      throw new Error(`Failed to retrieve integration information: ${errorMessage}`);
    }
  }

  async testPageAccess(pageId: string, token: string): Promise<boolean> {
    try {
      const notion = this.createClient(token);
      await notion.pages.retrieve({ page_id: pageId });
      return true;
    } catch (error) {
      console.warn(`No access to page ${pageId}:`, error);
      return false;
    }
  }

  async testDatabaseAccess(databaseId: string, token: string): Promise<boolean> {
    try {
      const notion = this.createClient(token);
      await notion.databases.retrieve({ database_id: databaseId });
      return true;
    } catch (error) {
      console.warn(`No access to database ${databaseId}:`, error);
      return false;
    }
  }

  async getPage(pageId: string, token: string): Promise<PageObjectResponse> {
    const notion = this.createClient(token);
    try {
      const response = await notion.pages.retrieve({ page_id: pageId });
      return response as PageObjectResponse;
    } catch (error) {
      const errorMessage = this.classifyNotionError(error);
      throw new Error(errorMessage);
    }
  }

  async getDatabase(databaseId: string, token: string): Promise<DatabaseObjectResponse> {
    const notion = this.createClient(token);
    try {
      const response = await notion.databases.retrieve({ database_id: databaseId });
      return response as DatabaseObjectResponse;
    } catch (error) {
      const errorMessage = this.classifyNotionError(error);
      throw new Error(errorMessage);
    }
  }

  async queryDatabase(databaseId: string, token: string, filter?: any): Promise<QueryDatabaseResponse> {
    const notion = this.createClient(token);
    try {
      const response = await notion.databases.query({
        database_id: databaseId,
        filter,
        sorts: [
          {
            property: 'Date',
            direction: 'ascending'
          }
        ]
      });
      return response;
    } catch (error) {
      const errorMessage = this.classifyNotionError(error);
      throw new Error(errorMessage);
    }
  }

  extractPageIdFromUrl(url: string): string | null {
    const patterns = [
      /notion\.so\/([a-f0-9]{32})/,
      /notion\.so\/.*-([a-f0-9]{32})/,
      /notion\.so\/.*\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1].replace(/-/g, '');
      }
    }

    return null;
  }

  transformToEvents(pages: PageObjectResponse[], calendarId: string, calendarName: string, color: string): NotionEvent[] {
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

  private extractTitle(page: PageObjectResponse): string {
    const properties = page.properties;
    
    // Find title property
    for (const [key, property] of Object.entries(properties)) {
      if (property && typeof property === 'object' && 'type' in property && property.type === 'title' && 'title' in property && property.title) {
        const titleText = property.title
          .map(text => text.plain_text)
          .join('');
        return titleText || 'Untitled';
      }
    }
    
    return 'Untitled';
  }

  private extractDate(page: PageObjectResponse): Date {
    const properties = page.properties;
    
    // Look for date properties
    for (const [key, property] of Object.entries(properties)) {
      if (property && typeof property === 'object' && 'type' in property && property.type === 'date' && 'date' in property && property.date?.start) {
        return new Date(property.date.start);
      }
    }
    
    return new Date(page.created_time);
  }

  private extractTime(page: PageObjectResponse): string | null {
    const properties = page.properties;
    
    // Look for date properties with time
    for (const [key, property] of Object.entries(properties)) {
      if (property && typeof property === 'object' && 'type' in property && property.type === 'date' && 'date' in property && property.date?.start) {
        const dateString = property.date.start;
        const timeMatch = dateString.match(/T(\d{2}:\d{2})/);
        return timeMatch ? timeMatch[1] : null;
      }
    }
    
    return null;
  }

  private extractDescription(page: PageObjectResponse): string {
    const properties = page.properties;
    
    // Look for rich text properties that might contain description
    for (const [key, property] of Object.entries(properties)) {
      if (property && typeof property === 'object' && 'type' in property && property.type === 'rich_text' && 'rich_text' in property && property.rich_text) {
        const description = property.rich_text
          .map(text => text.plain_text)
          .join('');
        if (description) return description;
      }
    }
    
    return '';
  }

  private extractLocation(page: PageObjectResponse): string {
    const properties = page.properties;
    
    // Look for properties that might contain location info
    for (const [key, property] of Object.entries(properties)) {
      const keyLower = key.toLowerCase();
      
      if (keyLower.includes('location')) {
        if (property && typeof property === 'object' && 'type' in property && property.type === 'rich_text' && 'rich_text' in property && property.rich_text) {
          const location = property.rich_text
            .map(text => text.plain_text)
            .join('');
          if (location) return location;
        }
        
        if (property && typeof property === 'object' && 'type' in property && property.type === 'select' && 'select' in property && property.select) {
          return property.select.name || '';
        }
      }
    }
    
    return '';
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      console.log('🔐 Validating Notion token...');
      
      if (!this.validateTokenFormat(token)) {
        console.error('❌ Invalid token format');
        return false;
      }

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
