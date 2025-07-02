
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

      const notion = new Client({}); // No token needed for public pages

      // Fetch the page content as a block array
      const page = await notion.blocks.children.list({
        block_id: urlInfo.blockId,
        page_size: 100
      });

      // Extract title from the first block
      let pageTitle = 'Untitled';
      if (page.results.length > 0 && 'type' in page.results[0]) {
        const firstBlock = page.results[0] as any;
        if (firstBlock.type === 'heading_1') {
          pageTitle = firstBlock.heading_1.rich_text.map((text: any) => text.plain_text).join('');
        }
      }

      const events: NotionScrapedEvent[] = [];
      let eventCount = 0;

      // Iterate through blocks and extract event details
      for (const block of page.results) {
        if (!('type' in block)) continue;

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
