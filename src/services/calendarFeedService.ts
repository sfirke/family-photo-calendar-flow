
import { ICalCalendar } from '@/types/ical';
import { NotionCalendar } from '@/types/notion';
import { calendarStorageService } from './calendarStorage';

export type CalendarFeed = ICalCalendar | NotionCalendar;

// Base interface for common properties
interface CalendarBase {
  name: string;
  url: string;
  color: string;
  enabled: boolean;
  lastSync?: string;
  eventCount?: number;
}

// Discriminated union types for calendar creation
export type CreateICalCalendar = CalendarBase & {
  type: 'ical';
  syncStatus?: 'idle' | 'syncing' | 'success' | 'error';
  error?: string;
  hasEvents?: boolean;
  source?: string;
};

export type CreateNotionCalendar = CalendarBase & {
  type: 'notion';
  databaseId: string;
  propertyMappings?: {
    title?: string;
    date?: string;
    description?: string;
    location?: string;
  };
};

export type CreateCalendarInput = CreateICalCalendar | CreateNotionCalendar;

export class CalendarFeedService {
  static async addCalendar(calendar: CreateCalendarInput): Promise<CalendarFeed> {
    const id = `${calendar.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let newCalendar: CalendarFeed;
    
    if (calendar.type === 'notion') {
      // TypeScript now knows this is CreateNotionCalendar, so databaseId is available
      newCalendar = {
        ...calendar,
        id,
        databaseId: calendar.databaseId,
      } as NotionCalendar;
    } else {
      // TypeScript knows this is CreateICalCalendar
      newCalendar = {
        ...calendar,
        id,
        syncStatus: calendar.syncStatus || 'idle',
      } as ICalCalendar;
    }

    await calendarStorageService.addCalendar(newCalendar);
    return newCalendar;
  }

  static async updateCalendar(id: string, updates: Partial<CalendarFeed>): Promise<void> {
    await calendarStorageService.updateCalendar(id, updates);
  }

  static async removeCalendar(id: string): Promise<void> {
    await calendarStorageService.deleteCalendar(id);
  }

  static async getAllCalendars(): Promise<CalendarFeed[]> {
    const stored = await calendarStorageService.getAllCalendars();
    // Convert stored calendars to proper types based on their properties
    return stored.map(cal => {
      if (cal.databaseId !== undefined) {
        return cal as NotionCalendar;
      } else {
        return {
          ...cal,
          syncStatus: cal.syncStatus || 'idle'
        } as ICalCalendar;
      }
    });
  }

  static isICalCalendar(calendar: CalendarFeed): calendar is ICalCalendar {
    return !('databaseId' in calendar);
  }

  static isNotionCalendar(calendar: CalendarFeed): calendar is NotionCalendar {
    return 'databaseId' in calendar;
  }

  static getCalendarType(calendar: CalendarFeed): 'ical' | 'notion' {
    return this.isNotionCalendar(calendar) ? 'notion' : 'ical';
  }
}
