
import { NotionPage, NotionDatabase, NotionApiResponse, NotionEvent } from '@/types/notion';

class NotionService {
  private baseUrl = 'https://api.notion.com/v1';
  private version = '2022-06-28';

  private async makeRequest(endpoint: string, token: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': this.version,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Notion API error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    return response.json();
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
      await this.makeRequest('/users/me', token);
      return true;
    } catch (error) {
      console.error('Notion token validation failed:', error);
      return false;
    }
  }
}

export const notionService = new NotionService();
