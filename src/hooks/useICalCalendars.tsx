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

  // Load calendars from localStorage with better error handling
  const loadCalendars = useCallback(() => {
    try {
      const stored = localStorage.getItem(ICAL_CALENDARS_KEY);
      console.log('Loading calendars from localStorage:', stored);
      
      if (stored) {
        const parsedCalendars = JSON.parse(stored);
        console.log('Parsed calendars from storage:', parsedCalendars);
        
        // CRITICAL FIX: Preserve all fields exactly as stored, especially URL
        const validatedCalendars = parsedCalendars.map((cal: any) => {
          const validatedCal = {
            id: cal.id || Date.now().toString(),
            name: cal.name || 'Unknown Calendar',
            url: cal.url || '', // PRESERVE the original URL - don't modify it
            color: cal.color || '#3b82f6',
            enabled: cal.enabled !== undefined ? cal.enabled : true,
            lastSync: cal.lastSync,
            eventCount: cal.eventCount || 0
          };
          
          console.log(`Calendar ${cal.name}: URL preserved as "${validatedCal.url}"`);
          return validatedCal;
        });
        
        console.log('Final validated calendars with preserved URLs:', validatedCalendars);
        setCalendars(validatedCalendars);
        return validatedCalendars;
      } else {
        console.log('No calendars found in localStorage');
        setCalendars([]);
        return [];
      }
    } catch (error) {
      console.error('Error loading iCal calendars:', error);
      setCalendars([]);
      return [];
    }
  }, []);

  // Save calendars to localStorage ensuring URLs are preserved
  const saveCalendars = useCallback((newCalendars: ICalCalendar[]) => {
    try {
      console.log('Saving calendars to localStorage with URLs:', newCalendars.map(cal => ({ id: cal.id, name: cal.name, url: cal.url })));
      
      // Ensure all required fields are present and URLs are preserved EXACTLY
      const calendarData = newCalendars.map(cal => ({
        id: cal.id,
        name: cal.name,
        url: cal.url, // CRITICAL: Always preserve the URL exactly as provided
        color: cal.color,
        enabled: cal.enabled,
        lastSync: cal.lastSync,
        eventCount: cal.eventCount || 0
      }));
      
      const jsonData = JSON.stringify(calendarData, null, 2);
      localStorage.setItem(ICAL_CALENDARS_KEY, jsonData);
      console.log('Calendars saved successfully with URLs preserved');
      
      // Update state immediately with the exact same data
      setCalendars(calendarData);
      
      // Verify the save was successful
      const verification = localStorage.getItem(ICAL_CALENDARS_KEY);
      const verifiedData = JSON.parse(verification || '[]');
      console.log('Verification - URLs in saved data:', verifiedData.map((cal: any) => ({ id: cal.id, url: cal.url })));
      
      return true;
    } catch (error) {
      console.error('Error saving iCal calendars:', error);
      return false;
    }
  }, []);

  // Add a new iCal calendar with proper URL storage
  const addCalendar = useCallback((calendar: Omit<ICalCalendar, 'id'>) => {
    console.log('Adding new calendar with URL:', calendar.url);
    
    // Validate required fields
    if (!calendar.name || !calendar.url) {
      throw new Error('Calendar name and URL are required');
    }
    
    // Trim and validate the URL
    const trimmedUrl = calendar.url.trim();
    if (!trimmedUrl) {
      throw new Error('Calendar URL cannot be empty');
    }
    
    const newCalendar: ICalCalendar = {
      id: `ical_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: calendar.name.trim(),
      url: trimmedUrl, // Store the URL exactly as provided
      color: calendar.color || '#3b82f6',
      enabled: calendar.enabled !== undefined ? calendar.enabled : true,
      eventCount: 0
    };
    
    console.log('New calendar object created with URL:', newCalendar.url);
    
    const updatedCalendars = [...calendars, newCalendar];
    
    if (saveCalendars(updatedCalendars)) {
      console.log('Calendar added successfully with URL stored:', newCalendar.url);
      return newCalendar;
    } else {
      throw new Error('Failed to save calendar to localStorage');
    }
  }, [calendars, saveCalendars]);

  // Update an existing calendar - PRESERVE URL unless explicitly changed
  const updateCalendar = useCallback((id: string, updates: Partial<ICalCalendar>) => {
    console.log('Updating calendar:', id, 'with updates:', updates);
    const updated = calendars.map(cal => {
      if (cal.id === id) {
        const updatedCal = { ...cal, ...updates };
        console.log(`Calendar ${id} URL after update: "${updatedCal.url}"`);
        return updatedCal;
      }
      return cal;
    });
    
    if (saveCalendars(updated)) {
      console.log('Calendar updated successfully');
    } else {
      console.error('Failed to update calendar');
    }
  }, [calendars, saveCalendars]);

  // Remove a calendar and clean up all related data
  const removeCalendar = useCallback((id: string) => {
    console.log('Removing calendar:', id);
    
    // Remove from calendars list
    const updated = calendars.filter(cal => cal.id !== id);
    saveCalendars(updated);
    
    // Clean up sync status
    setSyncStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[id];
      return newStatus;
    });
    
    // Remove events from this calendar from localStorage
    try {
      const storedEvents = localStorage.getItem(ICAL_EVENTS_KEY);
      if (storedEvents) {
        const events = JSON.parse(storedEvents);
        const filteredEvents = events.filter((event: any) => event.calendarId !== id);
        localStorage.setItem(ICAL_EVENTS_KEY, JSON.stringify(filteredEvents));
        console.log('Calendar events removed from localStorage');
      }
    } catch (error) {
      console.error('Error removing calendar events:', error);
    }
    
    console.log(`Calendar ${id} completely removed from storage`);
  }, [calendars, saveCalendars]);

  // Validate iCal data format
  const isValidICalData = (data: string): boolean => {
    if (!data || typeof data !== 'string') {
      return false;
    }

    // Check for common error responses
    const errorIndicators = [
      'offline', 'error', 'not found', '404', '500', '503',
      'access denied', 'forbidden', 'unauthorized', 'timeout',
      'maintenance', 'unavailable'
    ];
    
    const lowerData = data.toLowerCase().trim();
    
    // If the response is very short and contains error keywords, it's likely an error
    if (data.length < 50 && errorIndicators.some(indicator => lowerData.includes(indicator))) {
      console.log('Data appears to be an error message:', data.substring(0, 100));
      return false;
    }

    // Check for basic iCal structure
    const hasVCalendar = lowerData.includes('begin:vcalendar');
    const hasVEvent = lowerData.includes('begin:vevent');
    
    if (!hasVCalendar) {
      console.log('Data does not contain BEGIN:VCALENDAR');
      return false;
    }

    return true;
  };

  // Check if event is in current year
  const isEventInCurrentYear = (eventDate: Date): boolean => {
    const currentYear = new Date().getFullYear();
    return eventDate.getFullYear() === currentYear;
  };

  // Check if an event is multi-day based on its duration
  const isMultiDayEvent = (event: ICAL.Event): boolean => {
    try {
      if (!event.startDate || !event.endDate) {
        return false;
      }

      // For all-day events, check if the duration is more than 1 day
      if (event.startDate.isDate && event.endDate.isDate) {
        const startDate = event.startDate.toJSDate();
        const endDate = event.endDate.toJSDate();
        
        // Calculate the difference in days
        const diffTime = endDate.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays > 1;
      }

      return false;
    } catch (error) {
      console.warn('Error checking if event is multi-day:', error);
      return false;
    }
  };

  // Generate event occurrences for multi-day events
  const generateMultiDayOccurrences = (event: ICAL.Event, calendar: ICalCalendar): any[] => {
    const occurrences: any[] = [];
    
    try {
      if (!isMultiDayEvent(event)) {
        // Single day event
        const eventDate = event.startDate.toJSDate();
        if (isEventInCurrentYear(eventDate)) {
          occurrences.push(createEventObject(event, calendar, eventDate, false, false));
        }
        return occurrences;
      }

      // Multi-day event - create occurrence for each day
      const startDate = event.startDate.toJSDate();
      const endDate = event.endDate.toJSDate();
      
      // Create an occurrence for each day the event spans
      const currentDate = new Date(startDate);
      while (currentDate < endDate && isEventInCurrentYear(currentDate)) {
        occurrences.push(createEventObject(event, calendar, new Date(currentDate), false, true));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      console.log(`Generated ${occurrences.length} occurrences for multi-day event: ${event.summary}`);
    } catch (error) {
      console.warn('Error generating multi-day occurrences:', error);
      // Fallback: create single event
      const eventDate = event.startDate ? event.startDate.toJSDate() : new Date();
      if (isEventInCurrentYear(eventDate)) {
        occurrences.push(createEventObject(event, calendar, eventDate, false, false));
      }
    }

    return occurrences;
  };

  // Generate recurring event occurrences for the current year
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
        const maxOccurrences = 366; // Limit to prevent infinite loops

        while ((next = iterator.next()) && count < maxOccurrences) {
          const occurrenceDate = next.toJSDate();
          
          // Only include occurrences within the current year
          if (occurrenceDate >= yearStart && occurrenceDate <= yearEnd) {
            // For recurring events, check if each occurrence is multi-day
            if (isMultiDayEvent(event)) {
              const multiDayOccurrences = generateMultiDayOccurrences(event, calendar);
              occurrences.push(...multiDayOccurrences);
            } else {
              occurrences.push(createEventObject(event, calendar, occurrenceDate, true, false));
            }
          }
          
          // Stop if we've passed the end of the year
          if (occurrenceDate > yearEnd) {
            break;
          }
          
          count++;
        }
      } else {
        // Non-recurring event - handle multi-day if applicable
        const multiDayOccurrences = generateMultiDayOccurrences(event, calendar);
        occurrences.push(...multiDayOccurrences);
      }
    } catch (error) {
      console.warn('Error expanding recurring event:', error);
      // Fallback: create single event
      const eventDate = event.startDate ? event.startDate.toJSDate() : new Date();
      if (isEventInCurrentYear(eventDate)) {
        occurrences.push(createEventObject(event, calendar, eventDate, false, false));
      }
    }

    return occurrences;
  };

  // Create event object with consistent structure
  const createEventObject = (event: ICAL.Event, calendar: ICalCalendar, eventDate: Date, isRecurring: boolean, isMultiDay: boolean) => {
    let timeString = 'All day';
    
    try {
      if (event.startDate && !event.startDate.isDate) {
        // Has time component
        const endDate = event.endDate ? event.endDate.toJSDate() : eventDate;
        timeString = `${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else if (isMultiDay) {
        timeString = 'All day (Multi-day)';
      }
    } catch (dateError) {
      console.warn('Error parsing event date:', dateError);
    }

    // Add recurring indicator
    if (isRecurring && !timeString.includes('Recurring')) {
      timeString = `${timeString} (Recurring)`;
    }

    return {
      id: `${Date.now()}-${Math.random()}`, // Unique ID for each occurrence
      title: event.summary || 'Untitled Event',
      time: timeString,
      location: event.location || '',
      attendees: 0,
      category: 'Personal' as const,
      color: calendar.color,
      description: event.description || '',
      organizer: calendar.name,
      date: eventDate,
      calendarId: calendar.id,
      calendarName: calendar.name,
      source: 'ical',
      isMultiDay: isMultiDay
    };
  };

  // Try fetching with different methods
  const fetchICalData = async (url: string): Promise<string> => {
    console.log('Attempting to fetch iCal from:', url);
    
    // Try direct fetch first (works for some public calendars)
    try {
      const response = await fetch(url, {
        mode: 'cors',
        headers: {
          'Accept': 'text/calendar, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (compatible; FamilyCalendarApp/1.0)',
        }
      });
      
      if (response.ok) {
        const data = await response.text();
        console.log('Direct fetch successful, data length:', data.length);
        
        if (isValidICalData(data)) {
          return data;
        } else {
          console.log('Direct fetch returned invalid iCal data');
        }
      }
    } catch (error) {
      console.log('Direct fetch failed, trying proxies:', error);
    }

    // Try CORS proxies
    for (let i = 0; i < CORS_PROXIES.length; i++) {
      try {
        const proxyUrl = CORS_PROXIES[i](url);
        console.log(`Trying proxy ${i + 1}/${CORS_PROXIES.length}:`, proxyUrl);
        
        const response = await fetch(proxyUrl, {
          headers: {
            'Accept': 'text/calendar, text/plain, */*',
          }
        });

        if (response.ok) {
          const data = await response.text();
          console.log(`Proxy ${i + 1} successful, data length:`, data.length);
          
          if (isValidICalData(data)) {
            return data;
          } else {
            console.log(`Proxy ${i + 1} returned invalid iCal data:`, data.substring(0, 100));
          }
        } else {
          console.log(`Proxy ${i + 1} failed with status:`, response.status);
        }
      } catch (error) {
        console.log(`Proxy ${i + 1} failed:`, error);
      }
    }

    throw new Error('All fetch methods failed or returned invalid data. Please check if the iCal URL is publicly accessible and returns valid calendar data.');
  };

  // Fetch and parse iCal feed using the stored URL
  const syncCalendar = useCallback(async (calendar: ICalCalendar) => {
    setIsLoading(true);
    setSyncStatus(prev => ({ ...prev, [calendar.id]: 'syncing' }));

    try {
      console.log('Syncing calendar:', calendar.name, 'with URL:', calendar.url);
      
      if (!calendar.url || calendar.url.trim() === '') {
        throw new Error('Calendar does not have a valid URL for syncing. Please re-add the calendar with a valid URL.');
      }

      const icalData = await fetchICalData(calendar.url);
      
      // Additional validation before parsing
      if (!icalData || icalData.trim().length === 0) {
        throw new Error('Received empty calendar data');
      }

      console.log('Parsing iCal data, length:', icalData.length);
      
      // Parse iCal data
      let jcalData;
      try {
        jcalData = ICAL.parse(icalData);
      } catch (parseError) {
        console.error('ICAL parsing error:', parseError);
        console.log('Problematic data sample:', icalData.substring(0, 200));
        throw new Error(`Invalid calendar format: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
      }

      const vcalendar = new ICAL.Component(jcalData);
      const vevents = vcalendar.getAllSubcomponents('vevent');

      console.log(`Processing ${vevents.length} events from calendar`);

      // Process all events and expand recurring ones
      const allEvents: any[] = [];
      vevents.forEach((vevent) => {
        const event = new ICAL.Event(vevent);
        const eventOccurrences = expandRecurringEvent(event, calendar);
        allEvents.push(...eventOccurrences);
      });

      console.log(`Expanded ${vevents.length} calendar events to ${allEvents.length} occurrences for current year (including multi-day spans)`);

      // Store events
      try {
        const existingEvents = JSON.parse(localStorage.getItem(ICAL_EVENTS_KEY) || '[]');
        const filteredExisting = existingEvents.filter((event: any) => event.calendarId !== calendar.id);
        const combinedEvents = [...filteredExisting, ...allEvents];
        localStorage.setItem(ICAL_EVENTS_KEY, JSON.stringify(combinedEvents));
        console.log('Events stored successfully in localStorage');
      } catch (error) {
        console.error('Error storing iCal events:', error);
      }

      // Update calendar with sync info - PRESERVE the URL
      updateCalendar(calendar.id, {
        lastSync: new Date().toISOString(),
        eventCount: allEvents.length
      });

      setSyncStatus(prev => ({ ...prev, [calendar.id]: 'success' }));
      console.log(`Successfully synced ${allEvents.length} event occurrences from ${calendar.name}`);
      return allEvents;

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

  // Get all iCal events with better error handling
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

  // Force refresh function
  const forceRefresh = useCallback(() => {
    console.log('Force refreshing iCal calendars');
    loadCalendars();
  }, [loadCalendars]);

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
    forceRefresh
  };
};
