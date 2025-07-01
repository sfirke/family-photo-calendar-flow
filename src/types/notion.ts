
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

export interface NotionPage {
  id: string;
  title: string;
  url: string;
  properties: Record<string, any>;
  created_time: string;
  last_edited_time: string;
}

export interface NotionDatabase {
  id: string;
  title: string;
  properties: Record<string, NotionProperty>;
}

export interface NotionProperty {
  id: string;
  name: string;
  type: string;
  title?: any[];
  rich_text?: any[];
  date?: {
    start: string;
    end?: string;
  };
  select?: {
    name: string;
  };
}

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

export interface NotionApiResponse {
  results: NotionPage[];
  next_cursor?: string;
  has_more: boolean;
}

export interface NotionSyncStatus {
  [calendarId: string]: 'syncing' | 'success' | 'error' | '';
}

export interface NotionAccessValidation {
  hasAccess: boolean;
  resourceType: 'page' | 'database' | null;
  error?: string;
}
