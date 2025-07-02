
import { 
  PageObjectResponse, 
  DatabaseObjectResponse, 
  QueryDatabaseResponse 
} from '@notionhq/client/build/src/api-endpoints';

export interface NotionIntegrationToken {
  token: string;
  workspaceName?: string;
  createdAt: string;
}

export interface NotionIntegrationInfo {
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

export interface NotionCalendar {
  id: string;
  name: string;
  url: string;
  color: string;
  enabled: boolean;
  lastSync?: string;
  eventCount?: number;
  type: 'notion';
  databaseId?: string;
  pageId?: string;
  resourceType?: 'page' | 'database';
  hasAccess?: boolean;
}

// Use official SDK types
export type NotionPage = PageObjectResponse;
export type NotionDatabase = DatabaseObjectResponse;
export type NotionApiResponse = QueryDatabaseResponse;

export interface NotionEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  description?: string;
  location?: string;
  calendarId: string;
  calendarName: string;
  source: 'notion';
  color: string;
  properties?: Record<string, any>;
  notionPageId: string;
  notionUrl: string;
}

export interface NotionSyncStatus {
  [calendarId: string]: 'syncing' | 'success' | 'error' | '';
}

export interface NotionAccessValidation {
  hasAccess: boolean;
  resourceType: 'page' | 'database' | null;
  error?: string;
}

// New interfaces for enhanced functionality
export interface DatabaseProperties {
  [key: string]: {
    id: string;
    name: string;
    type: string;
  };
}

export interface DatabaseTestResult {
  success: boolean;
  database?: any;
  properties?: DatabaseProperties;
  samplePages?: any[];
  error?: string;
}

export interface DatabaseValidationResult {
  isValid: boolean;
  id: string;
  type: 'id' | 'url' | 'invalid';
}

// Enhanced interfaces for scraped Notion events with structured data
export interface NotionScrapedEvent {
  id: string;
  title: string;
  date: Date;
  time?: string;
  description?: string;
  location?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled' | string;
  categories?: string[];
  priority?: 'high' | 'medium' | 'low' | string;
  properties: Record<string, any>;
  sourceUrl: string;
  scrapedAt: Date;
  calendarId?: string;
  customProperties?: Record<string, any>;
  dateRange?: {
    startDate: Date;
    endDate?: Date;
  };
}

export interface NotionColumnMapping {
  [columnName: string]: {
    type: 'date' | 'title' | 'status' | 'category' | 'location' | 'description' | 'time' | 'priority' | 'custom';
    propertyName: string;
  };
}

export interface NotionPageMetadata {
  url: string;
  title: string;
  lastScraped: Date;
  eventCount: number;
  databaseId?: string;
  token?: string;
  viewId?: string;
  columnMappings?: NotionColumnMapping;
  viewType?: 'table' | 'list' | 'board' | 'calendar' | 'database';
}

export interface NotionScrapedCalendar {
  id: string;
  name: string;
  url: string;
  color: string;
  enabled: boolean;
  lastSync?: string;
  eventCount?: number;
  type: 'notion-scraped';
  metadata?: NotionPageMetadata;
}
