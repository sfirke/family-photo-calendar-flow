import { NotionScrapedEvent, NotionPageMetadata } from '@/types/notion';
import { notionTableParser, NotionDebugResult } from './NotionTableParser';

interface ScrapeResult {
  success: boolean;
  events: NotionScrapedEvent[];
  metadata: NotionPageMetadata;
  error?: string;
}

interface DebugScrapeResult extends ScrapeResult {
  debugInfo?: Record<string, any>;
}

class NotionPageScraper {
  private readonly corsProxy = 'https://api.allorigins.win/get';
  private readonly DOM_LOAD_DELAY = 20000; // 20 seconds

  async scrapePage(pageUrl: string): Promise<ScrapeResult> {
    return this.scrapeWithOptions(pageUrl, { debug: false });
  }

  async scrapePageWithDebug(pageUrl: string): Promise<DebugScrapeResult> {
    return this.scrapeWithOptions(pageUrl, { debug: true });
  }

  private async scrapeWithOptions(pageUrl: string, options: { debug: boolean }): Promise<DebugScrapeResult> {
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

      console.log('🔍 Fetching Notion page HTML:', pageUrl);

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
      console.log('📄 Received HTML content, waiting for DOM to finish loading...');

      // Wait for DOM to fully load before parsing
      await this.waitForDOMLoad();

      if (options.debug) {
        console.log('🐛 DEBUG MODE: Parsing with enhanced debug information...');
      } else {
        console.log('📊 DOM loading complete, parsing with enhanced table parser...');
      }

      // Use enhanced table parser with or without debug
      const parseResult = this.parseHtmlForStructuredEvents(htmlContent, pageUrl, options.debug);
      
      const result: DebugScrapeResult = {
        success: true,
        events: parseResult.events,
        metadata: {
          url: pageUrl,
          title: parseResult.title,
          lastScraped: new Date(),
          eventCount: parseResult.events.length,
          databaseId: urlInfo.blockId,
          viewId: urlInfo.viewId,
          columnMappings: parseResult.columnMappings,
          viewType: parseResult.metadata.viewType
        }
      };

      if (options.debug && 'debugInfo' in parseResult) {
        result.debugInfo = parseResult.debugInfo;
        console.log('🐛 DEBUG INFO:', result.debugInfo);
      }

      return result;

    } catch (error: unknown) {
      console.error('❌ Error scraping Notion page:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
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
        error: errorMessage
      };
    }
  }

  private async waitForDOMLoad(): Promise<void> {
    console.log(`⏳ Waiting ${this.DOM_LOAD_DELAY / 1000} seconds for DOM to fully load...`);
    return new Promise(resolve => setTimeout(resolve, this.DOM_LOAD_DELAY));
  }

  private parseHtmlForStructuredEvents(htmlContent: string, sourceUrl: string, debug: boolean = false): {
    events: NotionScrapedEvent[];
    title: string;
    columnMappings: Record<string, any>;
    metadata: any;
    debugInfo?: Record<string, any>;
  } {
    let pageTitle = 'Notion Page';

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      // Extract page title
      const titleElement = doc.querySelector('title');
      if (titleElement) {
        pageTitle = titleElement.textContent || 'Notion Page';
        pageTitle = pageTitle.replace(' | Notion', '').trim();
      }

      console.log('📊 Parsing structured table data for page:', pageTitle);

      // Use enhanced table parser with debug mode if requested
      let parseResult;
      if (debug) {
        parseResult = notionTableParser.parseWithDebug(doc, sourceUrl);
        console.log(`🐛 DEBUG: Successfully parsed ${parseResult.events.length} events from ${parseResult.metadata.viewType} view`);
      } else {
        parseResult = notionTableParser.parseTableStructure(doc, sourceUrl);
        console.log(`✅ Successfully parsed ${parseResult.events.length} events from ${parseResult.metadata.viewType} view`);
      }
      
      console.log(`📋 Column mappings:`, parseResult.columnMappings);

      // Fallback to legacy parsing if no structured events found
      if (parseResult.events.length === 0) {
        console.log('🔄 No structured events found, trying legacy text parsing...');
        const legacyEvents = this.legacyTextParsing(htmlContent, sourceUrl);
        parseResult.events.push(...legacyEvents);
      }

      return {
        events: parseResult.events,
        title: pageTitle,
        columnMappings: parseResult.columnMappings,
        metadata: parseResult.metadata,
        ...(debug && 'debugInfo' in parseResult ? { debugInfo: parseResult.debugInfo } : {})
      };

    } catch (parseError) {
      console.error('❌ Error in structured parsing:', parseError);
      
      // Fallback to legacy parsing
      const legacyEvents = this.legacyTextParsing(htmlContent, sourceUrl);
      
      return {
        events: legacyEvents,
        title: pageTitle,
        columnMappings: {},
        metadata: {
          totalRows: 0,
          successfullyParsed: legacyEvents.length,
          viewType: 'legacy-fallback'
        }
      };
    }
  }

  private legacyTextParsing(htmlContent: string, sourceUrl: string): NotionScrapedEvent[] {
    const events: NotionScrapedEvent[] = [];
    
    // Simple fallback parsing for basic date patterns
    const datePattern = /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/g;
    let match;
    let eventIndex = 0;
    
    while ((match = datePattern.exec(htmlContent)) !== null && eventIndex < 50) {
      const contextStart = Math.max(0, match.index - 100);
      const contextEnd = Math.min(htmlContent.length, match.index + 200);
      const context = htmlContent.substring(contextStart, contextEnd).trim();
      
      // Clean up HTML tags from context
      const cleanContext = context.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      
      if (cleanContext.length > 10) {
        const parts = match[0].split(/[/-]/);
        let year;
        
        if (parts[2].length === 2) {
          year = 2000 + parseInt(parts[2]);
        } else {
          year = parseInt(parts[2]);
        }
        const month = parseInt(parts[0]) - 1; // JS months are 0-indexed
        const day = parseInt(parts[1]);
        
        const date = new Date(year, month, day);
        
        if (!isNaN(date.getTime())) {
          // Extract title from context
          let title = cleanContext.replace(match[0], '').trim();
          title = title.split('.')[0].split('!')[0].split('?')[0].trim();
          if (title.length > 50) {
            title = title.substring(0, 50) + '...';
          }
          if (title.length < 3) {
            title = 'Event';
          }
          
          events.push({
            id: `legacy_${Date.now()}_${eventIndex}`,
            title,
            date,
            time: 'All day',
            description: '',
            location: '',
            properties: { context: cleanContext },
            sourceUrl,
            scrapedAt: new Date(),
            calendarId: this.extractCalendarIdFromUrl(sourceUrl)
          });
          
          eventIndex++;
        }
      }
    }
    
    console.log(`📝 Legacy parsing found ${events.length} events`);
    return events;
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

      console.log('🔗 Parsing Notion URL:', url);
      console.log('🆔 Extracted blockId:', blockId);

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
        console.log('🔄 Normalized blockId to UUID format:', blockId);
      }

      // Validate UUID format (with dashes)
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i;
      if (!uuidRegex.test(blockId)) {
        console.warn('⚠️  Invalid block ID format after normalization:', blockId);
        return null;
      }

      // Extract viewId if present
      const viewIdMatch = url.match(/v=([a-f0-9]+)/i);
      const viewId = viewIdMatch ? viewIdMatch[1] : undefined;

      console.log('✅ Successfully parsed Notion URL - blockId:', blockId, 'viewId:', viewId);
      return { blockId, viewId };
    } catch (error) {
      console.error('❌ Error parsing Notion URL:', error);
      return null;
    }
  }
}

export const notionPageScraper = new NotionPageScraper();

// Export the interfaces for use in other files
export type { NotionScrapedEvent, NotionPageMetadata };
