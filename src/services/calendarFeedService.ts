
import { ICalCalendar } from '@/types/ical';
import { NotionCalendar } from '@/types/notion';
import { calendarStorageService } from './calendarStorage';

export type CalendarFeed = ICalCalendar | NotionCalendar;

export class CalendarFeedService {
  static async addCalendar(calendar: Omit<CalendarFeed, 'id'> & { type: 'ical' | 'notion' }): Promise<CalendarFeed> {
    const id = `${calendar.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let newCalendar: CalendarFeed;
    
    if (calendar.type === 'notion') {
      // Create Notion calendar with required databaseId
      newCalendar = {
        ...calendar,
        id,
        databaseId: calendar.databaseId || '', // Ensure databaseId exists for Notion calendars
      } as NotionCalendar;
    } else {
      // Create iCal calendar with required syncStatus
      newCalendar = {
        ...calendar,
        id,
        syncStatus: 'idle' as const,
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
