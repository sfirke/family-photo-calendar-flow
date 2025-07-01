
import { useCallback } from 'react';
import { Event, ImportedEvent } from '@/types/calendar';

export const useEventImportExport = () => {
  const exportEvents = useCallback((events: Event[]) => {
    try {
      const dataStr = JSON.stringify(events, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `family-calendar-events-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting events:', error);
      throw new Error('Failed to export events');
    }
  }, []);

  const importEvents = useCallback((file: File): Promise<Event[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const importedEvents: ImportedEvent[] = JSON.parse(e.target?.result as string);
          
          // Validate and convert imported events
          const validEvents: Event[] = importedEvents.map((event: ImportedEvent, index: number) => ({
            id: event.id || (Date.now() + index),
            title: event.title,
            date: new Date(event.date),
            time: event.time || '12:00',
            location: event.location || '',
            description: event.description || '',
            attendees: 0,
            category: 'Personal' as const,
            color: '#3b82f6',
            organizer: 'User',
            calendarId: event.calendarId || 'imported_calendar',
            calendarName: event.calendarName || 'Imported Calendar',
            source: 'local' as const
          }));

          resolve(validEvents);
        } catch (error) {
          reject(new Error('Invalid JSON file format'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  const validateImportFile = useCallback((file: File): boolean => {
    // Check file type
    if (!file.type.includes('json') && !file.name.endsWith('.json')) {
      return false;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return false;
    }

    return true;
  }, []);

  return {
    exportEvents,
    importEvents,
    validateImportFile
  };
};
