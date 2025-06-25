
import { useState, useEffect, useCallback } from 'react';
import ICAL from 'ical.js';

export interface ICalCalendar {
  id: string;
  name: string;
  url: string;
  color: string;
  enabled: boolean;
  lastSync?: string;
  eventCount?: number;
}

const ICAL_CALENDARS_KEY = 'family_calendar_ical_calendars';
const ICAL_EVENTS_KEY = 'family_calendar_ical_events';

export const useICalCalendars = () => {
  const [calendars, setCalendars] = useState<ICalCalendar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ [key: string]: string }>({});

  // Load calendars from localStorage
  const loadCalendars = useCallback(() => {
    try {
      const stored = localStorage.getItem(ICAL_CALENDARS_KEY);
      if (stored) {
        const parsedCalendars = JSON.parse(stored);
        setCalendars(parsedCalendars);
      }
    } catch (error) {
      console.error('Error loading iCal calendars:', error);
    }
  }, []);

  // Save calendars to localStorage
  const saveCalendars = useCallback((newCalendars: ICalCalendar[]) => {
    try {
      localStorage.setItem(ICAL_CALENDARS_KEY, JSON.stringify(newCalendars));
      setCalendars(newCalendars);
    } catch (error) {
      console.error('Error saving iCal calendars:', error);
    }
  }, []);

  // Add a new iCal calendar
  const addCalendar = useCallback((calendar: Omit<ICalCalendar, 'id'>) => {
    const newCalendar: ICalCalendar = {
      ...calendar,
      id: Date.now().toString(),
    };
    const updated = [...calendars, newCalendar];
    saveCalendars(updated);
    return newCalendar;
  }, [calendars, saveCalendars]);

  // Update an existing calendar
  const updateCalendar = useCallback((id: string, updates: Partial<ICalCalendar>) => {
    const updated = calendars.map(cal => 
      cal.id === id ? { ...cal, ...updates } : cal
    );
    saveCalendars(updated);
  }, [calendars, saveCalendars]);

  // Remove a calendar
  const removeCalendar = useCallback((id: string) => {
    const updated = calendars.filter(cal => cal.id !== id);
    saveCalendars(updated);
    
    // Also remove events from this calendar
    try {
      const storedEvents = localStorage.getItem(ICAL_EVENTS_KEY);
      if (storedEvents) {
        const events = JSON.parse(storedEvents);
        const filteredEvents = events.filter((event: any) => event.calendarId !== id);
        localStorage.setItem(ICAL_EVENTS_KEY, JSON.stringify(filteredEvents));
      }
    } catch (error) {
      console.error('Error removing calendar events:', error);
    }
  }, [calendars, saveCalendars]);

  // Fetch and parse iCal feed
  const syncCalendar = useCallback(async (calendar: ICalCalendar) => {
    setIsLoading(true);
    setSyncStatus(prev => ({ ...prev, [calendar.id]: 'syncing' }));

    try {
      // Try direct fetch first
      let response: Response;
      try {
        response = await fetch(calendar.url, {
          mode: 'cors',
          headers: {
            'Accept': 'text/calendar, text/plain, */*',
          }
        });
      } catch (corsError) {
        // If CORS fails, try with a CORS proxy
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(calendar.url)}`;
        response = await fetch(proxyUrl);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const icalData = await response.text();
      
      // Parse iCal data
      const jcalData = ICAL.parse(icalData);
      const vcalendar = new ICAL.Component(jcalData);
      const vevents = vcalendar.getAllSubcomponents('vevent');

      const events = vevents.map((vevent, index) => {
        const event = new ICAL.Event(vevent);
        
        return {
          id: Date.now() + index,
          title: event.summary || 'Untitled Event',
          time: event.isRecurring() ? 'Recurring' : `${event.startDate.toJSDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${event.endDate.toJSDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          location: event.location || '',
          attendees: 0,
          category: 'Personal' as const,
          color: calendar.color,
          description: event.description || '',
          organizer: 'iCal Import',
          date: event.startDate.toJSDate(),
          calendarId: calendar.id,
          calendarName: calendar.name,
          source: 'ical'
        };
      });

      // Store events
      try {
        const existingEvents = JSON.parse(localStorage.getItem(ICAL_EVENTS_KEY) || '[]');
        const filteredExisting = existingEvents.filter((event: any) => event.calendarId !== calendar.id);
        const allEvents = [...filteredExisting, ...events];
        localStorage.setItem(ICAL_EVENTS_KEY, JSON.stringify(allEvents));
      } catch (error) {
        console.error('Error storing iCal events:', error);
      }

      // Update calendar with sync info
      updateCalendar(calendar.id, {
        lastSync: new Date().toISOString(),
        eventCount: events.length
      });

      setSyncStatus(prev => ({ ...prev, [calendar.id]: 'success' }));
      return events;

    } catch (error) {
      console.error('Error syncing iCal calendar:', error);
      setSyncStatus(prev => ({ ...prev, [calendar.id]: 'error' }));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [updateCalendar]);

  // Sync all enabled calendars
  const syncAllCalendars = useCallback(async () => {
    const enabledCalendars = calendars.filter(cal => cal.enabled);
    
    for (const calendar of enabledCalendars) {
      try {
        await syncCalendar(calendar);
      } catch (error) {
        console.error(`Failed to sync calendar ${calendar.name}:`, error);
      }
    }
  }, [calendars, syncCalendar]);

  // Get all iCal events
  const getICalEvents = useCallback(() => {
    try {
      const stored = localStorage.getItem(ICAL_EVENTS_KEY);
      if (stored) {
        const events = JSON.parse(stored);
        return events.map((event: any) => ({
          ...event,
          date: new Date(event.date)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading iCal events:', error);
      return [];
    }
  }, []);

  useEffect(() => {
    loadCalendars();
  }, [loadCalendars]);

  return {
    calendars,
    isLoading,
    syncStatus,
    addCalendar,
    updateCalendar,
    removeCalendar,
    syncCalendar,
    syncAllCalendars,
    getICalEvents
  };
};
