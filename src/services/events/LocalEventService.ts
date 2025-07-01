
import { Event } from '@/types/calendar';
import { sampleEvents } from '@/data/sampleEvents';

export class LocalEventService {
  private static readonly STORAGE_KEY = 'family_calendar_events';
  private static readonly VERSION_KEY = 'family_calendar_events_version';
  private static readonly CURRENT_VERSION = '1.0';

  static initializeWithSampleEvents(): Event[] {
    const enhancedSampleEvents = sampleEvents.map((event, index) => ({
      ...event,
      id: event.id || (1000 + index),
      calendarId: 'local_calendar',
      calendarName: 'Family Calendar',
      source: 'local' as const
    }));

    this.saveEvents(enhancedSampleEvents);
    return enhancedSampleEvents;
  }

  static saveEvents(events: Event[]): void {
    try {
      const storageData = {
        events,
        lastSync: new Date().toISOString(),
        version: this.CURRENT_VERSION
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storageData));
      localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION);
    } catch (error) {
      console.error('Error saving events to localStorage:', error);
      throw new Error('Failed to save events');
    }
  }

  static loadEvents(): Event[] {
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      const storedVersion = localStorage.getItem(this.VERSION_KEY);
      
      if (storedData && storedVersion === this.CURRENT_VERSION) {
        const eventData = JSON.parse(storedData);
        
        // Convert date strings back to Date objects
        return eventData.events.map((event: any) => ({
          ...event,
          date: new Date(event.date)
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error loading local events:', error);
      return [];
    }
  }

  static clearEvents(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.VERSION_KEY);
  }

  static getStorageInfo() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    const version = localStorage.getItem(this.VERSION_KEY);
    
    return {
      hasData: !!data,
      version: version || 'unknown',
      dataSize: data ? data.length : 0,
      isCurrentVersion: version === this.CURRENT_VERSION
    };
  }
}
