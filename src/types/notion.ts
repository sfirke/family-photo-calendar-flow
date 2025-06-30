
export interface NotionDatabase {
  id: string;
  title: string;
  properties: Record<string, NotionProperty>;
  url: string;
}

export interface NotionProperty {
  id: string;
  name: string;
  type: string;
}

export interface NotionPage {
  id: string;
  properties: Record<string, any>;
  last_edited_time: string;
  created_time: string;
}

export interface NotionDatabaseResponse {
  results: NotionPage[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface NotionCalendar {
  id: string;
  name: string;
  url: string;
  databaseId: string;
  color: string;
  enabled: boolean;
  lastSync?: string;
  eventCount?: number;
  propertyMappings?: {
    title?: string;
    date?: string;
    description?: string;
    location?: string;
  };
}
