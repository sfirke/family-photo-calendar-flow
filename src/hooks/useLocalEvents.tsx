
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Event } from '@/types/calendar';
import { sampleEvents } from '@/data/sampleEvents';
import { useICalCalendars } from './useICalCalendars';

const LOCAL_EVENTS_KEY = 'family_calendar_events';
const EVENTS_VERSION_KEY = 'family_calendar_events_version';
const CURRENT_VERSION = '1.0';

interface LocalEventStorage {
  events: Event[];
  lastSync: string;
  version: string;
}

export const useLocalEvents = () => {
  const [localEvents, setLocalEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getICalEvents } = useICalCalendars();

  // Load events from localStorage
  const loadLocalEvents = useCallback(() => {
    try {
      const storedData = localStorage.getItem(LOCAL_EVENTS_KEY);
      const storedVersion = localStorage.getItem(EVENTS_VERSION_KEY);
      
      if (storedData && storedVersion === CURRENT_VERSION) {
        const eventData: LocalEventStorage = JSON.parse(storedData);
        
        // Convert date strings back to Date objects
        const eventsWithDates = eventData.events.map(event => ({
          ...event,
          date: new Date(event.date)
        }));
        
        setLocalEvents(eventsWithDates);
      } else {
        // Initialize with sample events on first load or version mismatch
        initializeWithSampleEvents();
      }
    } catch (error) {
      console.error('Error loading local events:', error);
      initializeWithSampleEvents();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize with sample events
  const initializeWithSampleEvents = useCallback(() => {
    const enhancedSampleEvents = sampleEvents.map((event, index) => ({
      ...event,
      id: event.id || (1000 + index),
      calendarId: 'local_calendar',
      calendarName: 'Family Calendar'
    }));

    setLocalEvents(enhancedSampleEvents);
    saveEventsToStorage(enhancedSampleEvents);
  }, []);

  // Save events to localStorage
  const saveEventsToStorage = useCallback((events: Event[]) => {
    try {
      const storageData: LocalEventStorage = {
        events,
        lastSync: new Date().toISOString(),
        version: CURRENT_VERSION
      };
      
      localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(storageData));
      localStorage.setItem(EVENTS_VERSION_KEY, CURRENT_VERSION);
    } catch (error) {
      console.error('Error saving events to localStorage:', error);
    }
  }, []);

  // Get all events (local + iCal)
  const allEvents = useMemo(() => {
    const icalEvents = getICalEvents();
    return [...localEvents, ...icalEvents];
  }, [localEvents, getICalEvents]);

  // Add a new event
  const addEvent = useCallback((newEvent: Omit<Event, 'id'>) => {
    const event: Event = {
      ...newEvent,
      id: Date.now(), // Simple ID generation
      calendarId: 'local_calendar',
      calendarName: 'Family Calendar'
    };

    setLocalEvents(prev => {
      const updated = [...prev, event];
      saveEventsToStorage(updated);
      return updated;
    });

    return event;
  }, [saveEventsToStorage]);

  // Update an existing event
  const updateEvent = useCallback((eventId: number, updates: Partial<Event>) => {
    setLocalEvents(prev => {
      const updated = prev.map(event => 
        event.id === eventId ? { ...event, ...updates } : event
      );
      saveEventsToStorage(updated);
      return updated;
    });
  }, [saveEventsToStorage]);

  // Delete an event
  const deleteEvent = useCallback((eventId: number) => {
    setLocalEvents(prev => {
      const updated = prev.filter(event => event.id !== eventId);
      saveEventsToStorage(updated);
      return updated;
    });
  }, [saveEventsToStorage]);

  // Refresh events (reload from storage)
  const refreshEvents = useCallback(() => {
    setIsLoading(true);
    loadLocalEvents();
  }, [loadLocalEvents]);

  // Clear all events and reset to sample data
  const resetToSampleEvents = useCallback(() => {
    localStorage.removeItem(LOCAL_EVENTS_KEY);
    localStorage.removeItem(EVENTS_VERSION_KEY);
    initializeWithSampleEvents();
  }, [initializeWithSampleEvents]);

  // Export events as JSON
  const exportEvents = useCallback(() => {
    const dataStr = JSON.stringify(allEvents, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `family-calendar-events-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [allEvents]);

  // Import events from JSON
  const importEvents = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedEvents = JSON.parse(e.target?.result as string);
          
          // Validate and convert imported events
          const validEvents = importedEvents.map((event: any, index: number) => ({
            ...event,
            id: event.id || (Date.now() + index),
            date: new Date(event.date),
            calendarId: event.calendarId || 'imported_calendar',
            calendarName: event.calendarName || 'Imported Calendar'
          }));

          setLocalEvents(validEvents);
          saveEventsToStorage(validEvents);
          resolve();
        } catch (error) {
          reject(new Error('Invalid JSON file format'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, [saveEventsToStorage]);

  useEffect(() => {
    loadLocalEvents();
  }, [loadLocalEvents]);

  // Memoize return value to prevent unnecessary re-renders
  const memoizedValue = useMemo(() => ({
    googleEvents: allEvents, // Keep same interface name for compatibility
    localEvents: allEvents, // Return combined events
    isLoading,
    refreshEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    resetToSampleEvents,
    exportEvents,
    importEvents,
    clearCache: resetToSampleEvents,
    handleWebhookUpdate: () => {} // No-op for compatibility
  }), [
    allEvents,
    isLoading,
    refreshEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    resetToSampleEvents,
    exportEvents,
    importEvents
  ]);

  return memoizedValue;
};
