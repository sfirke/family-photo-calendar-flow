
import { NotionScrapedEvent, NotionColumnMapping } from '@/types/notion';

interface ParsedTableStructure {
  headers: string[];
  rows: string[][];
  columnMappings: NotionColumnMapping;
}

interface TableParseResult {
  events: NotionScrapedEvent[];
  columnMappings: NotionColumnMapping;
  metadata: {
    totalRows: number;
    successfullyParsed: number;
    viewType: string;
  };
}

export class NotionTableParser {
  private readonly notionSelectors = {
    // Notion-specific CSS selectors for database views
    databaseView: '[data-block-id] .notion-table-view, .notion-board-view, .notion-calendar-view',
    tableContainer: '.notion-table-view',
    tableHeader: '.notion-table-view .notion-table-header',
    tableRows: '.notion-table-view .notion-table-row',
    tableCells: '.notion-table-cell, .notion-selectable',
    boardView: '.notion-board-view',
    boardColumns: '.notion-board-column',
    boardCards: '.notion-board-item',
    // Fallback generic selectors
    genericTable: 'table',
    genericHeader: 'thead tr th, table tr:first-child td',
    genericRows: 'tbody tr, table tr:not(:first-child)',
    genericCells: 'td, th'
  };

  parseTableStructure(doc: Document, sourceUrl: string): TableParseResult {
    console.log('🔍 Starting enhanced table structure parsing');
    
    // Try Notion-specific parsing first
    let parseResult = this.parseNotionDatabase(doc, sourceUrl);
    
    // Fallback to generic table parsing
    if (!parseResult || parseResult.events.length === 0) {
      console.log('📋 Falling back to generic table parsing');
      parseResult = this.parseGenericTable(doc, sourceUrl);
    }

    return parseResult || {
      events: [],
      columnMappings: {},
      metadata: {
        totalRows: 0,
        successfullyParsed: 0,
        viewType: 'unknown'
      }
    };
  }

  private parseNotionDatabase(doc: Document, sourceUrl: string): TableParseResult | null {
    // Try to find Notion table view first
    const tableView = doc.querySelector(this.notionSelectors.tableContainer);
    if (tableView) {
      console.log('📊 Found Notion table view');
      return this.parseNotionTableView(tableView, sourceUrl);
    }

    // Try board view
    const boardView = doc.querySelector(this.notionSelectors.boardView);
    if (boardView) {
      console.log('📋 Found Notion board view');
      return this.parseNotionBoardView(boardView, sourceUrl);
    }

    return null;
  }

  private parseNotionTableView(tableContainer: Element, sourceUrl: string): TableParseResult {
    const events: NotionScrapedEvent[] = [];
    
    // Extract headers from table
    const headerElements = tableContainer.querySelectorAll(this.notionSelectors.tableHeader + ' > *');
    const headers = Array.from(headerElements).map(el => 
      (el.textContent || '').trim().toLowerCase()
    ).filter(header => header.length > 0);

    console.log('📋 Found table headers:', headers);

    // Create column mappings based on header content
    const columnMappings = this.createColumnMappings(headers);

    // Extract rows
    const rowElements = tableContainer.querySelectorAll(this.notionSelectors.tableRows);
    console.log(`📊 Processing ${rowElements.length} table rows`);

    rowElements.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll(this.notionSelectors.tableCells);
      const cellData = Array.from(cells).map(cell => (cell.textContent || '').trim());
      
      if (cellData.length > 0) {
        const event = this.createEventFromRowData(cellData, headers, columnMappings, sourceUrl, rowIndex);
        if (event) {
          events.push(event);
        }
      }
    });

    return {
      events,
      columnMappings,
      metadata: {
        totalRows: rowElements.length,
        successfullyParsed: events.length,
        viewType: 'table'
      }
    };
  }

  private parseNotionBoardView(boardContainer: Element, sourceUrl: string): TableParseResult {
    const events: NotionScrapedEvent[] = [];
    const columnMappings: NotionColumnMapping = {};

    // Board view parsing - each card represents an event
    const cards = boardContainer.querySelectorAll(this.notionSelectors.boardCards);
    console.log(`📋 Processing ${cards.length} board cards`);

    cards.forEach((card, cardIndex) => {
      const event = this.createEventFromBoardCard(card, sourceUrl, cardIndex);
      if (event) {
        events.push(event);
      }
    });

    return {
      events,
      columnMappings,
      metadata: {
        totalRows: cards.length,
        successfullyParsed: events.length,
        viewType: 'board'
      }
    };
  }

  private parseGenericTable(doc: Document, sourceUrl: string): TableParseResult {
    const events: NotionScrapedEvent[] = [];
    const tables = doc.querySelectorAll(this.notionSelectors.genericTable);
    
    if (tables.length === 0) {
      return {
        events: [],
        columnMappings: {},
        metadata: { totalRows: 0, successfullyParsed: 0, viewType: 'none' }
      };
    }

    console.log(`📊 Found ${tables.length} generic tables`);

    // Process the first table (most likely to contain events)
    const table = tables[0];
    const headerElements = table.querySelectorAll(this.notionSelectors.genericHeader);
    const headers = Array.from(headerElements).map(el => 
      (el.textContent || '').trim().toLowerCase()
    );

    const columnMappings = this.createColumnMappings(headers);
    const rows = table.querySelectorAll(this.notionSelectors.genericRows);

    rows.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll(this.notionSelectors.genericCells);
      const cellData = Array.from(cells).map(cell => (cell.textContent || '').trim());
      
      const event = this.createEventFromRowData(cellData, headers, columnMappings, sourceUrl, rowIndex);
      if (event) {
        events.push(event);
      }
    });

    return {
      events,
      columnMappings,
      metadata: {
        totalRows: rows.length,
        successfullyParsed: events.length,
        viewType: 'generic-table'
      }
    };
  }

  private createColumnMappings(headers: string[]): NotionColumnMapping {
    const mappings: NotionColumnMapping = {};

    headers.forEach((header, index) => {
      const lowerHeader = header.toLowerCase();
      
      // Map common column names to types
      if (this.isDateColumn(lowerHeader)) {
        mappings[header] = { type: 'date', propertyName: 'date' };
      } else if (this.isTitleColumn(lowerHeader)) {
        mappings[header] = { type: 'title', propertyName: 'title' };
      } else if (this.isStatusColumn(lowerHeader)) {
        mappings[header] = { type: 'status', propertyName: 'status' };
      } else if (this.isLocationColumn(lowerHeader)) {
        mappings[header] = { type: 'location', propertyName: 'location' };
      } else if (this.isCategoryColumn(lowerHeader)) {
        mappings[header] = { type: 'category', propertyName: 'categories' };
      } else if (this.isDescriptionColumn(lowerHeader)) {
        mappings[header] = { type: 'description', propertyName: 'description' };
      } else if (this.isTimeColumn(lowerHeader)) {
        mappings[header] = { type: 'time', propertyName: 'time' };
      } else if (this.isPriorityColumn(lowerHeader)) {
        mappings[header] = { type: 'priority', propertyName: 'priority' };
      } else {
        mappings[header] = { type: 'custom', propertyName: `custom_${index}` };
      }
    });

    return mappings;
  }

  private createEventFromRowData(
    cellData: string[], 
    headers: string[], 
    columnMappings: NotionColumnMapping, 
    sourceUrl: string, 
    rowIndex: number
  ): NotionScrapedEvent | null {
    let eventData: Partial<NotionScrapedEvent> = {
      id: `scraped_${Date.now()}_${rowIndex}`,
      sourceUrl,
      scrapedAt: new Date(),
      calendarId: this.extractCalendarIdFromUrl(sourceUrl),
      properties: {},
      customProperties: {}
    };

    // Process each cell according to column mapping
    for (let i = 0; i < Math.min(cellData.length, headers.length); i++) {
      const cellValue = cellData[i];
      const header = headers[i];
      const mapping = columnMappings[header];

      if (!mapping || !cellValue) continue;

      switch (mapping.type) {
        case 'date':
          const parsedDate = this.parseEnhancedDate(cellValue);
          if (parsedDate) {
            eventData.date = parsedDate.date;
            if (parsedDate.time) eventData.time = parsedDate.time;
            if (parsedDate.endDate) {
              eventData.dateRange = {
                startDate: parsedDate.date,
                endDate: parsedDate.endDate
              };
            }
          }
          break;
        case 'title':
          eventData.title = cellValue;
          break;
        case 'status':
          eventData.status = cellValue.toLowerCase();
          break;
        case 'location':
          eventData.location = cellValue;
          break;
        case 'category':
          eventData.categories = cellValue.split(',').map(cat => cat.trim());
          break;
        case 'description':
          eventData.description = cellValue;
          break;
        case 'time':
          if (!eventData.time) eventData.time = cellValue;
          break;
        case 'priority':
          eventData.priority = cellValue.toLowerCase();
          break;
        case 'custom':
          eventData.customProperties![mapping.propertyName] = cellValue;
          break;
      }

      // Store original property
      eventData.properties![header] = cellValue;
    }

    // Validate required fields
    if (!eventData.date || !eventData.title) {
      console.log(`⚠️  Skipping row ${rowIndex}: missing required date or title`);
      return null;
    }

    // Set defaults
    eventData.time = eventData.time || 'All day';
    eventData.description = eventData.description || '';
    eventData.location = eventData.location || '';
    eventData.categories = eventData.categories || [];

    return eventData as NotionScrapedEvent;
  }

  private createEventFromBoardCard(card: Element, sourceUrl: string, cardIndex: number): NotionScrapedEvent | null {
    const title = card.querySelector('.notion-selectable')?.textContent?.trim();
    if (!title) return null;

    // Extract properties from card content
    const cardText = card.textContent || '';
    const dateMatch = this.parseEnhancedDate(cardText);
    
    if (!dateMatch) return null;

    return {
      id: `scraped_board_${Date.now()}_${cardIndex}`,
      title,
      date: dateMatch.date,
      time: dateMatch.time || 'All day',
      description: '',
      location: '',
      properties: { originalText: cardText },
      sourceUrl,
      scrapedAt: new Date(),
      calendarId: this.extractCalendarIdFromUrl(sourceUrl)
    };
  }

  private parseEnhancedDate(dateText: string): { date: Date; time?: string; endDate?: Date } | null {
    // Enhanced date parsing for various formats
    const datePatterns = [
      // ISO format: 2024-01-15
      /(\d{4})-(\d{1,2})-(\d{1,2})/,
      // US format: 01/15/2024 or 1/15/2024
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      // European format: 15.01.2024
      /(\d{1,2})\.(\d{1,2})\.(\d{4})/,
      // Long format: January 15, 2024
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i,
      // Short format: Jan 15, 2024
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/i
    ];

    // Time pattern
    const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/;

    for (const pattern of datePatterns) {
      const match = dateText.match(pattern);
      if (match) {
        let date: Date;
        
        if (pattern.source.includes('January|February')) {
          // Month name format
          const monthIndex = this.getMonthIndex(match[1]);
          const day = parseInt(match[2]);
          const year = parseInt(match[3]);
          date = new Date(year, monthIndex, day);
        } else if (pattern.source.includes('Jan|Feb')) {
          // Short month format
          const monthIndex = this.getMonthIndex(match[1]);
          const day = parseInt(match[2]);
          const year = parseInt(match[3]);
          date = new Date(year, monthIndex, day);
        } else if (pattern.source.includes('(\\d{4})')) {
          // Year-first format (ISO)
          const year = parseInt(match[1]);
          const month = parseInt(match[2]) - 1;
          const day = parseInt(match[3]);
          date = new Date(year, month, day);
        } else {
          // Month-first or day-first format
          const part1 = parseInt(match[1]);
          const part2 = parseInt(match[2]);
          const year = parseInt(match[3]);
          
          // Assume US format (MM/DD/YYYY) by default
          date = new Date(year, part1 - 1, part2);
        }

        if (isNaN(date.getTime())) continue;

        // Extract time if present
        const timeMatch = dateText.match(timePattern);
        const time = timeMatch ? timeMatch[0] : undefined;

        return { date, time };
      }
    }

    return null;
  }

  // Column type detection methods
  private isDateColumn(header: string): boolean {
    return /^(date|when|day|time|schedule|due|start|end)/.test(header);
  }

  private isTitleColumn(header: string): boolean {
    return /^(title|name|event|task|subject|what)/.test(header);
  }

  private isStatusColumn(header: string): boolean {
    return /^(status|state|done|complete|progress)/.test(header);
  }

  private isLocationColumn(header: string): boolean {
    return /^(location|where|place|venue|address)/.test(header);
  }

  private isCategoryColumn(header: string): boolean {
    return /^(category|type|tag|label|kind|group)/.test(header);
  }

  private isDescriptionColumn(header: string): boolean {
    return /^(description|details|notes|info|about)/.test(header);
  }

  private isTimeColumn(header: string): boolean {
    return /^(time|hour|when|at)$/.test(header);
  }

  private isPriorityColumn(header: string): boolean {
    return /^(priority|importance|urgent|level)/.test(header);
  }

  private getMonthIndex(monthName: string): number {
    const months: { [key: string]: number } = {
      'january': 0, 'jan': 0, 'february': 1, 'feb': 1, 'march': 2, 'mar': 2,
      'april': 3, 'apr': 3, 'may': 4, 'june': 5, 'jun': 5, 'july': 6, 'jul': 6,
      'august': 7, 'aug': 7, 'september': 8, 'sep': 8, 'october': 9, 'oct': 9,
      'november': 10, 'nov': 10, 'december': 11, 'dec': 11
    };
    return months[monthName.toLowerCase()] ?? -1;
  }

  private extractCalendarIdFromUrl(url: string): string {
    const urlParts = url.split('?')[0].split('/');
    const lastPart = urlParts[urlParts.length - 1];
    return lastPart.split('-').pop() || 'scraped_calendar';
  }
}

export const notionTableParser = new NotionTableParser();
