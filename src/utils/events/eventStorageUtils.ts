
import { Event } from '@/types/calendar';

export const eventStorageUtils = {
  // Calculate storage size in bytes
  calculateStorageSize: (events: Event[]): number => {
    const dataStr = JSON.stringify(events);
    return new Blob([dataStr]).size;
  },

  // Format storage size for display
  formatStorageSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Validate event data structure
  validateEventData: (data: any): data is Event => {
    return (
      typeof data === 'object' &&
      typeof data.id === 'number' &&
      typeof data.title === 'string' &&
      data.date instanceof Date &&
      typeof data.time === 'string' &&
      typeof data.category === 'string' &&
      typeof data.organizer === 'string'
    );
  },

  // Clean event data for storage
  cleanEventForStorage: (event: Event): Event => ({
    id: event.id,
    title: event.title.trim(),
    date: event.date,
    time: event.time,
    location: event.location?.trim() || '',
    description: event.description?.trim() || '',
    attendees: event.attendees || 0,
    category: event.category,
    color: event.color,
    organizer: event.organizer,
    calendarId: event.calendarId || 'local_calendar',
    calendarName: event.calendarName || 'Family Calendar',
    source: event.source || 'local'
  }),

  // Get storage statistics
  getStorageStats: () => {
    try {
      let totalSize = 0;
      let eventCount = 0;
      
      for (const key in localStorage) {
        if (key.startsWith('family_calendar_')) {
          const data = localStorage.getItem(key);
          if (data) {
            totalSize += data.length;
            if (key === 'family_calendar_events') {
              try {
                const parsed = JSON.parse(data);
                eventCount = parsed.events?.length || 0;
              } catch {
                // Ignore parsing errors
              }
            }
          }
        }
      }
      
      return {
        totalSize,
        eventCount,
        formattedSize: eventStorageUtils.formatStorageSize(totalSize)
      };
    } catch (error) {
      console.error('Error calculating storage stats:', error);
      return {
        totalSize: 0,
        eventCount: 0,
        formattedSize: '0 Bytes'
      };
    }
  }
};
