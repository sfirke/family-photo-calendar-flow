
import { Client } from '@notionhq/client';

export interface NotionScrapedEvent {
  id: string;
  title: string;
  date: Date;
  time?: string;
  description?: string;
  location?: string;
  properties: Record<string, any>;
  sourceUrl: string;
  scrapedAt: Date;
  calendarId?: string;
}

export interface NotionPageMetadata {
  url: string;
  title: string;
  lastScraped: Date;
  eventCount: number;
  databaseId?: string;
  viewId?: string;
}

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

      // Try to fetch the public page using CORS proxy
      const notionApiUrl = `https://api.notion.com/v1/blocks/${urlInfo.blockId}/children?page_size=100`;
      const proxyUrl = `${this.corsProxy}?url=${encodeURIComponent(notionApiUrl)}`;
      
      console.log('Fetching Notion page via CORS proxy:', proxyUrl);

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
      
      // Check if we got a valid response
      if (!proxyData.contents) {
        throw new Error('No content received from proxy');
      }

      let pageData;
      try {
        pageData = JSON.parse(proxyData.contents);
      } catch (parseError) {
        // If we can't parse the response, it might be because the page requires authentication
        // or is not publicly accessible. Let's try a fallback approach.
        console.warn('Failed to parse Notion API response, trying fallback validation');
        return this.fallbackValidation(pageUrl, urlInfo);
      }

      // Check if the response indicates an error
      if (pageData.object === 'error') {
        throw new Error(pageData.message || 'Notion API error');
      }

      // Extract title from the first block or use a default
      let pageTitle = 'Notion Page';
      if (pageData.results && pageData.results.length > 0) {
        const firstBlock = pageData.results[0];
        if (firstBlock.type === 'heading_1') {
          pageTitle = firstBlock.heading_1.rich_text.map((text: any) => text.plain_text).join('');
        }
      }

      const events: NotionScrapedEvent[] = [];
      let eventCount = 0;

      // Iterate through blocks and extract event details
      if (pageData.results) {
        for (const block of pageData.results) {
          if (!block.type) continue;

          try {
            if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
              const listItem = block[block.type];
              const textContent = listItem.rich_text.map((text: any) => text.plain_text).join('');

              // Use regex to extract date and title
              const dateRegex = /(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})/;
              const dateMatch = textContent.match(dateRegex);

              if (dateMatch) {
                const dateStr = dateMatch[0];
                const title = textContent.replace(dateRegex, '').trim();

                // Parse date
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                  events.push({
                    id: `scraped_${events.length + 1}`,
                    title: title || 'Untitled Event',
                    date: date,
                    time: 'All day',
                    description: '',
                    location: '',
                    properties: {},
                    sourceUrl: pageUrl,
                    scrapedAt: new Date(),
                    calendarId: urlInfo.blockId
                  });
                  eventCount++;
                }
              }
            }
          } catch (blockError) {
            console.error('Error processing block:', block, blockError);
          }
        }
      }

      return {
        success: true,
        events: events,
        metadata: {
          url: pageUrl,
          title: pageTitle,
          lastScraped: new Date(),
          eventCount: eventCount,
          databaseId: urlInfo.blockId,
          viewId: urlInfo.viewId
        }
      };
    } catch (error: any) {
      console.error('Error scraping Notion page:', error);
      
      // Check if this is a network/CORS error and provide helpful feedback
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

  private async fallbackValidation(pageUrl: string, urlInfo: { blockId: string; viewId?: string }): Promise<ScrapeResult> {
    // If we can't access the Notion API, at least validate that the URL format is correct
    // and return a success response indicating the URL is valid but we couldn't fetch content
    console.log('Using fallback validation for URL:', pageUrl);
    
    return {
      success: true,
      events: [],
      metadata: {
        url: pageUrl,
        title: 'Valid Notion Page (Content not accessible)',
        lastScraped: new Date(),
        eventCount: 0,
        databaseId: urlInfo.blockId,
        viewId: urlInfo.viewId
      }
    };
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
