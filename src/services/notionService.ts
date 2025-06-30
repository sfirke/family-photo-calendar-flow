
import { NotionDatabase, NotionPage, NotionDatabaseResponse } from '@/types/notion';

const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

export class NotionService {
  /**
   * Extract database ID from various Notion URL formats
   */
  static extractDatabaseId(url: string): string | null {
    try {
      // Handle various Notion URL formats
      const patterns = [
        // Standard database URL: https://www.notion.so/DATABASE_ID?v=VIEW_ID
        /notion\.so\/([a-f0-9]{32})\?/,
        // Direct database ID in URL path
        /notion\.so\/.*-([a-f0-9]{32})$/,
        // Database ID with dashes
        /notion\.so\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/,
        // Clean database ID extraction
        /([a-f0-9]{32})/
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          let databaseId = match[1];
          // Remove dashes if present
          databaseId = databaseId.replace(/-/g, '');
          // Ensure it's 32 characters
          if (databaseId.length === 32) {
            return databaseId;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error extracting database ID:', error);
      return null;
    }
  }

  /**
   * Validate if a URL is a valid Notion database URL
   */
  static isValidNotionUrl(url: string): boolean {
    return url.includes('notion.so') && this.extractDatabaseId(url) !== null;
  }

  /**
   * Fetch database schema from Notion API
   */
  static async fetchDatabase(databaseId: string): Promise<NotionDatabase | null> {
    try {
      // Use CORS proxy to access Notion API
      const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`${NOTION_API_BASE}/databases/${databaseId}`)}`;
      
      const response = await fetch(proxyUrl, {
        headers: {
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch database: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        id: data.id,
        title: data.title?.[0]?.plain_text || 'Untitled Database',
        properties: data.properties || {},
        url: `https://www.notion.so/${databaseId}`
      };
    } catch (error) {
      console.error('Error fetching Notion database:', error);
      return null;
    }
  }

  /**
   * Fetch database entries from Notion API
   */
  static async fetchDatabaseEntries(databaseId: string, cursor?: string): Promise<NotionDatabaseResponse | null> {
    try {
      const url = `${NOTION_API_BASE}/databases/${databaseId}/query`;
      const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
      
      const body: any = {
        page_size: 100
      };
      
      if (cursor) {
        body.start_cursor = cursor;
      }

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch database entries: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        results: data.results || [],
        next_cursor: data.next_cursor || null,
        has_more: data.has_more || false
      };
    } catch (error) {
      console.error('Error fetching Notion database entries:', error);
      return null;
    }
  }

  /**
   * Convert Notion page to calendar event
   */
  static pageToEvent(page: NotionPage, calendar: any, propertyMappings?: any) {
    const props = page.properties;
    
    // Get title from various possible property types
    const getTitleText = (prop: any): string => {
      if (prop?.title?.[0]?.plain_text) return prop.title[0].plain_text;
      if (prop?.rich_text?.[0]?.plain_text) return prop.rich_text[0].plain_text;
      if (prop?.select?.name) return prop.select.name;
      return '';
    };

    // Get date from date property
    const getDateValue = (prop: any): Date => {
      if (prop?.date?.start) {
        return new Date(prop.date.start);
      }
      if (prop?.created_time) {
        return new Date(prop.created_time);
      }
      return new Date();
    };

    // Get text content from rich text properties
    const getTextContent = (prop: any): string => {
      if (prop?.rich_text?.[0]?.plain_text) return prop.rich_text[0].plain_text;
      if (prop?.title?.[0]?.plain_text) return prop.title[0].plain_text;
      return '';
    };

    // Find the best property for each field
    let title = 'Untitled Event';
    let eventDate = new Date();
    let description = '';
    let location = '';

    // Try to find title property
    for (const [key, value] of Object.entries(props)) {
      const keyLower = key.toLowerCase();
      if (keyLower.includes('title') || keyLower.includes('name')) {
        const titleText = getTitleText(value);
        if (titleText) {
          title = titleText;
          break;
        }
      }
    }

    // Try to find date property
    for (const [key, value] of Object.entries(props)) {
      const keyLower = key.toLowerCase();
      if (keyLower.includes('date') || keyLower.includes('time')) {
        const dateValue = getDateValue(value);
        if (dateValue) {
          eventDate = dateValue;
          break;
        }
      }
    }

    // Try to find description property
    for (const [key, value] of Object.entries(props)) {
      const keyLower = key.toLowerCase();
      if (keyLower.includes('description') || keyLower.includes('note') || keyLower.includes('detail')) {
        const descText = getTextContent(value);
        if (descText) {
          description = descText;
          break;
        }
      }
    }

    // Try to find location property
    for (const [key, value] of Object.entries(props)) {
      const keyLower = key.toLowerCase();
      if (keyLower.includes('location') || keyLower.includes('place') || keyLower.includes('venue')) {
        const locText = getTextContent(value);
        if (locText) {
          location = locText;
          break;
        }
      }
    }

    return {
      id: `notion_${page.id}`,
      title,
      time: 'All day',
      date: eventDate,
      location,
      attendees: 0,
      category: 'Personal' as const,
      color: calendar.color,
      description,
      organizer: calendar.name,
      calendarId: calendar.id,
      calendarName: calendar.name,
      source: 'notion' as const
    };
  }
}
