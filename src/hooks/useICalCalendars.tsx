import { useState, useEffect, useCallback } from 'react';
import ICAL from 'ical.js';
import { calendarStorageService, CalendarFeed } from '@/services/calendarStorage';
import { useBackgroundSync } from './useBackgroundSync';

export interface ICalCalendar {
  id: string;
  name: string;
  url: string;
  color: string;
  enabled: boolean;
  lastSync?: string;
  eventCount?: number;
}

const ICAL_EVENTS_KEY = 'family_calendar_ical_events';

// Multiple CORS proxy options for better reliability
const CORS_PROXIES = [
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://cors-anywhere.herokuapp.com/${url}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
  (url: string) => `https://cors.bridged.cc/${url}`,
];

export const useICalCalendars = () => {
  const [calendars, setCalendars] = useState<ICalCalendar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ [key: string]: string }>({});
  const { 
    registerBackgroundSync, 
    registerPeriodicSync, 
    triggerBackgroundSync,
    isBackgroundSyncSupported,
    processSyncQueue
  } = useBackgroundSync();

  // Load calendars from IndexedDB
  const loadCalendars = useCallback(async () => {
    try {
      console.log('Loading calendars from IndexedDB');
      const storedCalendars = await calendarStorageService.getAllCalendars();
      console.log('Loaded calendars from IndexedDB:', storedCalendars);
      setCalendars(storedCalendars);
      return storedCalendars;
    } catch (error) {
      console.error('Error loading calendars from IndexedDB:', error);
      setCalendars([]);
      return [];
    }
  }, []);

  // Initialize background sync when calendars are loaded
  useEffect(() => {
    if (calendars.length > 0 && isBackgroundSyncSupported) {
      const initBackgroundSync = async () => {
        try {
          await registerBackgroundSync();
          await registerPeriodicSync();
          console.log('Background sync initialized for calendar feeds');
        } catch (error) {
          console.error('Failed to initialize background sync:', error);
        }
      };
      
      initBackgroundSync();
    }
  }, [calendars.length, isBackgroundSyncSupported, registerBackgroundSync, registerPeriodicSync]);

  // Listen for background sync data
  useEffect(() => {
    const handleBackgroundSyncData = (event: CustomEvent) => {
      const { syncQueue } = event.detail;
      
      // Process background sync results
      syncQueue.forEach((syncData: any) => {
        try {
          processBackgroundSyncData(syncData);
        } catch (error) {
          console.error('Error processing background sync data:', error);
        }
      });
    };

    window.addEventListener('background-sync-data-available', handleBackgroundSyncData as EventListener);
    
    return () => {
      window.removeEventListener('background-sync-data-available', handleBackgroundSyncData as EventListener);
    };
  }, []);

  // Define updateCalendar before it's used
  const updateCalendar = useCallback(async (id: string, updates: Partial<ICalCalendar>): Promise<ICalCalendar> => {
    try {
      setIsLoading(true);
      console.log('Updating calendar:', id, updates);
      
      await calendarStorageService.updateCalendar(id, updates);
      const updatedCalendar = { ...calendars.find(cal => cal.id === id)!, ...updates };
      console.log('Calendar updated successfully:', updatedCalendar);
      
      // Update calendars state immediately
      setCalendars(prev => prev.map(cal => cal.id === id ? updatedCalendar : cal));
      
      // Force component re-render for visibility changes
      if (updates.enabled !== undefined) {
        console.log('Calendar visibility toggled, forcing refresh');
        setTimeout(() => setCalendars(prev => [...prev]), 0);
      }
      
      return updatedCalendar;
    } catch (error) {
      console.error('Error updating calendar:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [calendars]);

  const processBackgroundSyncData = useCallback((syncData: any) => {
    try {
      const { calendarId, icalData, syncTime } = syncData;
      
      // Find the calendar
      const calendar = calendars.find(cal => cal.id === calendarId);
      if (!calendar) return;

      // Parse the iCal data
      const jcalData = ICAL.parse(icalData);
      const vcalendar = new ICAL.Component(jcalData);
      const vevents = vcalendar.getAllSubcomponents('vevent');

      const allEvents: any[] = [];
      vevents.forEach((vevent) => {
        const event = new ICAL.Event(vevent);
        const eventOccurrences = expandRecurringEvent(event, calendar);
        allEvents.push(...eventOccurrences);
      });

      // Update events in localStorage
      const existingEvents = JSON.parse(localStorage.getItem(ICAL_EVENTS_KEY) || '[]');
      const filteredExisting = existingEvents.filter((event: any) => event.calendarId !== calendarId);
      const combinedEvents = [...filteredExisting, ...allEvents];
      localStorage.setItem(ICAL_EVENTS_KEY, JSON.stringify(combinedEvents));

      // Update calendar sync status
      updateCalendar(calendarId, {
        lastSync: syncTime,
        eventCount: allEvents.length
      });

      console.log(`Background sync processed ${allEvents.length} events for ${calendar.name}`);
    } catch (error) {
      console.error('Error processing background sync data:', error);
    }
  }, [calendars, updateCalendar]);

  // Add a new iCal calendar
  const addCalendar = useCallback(async (calendarData: Omit<ICalCalendar, 'id'>): Promise<ICalCalendar> => {
    try {
      setIsLoading(true);
      console.log('Adding new calendar:', calendarData);
      
      const newCalendarFeed: CalendarFeed = {
        id: `ical_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: calendarData.name,
        url: calendarData.url,
        color: calendarData.color,
        enabled: calendarData.enabled
      };
      
      await calendarStorageService.addCalendar(newCalendarFeed);
      console.log('Calendar added successfully:', newCalendarFeed);
      
      // Update the calendars state immediately
      setCalendars(prev => [...prev, newCalendarFeed]);
      
      return newCalendarFeed;
    } catch (error) {
      console.error('Error adding calendar:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Remove calendar
  const removeCalendar = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      console.log('Removing calendar:', id);
      
      // Remove from IndexedDB
      await calendarStorageService.deleteCalendar(id);
      console.log('Calendar removed from IndexedDB');
      
      // Update state
      setCalendars(prev => prev.filter(cal => cal.id !== id));
      
      // Remove events from this calendar from localStorage
      try {
        const storedEvents = localStorage.getItem(ICAL_EVENTS_KEY);
        if (storedEvents) {
          const events = JSON.parse(storedEvents);
          const filteredEvents = events.filter((event: any) => event.calendarId !== id);
          localStorage.setItem(ICAL_EVENTS_KEY, JSON.stringify(filteredEvents));
          
          // Dispatch event to notify components of the update
          window.dispatchEvent(new CustomEvent('ical-events-updated', { 
            detail: { calendarId: id, eventCount: 0 } 
          }));
          
          console.log('Calendar events removed from localStorage');
        }
      } catch (error) {
        console.error('Error removing calendar events:', error);
      }
    } catch (error) {
      console.error('Error removing calendar:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  
  const isEventInCurrentYear = (date: Date): boolean => {
    const currentYear = new Date().getFullYear();
    return date.getFullYear() === currentYear;
  };

  const isMultiDayEvent = (event: ICAL.Event): boolean => {
    if (!event.startDate || !event.endDate) return false;
    
    const startDate = event.startDate.toJSDate();
    const endDate = event.endDate.toJSDate();
    
    // Check if the event spans across days
    const diffInDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays > 0;
  };

  const createEventObject = (event: ICAL.Event, calendar: ICalCalendar, eventDate: Date, isRecurring: boolean, isMultiDay: boolean) => {
    const startDate = event.startDate ? event.startDate.toJSDate() : eventDate;
    const endDate = event.endDate ? event.endDate.toJSDate() : eventDate;
    
    // For multi-day events, use the provided eventDate as the specific occurrence date
    const occurrenceDate = isMultiDay ? eventDate : startDate;
    
    let timeString = 'All day';
    
    // Check if the event has specific times
    if (event.startDate && !event.startDate.isDate) {
      try {
        const startTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endTime = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        timeString = `${startTime} - ${endTime}`;
      } catch (error) {
        console.warn('Error formatting time for event:', event.summary, error);
        timeString = 'All day';
      }
    }

    return {
      id: `${event.uid}_${occurrenceDate.getTime()}`,
      title: event.summary || 'Untitled Event',
      time: timeString,
      location: event.location || '',
      attendees: 0,
      category: 'External' as const,
      color: calendar.color,
      description: event.description || '',
      organizer: calendar.name,
      date: occurrenceDate,
      calendarId: calendar.id,
      calendarName: calendar.name,
      source: 'ical',
      isRecurring,
      isMultiDay,
      originalStart: startDate,
      originalEnd: endDate
    };
  };

  const generateMultiDayOccurrences = (event: ICAL.Event, calendar: ICalCalendar): any[] => {
    const occurrences: any[] = [];
    
    try {
      if (!isMultiDayEvent(event)) {
        const eventDate = event.startDate.toJSDate();
        if (isEventInCurrentYear(eventDate)) {
          occurrences.push(createEventObject(event, calendar, eventDate, false, false));
        }
        return occurrences;
      }

      const startDate = event.startDate.toJSDate();
      const endDate = event.endDate.toJSDate();
      
      const currentDate = new Date(startDate);
      while (currentDate < endDate && isEventInCurrentYear(currentDate)) {
        occurrences.push(createEventObject(event, calendar, new Date(currentDate), false, true));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      console.log(`Generated ${occurrences.length} occurrences for multi-day event: ${event.summary}`);
    } catch (error) {
      console.warn('Error generating multi-day occurrences:', error);
      const eventDate = event.startDate ? event.startDate.toJSDate() : new Date();
      if (isEventInCurrentYear(eventDate)) {
        occurrences.push(createEventObject(event, calendar, eventDate, false, false));
      }
    }

    return occurrences;
  };

  const expandRecurringEvent = (event: ICAL.Event, calendar: ICalCalendar): any[] => {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);
    const occurrences: any[] = [];

    try {
      if (event.isRecurring()) {
        const iterator = event.iterator();
        let next;
        let count = 0;
        const maxOccurrences = 366;

        while ((next = iterator.next()) && count < maxOccurrences) {
          const occurrenceDate = next.toJSDate();
          
          if (occurrenceDate >= yearStart && occurrenceDate <= yearEnd) {
            if (isMultiDayEvent(event)) {
              const multiDayOccurrences = generateMultiDayOccurrences(event, calendar);
              occurrences.push(...multiDayOccurrences);
            } else {
              occurrences.push(createEventObject(event, calendar, occurrenceDate, true, false));
            }
          }
          
          count++;
          if (occurrenceDate > yearEnd) break;
        }
        
        console.log(`Generated ${occurrences.length} recurring occurrences for: ${event.summary}`);
      } else {
        // Non-recurring event
        const eventOccurrences = generateMultiDayOccurrences(event, calendar);
        occurrences.push(...eventOccurrences);
      }
    } catch (error) {
      console.warn('Error expanding recurring event:', error);
      const eventDate = event.startDate ? event.startDate.toJSDate() : new Date();
      if (isEventInCurrentYear(eventDate)) {
        occurrences.push(createEventObject(event, calendar, eventDate, false, false));
      }
    }

    return occurrences;
  };

  const syncCalendar = useCallback(async (calendar: ICalCalendar) => {
    if (!calendar.url || calendar.url.trim() === '') {
      throw new Error('Calendar URL is required for syncing');
    }

    setSyncStatus(prev => ({ ...prev, [calendar.id]: 'syncing' }));
    console.log('Starting sync for calendar:', calendar.name, 'URL:', calendar.url);

    let icalData: string | null = null;
    let successfulUrl = '';

    // Try direct fetch first
    try {
      console.log('Attempting direct fetch for:', calendar.url);
      const response = await fetch(calendar.url, {
        mode: 'cors',
        headers: {
          'Accept': 'text/calendar, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (compatible; FamilyCalendarApp/1.0)',
        }
      });

      if (response.ok) {
        const data = await response.text();
        if (data && data.toLowerCase().includes('begin:vcalendar')) {
          icalData = data;
          successfulUrl = calendar.url;
          console.log('Direct fetch successful');
        }
      }
    } catch (error) {
      console.log('Direct fetch failed, trying proxies:', error);
    }

    // Try CORS proxies if direct fetch failed
    if (!icalData) {
      for (const proxyFn of CORS_PROXIES) {
        try {
          const proxyUrl = proxyFn(calendar.url);
          console.log('Trying proxy:', proxyUrl);
          
          const response = await fetch(proxyUrl);
          if (response.ok) {
            const data = await response.text();
            if (data && data.toLowerCase().includes('begin:vcalendar')) {
              icalData = data;
              successfulUrl = proxyUrl;
              console.log('Proxy fetch successful with:', proxyUrl);
              break;
            }
          }
        } catch (error) {
          console.log('Proxy failed:', proxyFn.name, error);
          continue;
        }
      }
    }

    if (!icalData) {
      setSyncStatus(prev => ({ ...prev, [calendar.id]: 'error' }));
      throw new Error('Unable to fetch calendar data from any source');
    }

    try {
      console.log('Parsing iCal data...');
      const jcalData = ICAL.parse(icalData);
      const vcalendar = new ICAL.Component(jcalData);
      const vevents = vcalendar.getAllSubcomponents('vevent');

      console.log(`Found ${vevents.length} events in calendar`);

      const allEvents: any[] = [];
      vevents.forEach((vevent) => {
        try {
          const event = new ICAL.Event(vevent);
          const eventOccurrences = expandRecurringEvent(event, calendar);
          allEvents.push(...eventOccurrences);
        } catch (eventError) {
          console.warn('Error processing individual event:', eventError);
        }
      });

      console.log(`Total events processed: ${allEvents.length}`);

      // Get existing events from localStorage
      const existingEvents = JSON.parse(localStorage.getItem(ICAL_EVENTS_KEY) || '[]');
      
      // Create a map of existing events for this calendar
      const existingEventMap = new Map();
      const filteredExisting = existingEvents.filter((event: any) => {
        if (event.calendarId === calendar.id) {
          existingEventMap.set(event.id, event);
          return false; // Remove from filtered list
        }
        return true; // Keep events from other calendars
      });

      // Compare and update events
      const updatedEvents: any[] = [];
      let newCount = 0;
      let updatedCount = 0;

      for (const newEvent of allEvents) {
        const existingEvent = existingEventMap.get(newEvent.id);
        
        if (!existingEvent) {
          // New event
          updatedEvents.push(newEvent);
          newCount++;
        } else {
          // Check if event has changed
          const hasChanged = 
            existingEvent.title !== newEvent.title ||
            existingEvent.time !== newEvent.time ||
            existingEvent.location !== newEvent.location ||
            existingEvent.description !== newEvent.description ||
            existingEvent.date.getTime() !== newEvent.date.getTime();

          if (hasChanged) {
            updatedEvents.push(newEvent);
            updatedCount++;
          } else {
            updatedEvents.push(existingEvent);
          }
          
          // Remove from existing map to track deletions
          existingEventMap.delete(newEvent.id);
        }
      }

      // Combine with events from other calendars
      const combinedEvents = [...filteredExisting, ...updatedEvents];
      localStorage.setItem(ICAL_EVENTS_KEY, JSON.stringify(combinedEvents));
      
      // Dispatch event to notify components of the update
      window.dispatchEvent(new CustomEvent('ical-events-updated', { 
        detail: { calendarId: calendar.id, eventCount: allEvents.length } 
      }));
      
      console.log(`Calendar sync complete: ${newCount} new events, ${updatedCount} updated events, ${existingEventMap.size} removed events`);

      // Update calendar metadata
      await updateCalendar(calendar.id, {
        lastSync: new Date().toISOString(),
        eventCount: allEvents.length
      });

      setSyncStatus(prev => ({ ...prev, [calendar.id]: 'success' }));
      
      return {
        success: true,
        eventCount: allEvents.length,
        newEvents: newCount,
        updatedEvents: updatedCount,
        removedEvents: existingEventMap.size
      };

    } catch (parseError) {
      console.error('Error parsing calendar data:', parseError);
      setSyncStatus(prev => ({ ...prev, [calendar.id]: 'error' }));
      throw new Error(`Failed to parse calendar data: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
  }, [updateCalendar]);

  const syncAllCalendars = useCallback(async () => {
    const enabledCalendars = calendars.filter(cal => cal.enabled);
    console.log('Syncing all enabled calendars:', enabledCalendars.length);

    if (isBackgroundSyncSupported) {
      await triggerBackgroundSync();
    }

    // Also do immediate sync
    for (const calendar of enabledCalendars) {
      try {
        await syncCalendar(calendar);
      } catch (error) {
        console.error(`Failed to sync calendar ${calendar.name}:`, error);
      }
    }
  }, [calendars, syncCalendar, isBackgroundSyncSupported, triggerBackgroundSync]);

  const getICalEvents = useCallback(() => {
    try {
      const stored = localStorage.getItem(ICAL_EVENTS_KEY);
      console.log('Loading iCal events from localStorage:', stored ? 'Found events' : 'No events');
      
      if (stored) {
        const events = JSON.parse(stored);
        const processedEvents = events.map((event: any) => ({
          ...event,
          date: new Date(event.date)
        }));
        console.log(`Loaded ${processedEvents.length} iCal events`);
        return processedEvents;
      }
      return [];
    } catch (error) {
      console.error('Error loading iCal events:', error);
      return [];
    }
  }, []);

  const forceRefresh = useCallback(() => {
    console.log('Force refreshing iCal calendars');
    loadCalendars();
    processSyncQueue();
    // Force a state update to trigger reactivity in components
    setCalendars(prev => [...prev]);
  }, [loadCalendars, processSyncQueue]);

  useEffect(() => {
    console.log('useICalCalendars hook initializing');
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
    getICalEvents,
    forceRefresh,
    isBackgroundSyncSupported,
    triggerBackgroundSync
  };
};
