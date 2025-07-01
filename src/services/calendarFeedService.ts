
import { ICalCalendar } from '@/types/ical';
import { NotionCalendar } from '@/types/notion';
import { calendarStorageService } from './calendarStorage';

export type CalendarFeed = ICalCalendar | NotionCalendar;

export class CalendarFeedService {
  static async addCalendar(calendar: Omit<CalendarFeed, 'id'> & { type: 'ical' | 'notion' }): Promise<CalendarFeed> {
    const id = `${calendar.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newCalendar = {
      ...calendar,
      id,
    };

    await calendarStorageService.addCalendar(newCalendar);
    return newCalendar as CalendarFeed;
  }

  static async updateCalendar(id: string, updates: Partial<CalendarFeed>): Promise<void> {
    await calendarStorageService.updateCalendar(id, updates);
  }

  static async removeCalendar(id: string): Promise<void> {
    await calendarStorageService.deleteCalendar(id);
  }

  static async getAllCalendars(): Promise<CalendarFeed[]> {
    return await calendarStorageService.getAllCalendars();
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
