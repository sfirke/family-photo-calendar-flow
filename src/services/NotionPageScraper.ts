/**
 * Notion Page Scraper Service
 * 
 * Handles fetching and parsing public Notion database pages to extract calendar events.
 */

import { NotionScrapedEvent, NotionPageMetadata } from '@/types/notion';

export interface ScrapingResult {
  success: boolean;
  events: NotionScrapedEvent[];
  metadata: NotionPageMetadata;
  error?: string;
}

export class NotionPageScraper {
  private readonly corsProxy = 'https://api.allorigins.win/get';

  /**
   * Extract database and view IDs from Notion URL
   */
  parseNotionUrl(url: string): { databaseId: string; viewId?: string; cleanUrl: string } | null {
    try {
      const urlObj = new URL(url);
      
      // Extract database ID from path
      const pathMatch = urlObj.pathname.match(/\/([a-f0-9]{32})/);
      if (!pathMatch) return null;
      
      const databaseId = pathMatch[1];
      
      // Extract view ID from query params
      const viewId = urlObj.searchParams.get('v');
      
      // Create clean URL without extra params
      const cleanUrl = `${urlObj.origin}${urlObj.pathname}${viewId ? `?v=${viewId}` : ''}`;
      
      return { databaseId, viewId: viewId || undefined, cleanUrl };
    } catch (error) {
      console.error('Error parsing Notion URL:', error);
      return null;
    }
  }

  /**
   * Fetch HTML content from public Notion page
   */
  private async fetchPageHtml(url: string): Promise<string> {
    const proxyUrl = `${this.corsProxy}?url=${encodeURIComponent(url)}`;
    
    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.contents;
    } catch (error) {
      console.error('Failed to fetch Notion page:', error);
      throw new Error(`Failed to fetch page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse HTML and extract event data
   */
  private parseEventsFromHtml(html: string, sourceUrl: string, calendarId: string): NotionScrapedEvent[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const events: NotionScrapedEvent[] = [];

    try {
      // Look for Notion database rows
      const rows = doc.querySelectorAll('[data-block-id]');
      
      rows.forEach((row, index) => {
        try {
          const event = this.extractEventFromRow(row as Element, sourceUrl, index, calendarId);
          if (event) {
            events.push(event);
          }
        } catch (error) {
          console.warn('Failed to parse row:', error);
        }
      });

      // Fallback: look for table rows if database view not found
      if (events.length === 0) {
        const tableRows = doc.querySelectorAll('tr');
        tableRows.forEach((row, index) => {
          try {
            const event = this.extractEventFromTableRow(row as Element, sourceUrl, index, calendarId);
            if (event) {
              events.push(event);
            }
          } catch (error) {
            console.warn('Failed to parse table row:', error);
          }
        });
      }

    } catch (error) {
      console.error('Error parsing HTML:', error);
    }

    return events;
  }

  /**
   * Extract event data from a Notion database row
   */
  private extractEventFromRow(row: Element, sourceUrl: string, index: number, calendarId: string): NotionScrapedEvent | null {
    try {
      // Look for title/name in various possible selectors
      const titleSelectors = [
        '[data-content-editable-leaf="true"]',
        '.notion-page-block',
        '[role="button"]',
        'a[href*="/"]'
      ];
      
      let title = '';
      for (const selector of titleSelectors) {
        const titleElement = row.querySelector(selector);
        if (titleElement?.textContent?.trim()) {
          title = titleElement.textContent.trim();
          break;
        }
      }

      if (!title) return null;

      // Look for date information
      const dateSelectors = [
        'time',
        '[data-value*="-"]',
        '.notion-property-date',
        'span[title*="202"]'
      ];

      let date = new Date();
      let time: string | undefined;

      for (const selector of dateSelectors) {
        const dateElement = row.querySelector(selector);
        if (dateElement) {
          const dateText = dateElement.textContent?.trim() || dateElement.getAttribute('title') || dateElement.getAttribute('data-value');
          if (dateText) {
            const parsedDate = this.parseDate(dateText);
            if (parsedDate) {
              date = parsedDate.date;
              time = parsedDate.time;
              break;
            }
          }
        }
      }

      // Extract other properties
      const properties: Record<string, any> = {};
      const allSpans = row.querySelectorAll('span, div');
      
      allSpans.forEach(element => {
        const text = element.textContent?.trim();
        if (text && text.length > 0 && text !== title) {
          // Try to categorize the content
          if (text.includes('@') || text.toLowerCase().includes('location')) {
            properties.location = text;
          } else if (text.length > 50) {
            properties.description = text;
          }
        }
      });

      return {
        id: `scraped_${Date.now()}_${index}`,
        title,
        date,
        time,
        description: properties.description,
        location: properties.location,
        properties,
        sourceUrl,
        scrapedAt: new Date(),
        calendarId // Include the required calendarId
      };
    } catch (error) {
      console.error('Error extracting event from row:', error);
      return null;
    }
  }

  /**
   * Extract event data from a table row (fallback method)
   */
  private extractEventFromTableRow(row: Element, sourceUrl: string, index: number, calendarId: string): NotionScrapedEvent | null {
    const cells = row.querySelectorAll('td, th');
    if (cells.length < 2) return null;

    try {
      const title = cells[0]?.textContent?.trim() || `Event ${index + 1}`;
      const dateText = cells[1]?.textContent?.trim();
      
      if (!dateText) return null;

      const parsedDate = this.parseDate(dateText);
      if (!parsedDate) return null;

      const properties: Record<string, any> = {};
      
      // Extract additional columns
      for (let i = 2; i < cells.length; i++) {
        const cellText = cells[i]?.textContent?.trim();
        if (cellText) {
          properties[`column_${i}`] = cellText;
        }
      }

      return {
        id: `scraped_table_${Date.now()}_${index}`,
        title,
        date: parsedDate.date,
        time: parsedDate.time,
        properties,
        sourceUrl,
        scrapedAt: new Date(),
        calendarId // Include the required calendarId
      };
    } catch (error) {
      console.error('Error extracting event from table row:', error);
      return null;
    }
  }

  /**
   * Parse date string into Date object and optional time
   */
  private parseDate(dateString: string): { date: Date; time?: string } | null {
    try {
      // Clean the date string
      const cleaned = dateString.replace(/[^\d\-\/:\s]/g, '').trim();
      
      // Try different date formats
      const formats = [
        /(\d{4})-(\d{1,2})-(\d{1,2})/,  // YYYY-MM-DD
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
        /(\d{1,2})-(\d{1,2})-(\d{4})/   // MM-DD-YYYY
      ];

      let date: Date | null = null;
      let time: string | undefined;

      for (const format of formats) {
        const match = cleaned.match(format);
        if (match) {
          if (format === formats[0]) {
            // YYYY-MM-DD
            date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
          } else {
            // MM/DD/YYYY or MM-DD-YYYY
            date = new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
          }
          break;
        }
      }

      if (!date || isNaN(date.getTime())) {
        // Fallback to native Date parsing
        date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return null;
        }
      }

      // Look for time information
      const timeMatch = dateString.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
      }

      return { date, time };
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return null;
    }
  }

  /**
   * Main method to scrape a Notion page for events
   */
  async scrapePage(url: string, calendarId: string = 'default'): Promise<ScrapingResult> {
    try {
      console.log('🔍 Scraping Notion page:', url);

      // Parse URL to extract IDs
      const urlInfo = this.parseNotionUrl(url);
      if (!urlInfo) {
        throw new Error('Invalid Notion URL format');
      }

      // Fetch HTML content
      const html = await this.fetchPageHtml(urlInfo.cleanUrl);
      
      // Parse events from HTML
      const events = this.parseEventsFromHtml(html, url, calendarId);
      
      // Create metadata
      const metadata: NotionPageMetadata = {
        url: urlInfo.cleanUrl,
        title: `Notion Database ${urlInfo.databaseId.slice(0, 8)}...`,
        lastScraped: new Date(),
        eventCount: events.length,
        databaseId: urlInfo.databaseId,
        viewId: urlInfo.viewId
      };

      console.log(`✅ Successfully scraped ${events.length} events from Notion page`);

      return {
        success: true,
        events,
        metadata,
      };
    } catch (error) {
      console.error('❌ Failed to scrape Notion page:', error);
      
      return {
        success: false,
        events: [],
        metadata: {
          url,
          title: 'Failed to load',
          lastScraped: new Date(),
          eventCount: 0
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const notionPageScraper = new NotionPageScraper();
