
import { NotionEvent } from '@/types/notion';
import { supabase } from '@/integrations/supabase/client';

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
  private async callNotionAPI(action: string, params: any = {}) {
    try {
      const { data, error } = await supabase.functions.invoke('notion-api', {
        body: { action, ...params }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to call Notion API');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error('Notion API call failed:', error);
      throw error;
    }
  }

  private validateTokenFormat(token: string): boolean {
    return token.startsWith('ntn_') && token.length >= 50;
  }

  async getIntegrationInfo(token: string): Promise<NotionIntegrationInfo> {
    if (!this.validateTokenFormat(token)) {
      throw new Error('Invalid token format. Notion tokens should start with "ntn_" and be at least 50 characters long.');
    }

    try {
      console.log('🔐 Getting Notion integration info...');
      const result = await this.callNotionAPI('getIntegrationInfo', { token });
      return result;
    } catch (error) {
      console.error('Failed to get integration info:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      throw new Error(`Failed to retrieve integration information: ${errorMessage}`);
    }
  }

  async testPageAccess(pageId: string, token: string): Promise<boolean> {
    try {
      await this.callNotionAPI('getPage', { pageId, token });
      return true;
    } catch (error) {
      console.warn(`No access to page ${pageId}:`, error);
      return false;
    }
  }

  async testDatabaseAccess(databaseId: string, token: string): Promise<boolean> {
    try {
      await this.callNotionAPI('getDatabase', { databaseId, token });
      return true;
    } catch (error) {
      console.warn(`No access to database ${databaseId}:`, error);
      return false;
    }
  }

  async getPage(pageId: string, token: string): Promise<any> {
    try {
      return await this.callNotionAPI('getPage', { pageId, token });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(errorMessage);
    }
  }

  async getDatabase(databaseId: string, token: string): Promise<any> {
    try {
      return await this.callNotionAPI('getDatabase', { databaseId, token });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(errorMessage);
    }
  }

  async queryDatabase(databaseId: string, token: string, filter?: any): Promise<any> {
    try {
      return await this.callNotionAPI('queryDatabase', { databaseId, token, filter });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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

  transformToEvents(pages: any[], calendarId: string, calendarName: string, color: string): NotionEvent[] {
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

  private extractTitle(page: any): string {
    const properties = page.properties;
    
    // Find title property
    for (const [key, property] of Object.entries(properties)) {
      if (property && typeof property === 'object' && 'type' in property && property.type === 'title' && 'title' in property && property.title) {
        const titleText = property.title
          .map((text: any) => text.plain_text)
          .join('');
        return titleText || 'Untitled';
      }
    }
    
    return 'Untitled';
  }

  private extractDate(page: any): Date {
    const properties = page.properties;
    
    // Look for date properties
    for (const [key, property] of Object.entries(properties)) {
      if (property && typeof property === 'object' && 'type' in property && property.type === 'date' && 'date' in property && (property as any).date?.start) {
        return new Date((property as any).date.start);
      }
    }
    
    return new Date(page.created_time);
  }

  private extractTime(page: any): string | null {
    const properties = page.properties;
    
    // Look for date properties with time
    for (const [key, property] of Object.entries(properties)) {
      if (property && typeof property === 'object' && 'type' in property && property.type === 'date' && 'date' in property && (property as any).date?.start) {
        const dateString = (property as any).date.start;
        const timeMatch = dateString.match(/T(\d{2}:\d{2})/);
        return timeMatch ? timeMatch[1] : null;
      }
    }
    
    return null;
  }

  private extractDescription(page: any): string {
    const properties = page.properties;
    
    // Look for rich text properties that might contain description
    for (const [key, property] of Object.entries(properties)) {
      if (property && typeof property === 'object' && 'type' in property && property.type === 'rich_text' && 'rich_text' in property && (property as any).rich_text) {
        const description = (property as any).rich_text
          .map((text: any) => text.plain_text)
          .join('');
        if (description) return description;
      }
    }
    
    return '';
  }

  private extractLocation(page: any): string {
    const properties = page.properties;
    
    // Look for properties that might contain location info
    for (const [key, property] of Object.entries(properties)) {
      const keyLower = key.toLowerCase();
      
      if (keyLower.includes('location')) {
        if (property && typeof property === 'object' && 'type' in property && property.type === 'rich_text' && 'rich_text' in property && (property as any).rich_text) {
          const location = (property as any).rich_text
            .map((text: any) => text.plain_text)
            .join('');
          if (location) return location;
        }
        
        if (property && typeof property === 'object' && 'type' in property && property.type === 'select' && 'select' in property && (property as any).select) {
          return (property as any).select.name || '';
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

      const result = await this.callNotionAPI('validate', { token });
      console.log('✅ Notion token validation successful');
      return result === true;
    } catch (error) {
      console.error('❌ Notion token validation failed:', error);
      return false;
    }
  }

  async validateCalendarAccess(url: string, token: string): Promise<{ hasAccess: boolean; resourceType: 'page' | 'database' | null; error?: string }> {
    try {
      const result = await this.callNotionAPI('validateAccess', { url, token });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { 
        hasAccess: false, 
        resourceType: null, 
        error: errorMessage
      };
    }
  }
}

export const notionService = new NotionService();
