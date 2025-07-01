
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
