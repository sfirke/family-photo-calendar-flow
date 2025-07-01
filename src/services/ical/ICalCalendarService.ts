
import { Event } from '@/types/calendar';
import { ICalCalendar } from '@/hooks/ical/useICalCalendarManagement';
import { icalFetchService } from '../icalFetchService';
import { icalEventService } from '../icalEventService';

export class ICalCalendarService {
  private static readonly STORAGE_KEY = 'ical_calendars';

  static async saveCalendar(calendar: ICalCalendar): Promise<ICalCalendar> {
    try {
      const calendars = await this.loadCalendars();
      const updatedCalendars = [...calendars, calendar];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedCalendars));
      return calendar;
    } catch (error) {
      console.error('Error saving calendar:', error);
      throw new Error('Failed to save calendar');
    }
  }

  static async updateCalendar(id: string, updates: Partial<ICalCalendar>): Promise<ICalCalendar> {
    try {
      const calendars = await this.loadCalendars();
      const calendarIndex = calendars.findIndex(cal => cal.id === id);
      
      if (calendarIndex === -1) {
        throw new Error('Calendar not found');
      }
      
      const updatedCalendar = { ...calendars[calendarIndex], ...updates };
      calendars[calendarIndex] = updatedCalendar;
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(calendars));
      return updatedCalendar;
    } catch (error) {
      console.error('Error updating calendar:', error);
      throw new Error('Failed to update calendar');
    }
  }

  static async deleteCalendar(id: string): Promise<void> {
    try {
      const calendars = await this.loadCalendars();
      const filteredCalendars = calendars.filter(cal => cal.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredCalendars));
    } catch (error) {
      console.error('Error deleting calendar:', error);
      throw new Error('Failed to delete calendar');
    }
  }

  static async loadCalendars(): Promise<ICalCalendar[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading calendars:', error);
      return [];
    }
  }

  static async syncCalendar(calendar: ICalCalendar): Promise<Event[]> {
    try {
      const icalData = await icalFetchService.fetchICalData(calendar.url);
      const events = icalEventService.parseEvents(icalData, calendar);
      
      // Update calendar sync status
      await this.updateCalendar(calendar.id, {
        lastSync: new Date().toISOString(),
        syncStatus: 'success',
        error: undefined
      });
      
      return events;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      
      // Update calendar with error status
      await this.updateCalendar(calendar.id, {
        syncStatus: 'error',
        error: errorMessage
      });
      
      throw error;
    }
  }
}
