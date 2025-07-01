
export interface Event {
  id: number | string;
  title: string;
  time: string;
  location?: string;
  attendees: number;
  category: 'Personal' | 'Work' | 'Family' | 'Kids' | 'Holidays';
  color: string;
  description: string;
  organizer: string;
  date: Date;
  calendarId?: string;
  calendarName?: string;
  source?: 'ical' | 'notion' | 'local';
}

export type ViewMode = 'month' | 'timeline' | 'week';

export interface FilterState {
  Personal: boolean;
  Work: boolean;
  Family: boolean;
  Kids: boolean;
  Holidays: boolean;
}

export interface CalendarSyncData {
  calendarId: string;
  icalData: string;
  syncTime: string;
}

export interface BackgroundSyncData {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface ImportedEvent {
  id?: number;
  title: string;
  date: string | Date;
  time?: string;
  location?: string;
  description?: string;
  calendarId?: string;
  calendarName?: string;
  [key: string]: unknown;
}

export interface CalendarSettings {
  [key: string]: unknown;
}
