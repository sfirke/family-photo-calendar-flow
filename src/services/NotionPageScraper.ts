
import { NotionScrapedEvent, NotionPageMetadata } from '@/types/notion';

interface ScrapeResult {
  success: boolean;
  events: NotionScrapedEvent[];
  metadata: NotionPageMetadata;
  error?: string;
}

class NotionPageScraper {
  private readonly corsProxy = 'https://api.allorigins.win/get';

  async scrapePage(pageUrl: string): Promise<ScrapeResult> {
    try {
      const urlInfo = this.parseNotionUrl(pageUrl);
      if (!urlInfo) {
        return {
          success: false,
          events: [],
          metadata: {
            url: pageUrl,
            title: 'Invalid Notion URL',
            lastScraped: new Date(),
            eventCount: 0
          },
          error: 'Invalid Notion URL format'
        };
      }

      console.log('Fetching Notion page HTML:', pageUrl);

      // Fetch the HTML content of the public Notion page
      const proxyUrl = `${this.corsProxy}?url=${encodeURIComponent(pageUrl)}`;
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const proxyData = await response.json();
      
      if (!proxyData.contents) {
        throw new Error('No content received from proxy');
      }

      const htmlContent = proxyData.contents;
      console.log('Received HTML content, parsing for events...');

      // Parse HTML content for calendar events
      const parseResult = this.parseHtmlForEvents(htmlContent, pageUrl);
      
      return {
        success: true,
        events: parseResult.events,
        metadata: {
          url: pageUrl,
          title: parseResult.title,
          lastScraped: new Date(),
          eventCount: parseResult.events.length,
          databaseId: urlInfo.blockId,
          viewId: urlInfo.viewId
        }
      };

    } catch (error: any) {
      console.error('Error scraping Notion page:', error);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return {
          success: false,
          events: [],
          metadata: {
            url: pageUrl,
            title: 'Network Error',
            lastScraped: new Date(),
            eventCount: 0
          },
          error: 'Network error: Unable to access the Notion page. Please check your internet connection.'
        };
      }

      return {
        success: false,
        events: [],
        metadata: {
          url: pageUrl,
          title: 'Scrape Failed',
          lastScraped: new Date(),
          eventCount: 0
        },
        error: error.message || 'Failed to scrape Notion page'
      };
    }
  }

  private parseHtmlForEvents(htmlContent: string, sourceUrl: string): { events: NotionScrapedEvent[]; title: string } {
    const events: NotionScrapedEvent[] = [];
    let pageTitle = 'Notion Page';

    try {
      // Create a DOM parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      // Extract page title
      const titleElement = doc.querySelector('title');
      if (titleElement) {
        pageTitle = titleElement.textContent || 'Notion Page';
        // Clean up Notion's title format
        pageTitle = pageTitle.replace(' | Notion', '').trim();
      }

      console.log('Parsing HTML for events, page title:', pageTitle);

      // Look for various date patterns in the content
      const datePatterns = [
        // MM/DD/YYYY or MM-DD-YYYY
        /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/g,
        // DD/MM/YYYY (European format)
        /\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})\b/g,
        // Month DD, YYYY
        /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/gi,
        // Mon DD, YYYY (short month)
        /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})\b/gi,
        // YYYY-MM-DD (ISO format)
        /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g
      ];

      // Get all text content from the page
      const allText = doc.body ? doc.body.textContent || '' : htmlContent;
      const lines = allText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

      console.log('Found', lines.length, 'non-empty lines to process');

      // Process each line looking for events
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip very short lines or lines that are likely navigation/metadata
        if (line.length < 5 || this.isMetadataLine(line)) {
          continue;
        }

        // Check each date pattern
        for (const pattern of datePatterns) {
          pattern.lastIndex = 0; // Reset regex
          const matches = pattern.exec(line);
          
          if (matches) {
            const event = this.extractEventFromLine(line, matches, sourceUrl, events.length);
            if (event) {
              events.push(event);
              console.log('Found event:', event.title, 'on', event.date);
            }
            break; // Don't check other patterns for this line
          }
        }
      }

      // Also look for table-like structures (common in Notion databases)
      this.parseTableEvents(doc, sourceUrl, events);

      console.log('Total events found:', events.length);

    } catch (parseError) {
      console.error('Error parsing HTML content:', parseError);
      // Fallback to simple text parsing
      this.parseTextFallback(htmlContent, sourceUrl, events);
    }

    return { events, title: pageTitle };
  }

  private isMetadataLine(line: string): boolean {
    const metadataPatterns = [
      /^(created|updated|edited|last|modified)/i,
      /^(notion|workspace|template)/i,
      /^(share|export|duplicate)/i,
      /^\d+\s+(views?|comments?|likes?)/i
    ];
    
    return metadataPatterns.some(pattern => pattern.test(line));
  }

  private extractEventFromLine(line: string, dateMatch: RegExpExecArray, sourceUrl: string, index: number): NotionScrapedEvent | null {
    try {
      let date: Date;
      
      // Parse different date formats
      if (dateMatch[0].includes('/') || dateMatch[0].includes('-')) {
        // Handle MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD formats
        const parts = dateMatch[0].split(/[\/\-]/);
        if (parts.length === 3) {
          let year, month, day;
          
          if (parts[0].length === 4) {
            // YYYY-MM-DD format
            year = parseInt(parts[0]);
            month = parseInt(parts[1]) - 1; // JS months are 0-indexed
            day = parseInt(parts[2]);
          } else {
            // MM/DD/YYYY or DD/MM/YYYY - assume MM/DD for US format
            month = parseInt(parts[0]) - 1;
            day = parseInt(parts[1]);
            year = parseInt(parts[2]);
            
            // Handle 2-digit years
            if (year < 100) {
              year += 2000;
            }
          }
          
          date = new Date(year, month, day);
        } else {
          return null;
        }
      } else if (dateMatch[1] && isNaN(Number(dateMatch[1]))) {
        // Month name format
        const monthName = dateMatch[1];
        const day = parseInt(dateMatch[2]);
        const year = parseInt(dateMatch[3]);
        
        const monthIndex = this.getMonthIndex(monthName);
        if (monthIndex === -1) return null;
        
        date = new Date(year, monthIndex, day);
      } else {
        return null;
      }

      // Validate date
      if (isNaN(date.getTime())) {
        return null;
      }

      // Extract title (remove the date from the line)
      let title = line.replace(dateMatch[0], '').trim();
      
      // Clean up common separators and artifacts
      title = title.replace(/^[\-\:\|\•\*\#]+\s*/, '').trim();
      title = title.replace(/\s*[\-\:\|]+\s*$/, '').trim();
      
      // If title is empty or too short, use a default
      if (!title || title.length < 2) {
        title = 'Event';
      }

      // Extract time if present in the line
      const timeMatch = line.match(/\b(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?\b/);
      let time = 'All day';
      
      if (timeMatch) {
        time = timeMatch[0];
        // Remove time from title to clean it up
        title = title.replace(timeMatch[0], '').trim();
      }

      return {
        id: `scraped_${Date.now()}_${index}`,
        title: title,
        date: date,
        time: time,
        description: '',
        location: '',
        properties: {},
        sourceUrl: sourceUrl,
        scrapedAt: new Date(),
        calendarId: this.extractCalendarIdFromUrl(sourceUrl)
      };

    } catch (error) {
      console.error('Error extracting event from line:', line, error);
      return null;
    }
  }

  private parseTableEvents(doc: Document, sourceUrl: string, events: NotionScrapedEvent[]): void {
    // Look for table structures that might contain events
    const tables = doc.querySelectorAll('table');
    
    tables.forEach((table, tableIndex) => {
      const rows = table.querySelectorAll('tr');
      
      rows.forEach((row, rowIndex) => {
        if (rowIndex === 0) return; // Skip header row
        
        const cells = row.querySelectorAll('td, th');
        if (cells.length < 2) return;
        
        const rowText = Array.from(cells).map(cell => cell.textContent || '').join(' ').trim();
        
        // Try to find dates in the row
        const datePattern = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/;
        const dateMatch = datePattern.exec(rowText);
        
        if (dateMatch) {
          const event = this.extractEventFromLine(rowText, dateMatch, sourceUrl, events.length);
          if (event) {
            events.push(event);
          }
        }
      });
    });
  }

  private parseTextFallback(htmlContent: string, sourceUrl: string, events: NotionScrapedEvent[]): void {
    // Simple fallback text parsing
    const datePattern = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/g;
    let match;
    
    while ((match = datePattern.exec(htmlContent)) !== null) {
      const contextStart = Math.max(0, match.index - 50);
      const contextEnd = Math.min(htmlContent.length, match.index + 100);
      const context = htmlContent.substring(contextStart, contextEnd).trim();
      
      const event = this.extractEventFromLine(context, match, sourceUrl, events.length);
      if (event) {
        events.push(event);
      }
    }
  }

  private getMonthIndex(monthName: string): number {
    const months = {
      'january': 0, 'jan': 0,
      'february': 1, 'feb': 1,
      'march': 2, 'mar': 2,
      'april': 3, 'apr': 3,
      'may': 4,
      'june': 5, 'jun': 5,
      'july': 6, 'jul': 6,
      'august': 7, 'aug': 7,
      'september': 8, 'sep': 8,
      'october': 9, 'oct': 9,
      'november': 10, 'nov': 10,
      'december': 11, 'dec': 11
    };
    
    return months[monthName.toLowerCase()] ?? -1;
  }

  private extractCalendarIdFromUrl(url: string): string {
    const urlInfo = this.parseNotionUrl(url);
    return urlInfo?.blockId || 'scraped_calendar';
  }

  parseNotionUrl(url: string): { blockId: string; viewId?: string } | null {
    try {
      const urlParts = url.split('?')[0].split('/');
      const lastPart = urlParts[urlParts.length - 1];
      let blockId = lastPart.split('-').pop() as string;

      console.log('Parsing Notion URL:', url);
      console.log('Extracted blockId:', blockId);

      // Handle both UUID formats: with dashes and without dashes
      if (blockId.length === 32 && /^[0-9a-fA-F]{32}$/.test(blockId)) {
        // Convert 32-character hex string to UUID format with dashes
        blockId = [
          blockId.substring(0, 8),
          blockId.substring(8, 12),
          blockId.substring(12, 16),
          blockId.substring(16, 20),
          blockId.substring(20, 32)
        ].join('-');
        console.log('Normalized blockId to UUID format:', blockId);
      }

      // Validate UUID format (with dashes)
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i;
      if (!uuidRegex.test(blockId)) {
        console.warn('Invalid block ID format after normalization:', blockId);
        return null;
      }

      // Extract viewId if present
      const viewIdMatch = url.match(/v=([a-f0-9]+)/i);
      const viewId = viewIdMatch ? viewIdMatch[1] : undefined;

      console.log('Successfully parsed Notion URL - blockId:', blockId, 'viewId:', viewId);
      return { blockId, viewId };
    } catch (error) {
      console.error('Error parsing Notion URL:', error);
      return null;
    }
  }
}

export const notionPageScraper = new NotionPageScraper();

// Export the interfaces for use in other files
export { NotionScrapedEvent, NotionPageMetadata };
