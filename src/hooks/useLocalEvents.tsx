
import { useState, useEffect } from 'react';
import { Event } from '@/types/calendar';
import { ICalEventService } from '@/services/icalEventService';

export const useLocalEvents = () => {
  const [googleEvents, setGoogleEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load events from localStorage
  const loadEvents = () => {
    try {
      setIsLoading(true);
      
      // Load regular local events
      const storedEvents = localStorage.getItem('family_calendar_events');
      const localEvents: Event[] = storedEvents ? JSON.parse(storedEvents) : [];
      
      // Load iCal events and combine them
      const icalEvents = ICalEventService.getEvents();
      
      // Combine all events
      const allEvents = [...localEvents, ...icalEvents];
      
      console.log(`Loaded ${localEvents.length} local events and ${icalEvents.length} iCal events`);
      setGoogleEvents(allEvents);
      
    } catch (error) {
      console.error('Error loading events:', error);
      setGoogleEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for background sync data availability
  useEffect(() => {
    const handleBackgroundSyncData = () => {
      console.log('Background sync data available, reloading events');
      loadEvents();
    };

    window.addEventListener('background-sync-data-available', handleBackgroundSyncData);
    
    return () => {
      window.removeEventListener('background-sync-data-available', handleBackgroundSyncData);
    };
  }, []);

  // Load events on mount and when storage changes
  useEffect(() => {
    loadEvents();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'family_calendar_events' || e.key === 'family_calendar_ical_events') {
        console.log('Storage changed, reloading events');
        loadEvents();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const addEvent = (event: Omit<Event, 'id'>) => {
    try {
      const newEvent = {
        ...event,
        id: Date.now(),
        date: new Date(event.date)
      };

      const storedEvents = localStorage.getItem('family_calendar_events');
      const events: Event[] = storedEvents ? JSON.parse(storedEvents) : [];
      
      events.push(newEvent);
      localStorage.setItem('family_calendar_events', JSON.stringify(events));
      
      loadEvents(); // Reload to include all events
      return newEvent;
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  };

  const updateEvent = (id: number, updates: Partial<Event>) => {
    try {
      const storedEvents = localStorage.getItem('family_calendar_events');
      const events: Event[] = storedEvents ? JSON.parse(storedEvents) : [];
      
      const updatedEvents = events.map(event => 
        event.id === id ? { ...event, ...updates } : event
      );
      
      localStorage.setItem('family_calendar_events', JSON.stringify(updatedEvents));
      loadEvents(); // Reload to include all events
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  const deleteEvent = (id: number) => {
    try {
      const storedEvents = localStorage.getItem('family_calendar_events');
      const events: Event[] = storedEvents ? JSON.parse(storedEvents) : [];
      
      const filteredEvents = events.filter(event => event.id !== id);
      localStorage.setItem('family_calendar_events', JSON.stringify(filteredEvents));
      
      loadEvents(); // Reload to include all events
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  };

  return {
    googleEvents,
    isLoading,
    addEvent,
    updateEvent,
    deleteEvent,
    refetch: loadEvents
  };
};
