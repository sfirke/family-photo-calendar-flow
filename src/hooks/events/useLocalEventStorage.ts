
import { useState, useEffect, useCallback } from 'react';
import { Event } from '@/types/calendar';

const LOCAL_EVENTS_KEY = 'family_calendar_events';
const EVENTS_VERSION_KEY = 'family_calendar_events_version';
const CURRENT_VERSION = '1.0';

interface LocalEventStorage {
  events: Event[];
  lastSync: string;
  version: string;
}

export const useLocalEventStorage = () => {
  const [localEvents, setLocalEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        return eventsWithDates;
      } else {
        // Return empty array if no valid data
        setLocalEvents([]);
        return [];
      }
    } catch (error) {
      console.error('Error loading local events:', error);
      setLocalEvents([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Event management functions
  const addEvent = useCallback((newEvent: Omit<Event, 'id'>) => {
    const event: Event = {
      ...newEvent,
      id: Date.now(),
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

  const updateEvent = useCallback((eventId: number, updates: Partial<Event>) => {
    setLocalEvents(prev => {
      const updated = prev.map(event => 
        event.id === eventId ? { ...event, ...updates } : event
      );
      saveEventsToStorage(updated);
      return updated;
    });
  }, [saveEventsToStorage]);

  const deleteEvent = useCallback((eventId: number) => {
    setLocalEvents(prev => {
      const updated = prev.filter(event => event.id !== eventId);
      saveEventsToStorage(updated);
      return updated;
    });
  }, [saveEventsToStorage]);

  const clearEvents = useCallback(() => {
    setLocalEvents([]);
    localStorage.removeItem(LOCAL_EVENTS_KEY);
    localStorage.removeItem(EVENTS_VERSION_KEY);
  }, []);

  const refreshEvents = useCallback(() => {
    setIsLoading(true);
    loadLocalEvents();
  }, [loadLocalEvents]);

  useEffect(() => {
    loadLocalEvents();
  }, [loadLocalEvents]);

  return {
    localEvents,
    isLoading,
    addEvent,
    updateEvent,
    deleteEvent,
    clearEvents,
    refreshEvents,
    saveEventsToStorage
  };
};
