
import { useState, useEffect, useMemo } from 'react';
import { useLocalEvents } from '@/hooks/useLocalEvents';
import { useICalCalendars } from '@/hooks/useICalCalendars';
import { useNotionCalendars } from '@/hooks/useNotionCalendars';

const SELECTED_CALENDARS_KEY = 'family_calendar_selected_calendars';

export const useCalendarSelection = () => {
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const { localEvents } = useLocalEvents();
  const { getICalEvents, calendars: iCalCalendars } = useICalCalendars();
  const { events: notionEvents, calendars: notionCalendars } = useNotionCalendars();
  const [isLoading, setIsLoading] = useState(false);

  // Force refresh of calendar selection when calendars change
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [iCalCalendars.length, notionCalendars.length]);

  // Get all events (local + iCal + Notion) with defensive programming
  const allEvents = useMemo(() => {
    try {
      const safeLocalEvents = Array.isArray(localEvents) ? localEvents : [];
      const iCalEvents = getICalEvents();
      const safeICalEvents = Array.isArray(iCalEvents) ? iCalEvents : [];
      const safeNotionEvents = Array.isArray(notionEvents) ? notionEvents : [];
      
      // Convert Notion events to Event format for counting
      const convertedNotionEvents = safeNotionEvents.map(notionEvent => ({
        id: notionEvent.id,
        title: notionEvent.title,
        time: notionEvent.time,
        location: notionEvent.location || '',
        attendees: 0,
        category: 'Personal' as const,
        color: notionEvent.color,
        description: notionEvent.description || '',
        organizer: 'Notion',
        date: notionEvent.date,
        calendarId: notionEvent.calendarId,
        calendarName: notionEvent.calendarName,
        source: 'notion' as const
      }));
      
      return [...safeLocalEvents, ...safeICalEvents, ...convertedNotionEvents];
    } catch (error) {
      console.warn('Error combining events in useCalendarSelection:', error);
      return [];
    }
  }, [localEvents, getICalEvents, notionEvents, refreshKey]);

  // Generate calendars from all events + iCal + Notion calendars
  const calendarsFromEvents = useMemo(() => {
    const calendarMap = new Map();
    
    // Count events by calendar
    const calendarEventCounts = new Map();
    
    // Safely iterate over allEvents
    if (Array.isArray(allEvents)) {
      allEvents.forEach(event => {
        const calendarId = event.calendarId || 'local_calendar';
        calendarEventCounts.set(calendarId, (calendarEventCounts.get(calendarId) || 0) + 1);
      });
    }

    // Add ALL iCal calendars
    if (Array.isArray(iCalCalendars)) {
      iCalCalendars.forEach(iCalCalendar => {
        calendarMap.set(iCalCalendar.id, {
          id: iCalCalendar.id,
          summary: iCalCalendar.name,
          primary: false,
          eventCount: calendarEventCounts.get(iCalCalendar.id) || 0,
          hasEvents: calendarEventCounts.has(iCalCalendar.id),
          color: iCalCalendar.color,
          enabled: iCalCalendar.enabled,
          lastSync: iCalCalendar.lastSync,
          url: iCalCalendar.url
        });
      });
    }

    // Add ALL Notion calendars
    if (Array.isArray(notionCalendars)) {
      notionCalendars.forEach(notionCalendar => {
        calendarMap.set(notionCalendar.id, {
          id: notionCalendar.id,
          summary: notionCalendar.name,
          primary: false,
          eventCount: calendarEventCounts.get(notionCalendar.id) || 0,
          hasEvents: calendarEventCounts.has(notionCalendar.id),
          color: notionCalendar.color,
          enabled: notionCalendar.enabled,
          lastSync: notionCalendar.lastSync,
          url: notionCalendar.url,
          type: 'notion'
        });
      });
    }

    // Process events to add any additional calendars not already in the map
    // but skip local_calendar - don't include it in available calendars
    if (Array.isArray(allEvents)) {
      allEvents.forEach(event => {
        const calendarId = event.calendarId || 'local_calendar';
        const calendarName = event.calendarName || 'Family Calendar';
        
        // Skip local calendar - don't include it in available calendars
        if (calendarId === 'local_calendar') {
          return;
        }
        
        if (!calendarMap.has(calendarId)) {
          calendarMap.set(calendarId, {
            id: calendarId,
            summary: calendarName,
            primary: false,
            eventCount: 0,
            hasEvents: false,
            color: event.color || '#3b82f6'
          });
        }
        
        const calendar = calendarMap.get(calendarId);
        calendar.eventCount = calendarEventCounts.get(calendarId) || 0;
        calendar.hasEvents = calendarEventCounts.has(calendarId);
      });
    }

    return Array.from(calendarMap.values()).sort((a, b) => {
      if (a.eventCount !== b.eventCount) return b.eventCount - a.eventCount;
      return a.summary.localeCompare(b.summary);
    });
  }, [allEvents, iCalCalendars, notionCalendars, refreshKey]);

  // Load selected calendars from localStorage
  useEffect(() => {
    const savedSelection = localStorage.getItem(SELECTED_CALENDARS_KEY);
    if (savedSelection) {
      try {
        const parsedSelection = JSON.parse(savedSelection);
        // Filter out any selected calendars that no longer exist
        const validSelection = parsedSelection.filter((id: string) => 
          calendarsFromEvents.some(cal => cal.id === id)
        );
        setSelectedCalendarIds(validSelection);
        
        // Update localStorage if selection was filtered
        if (validSelection.length !== parsedSelection.length) {
          localStorage.setItem(SELECTED_CALENDARS_KEY, JSON.stringify(validSelection));
        }
      } catch (error) {
        console.error('Error loading calendar selection:', error);
        // Default to all available calendars
        const allCalendarIds = calendarsFromEvents.map(cal => cal.id);
        setSelectedCalendarIds(allCalendarIds);
      }
    } else {
      // Default to all available calendars
      const allCalendarIds = calendarsFromEvents.map(cal => cal.id);
      setSelectedCalendarIds(allCalendarIds);
    }
  }, [calendarsFromEvents]);

  // Save selected calendars to localStorage
  const saveSelection = (calendarIds: string[]) => {
    localStorage.setItem(SELECTED_CALENDARS_KEY, JSON.stringify(calendarIds));
    setSelectedCalendarIds(calendarIds);
  };

  const updateSelectedCalendars = (calendarIds: string[]) => {
    saveSelection(calendarIds);
  };

  const toggleCalendar = (calendarId: string, selected: boolean) => {
    if (selected) {
      if (!selectedCalendarIds.includes(calendarId)) {
        saveSelection([...selectedCalendarIds, calendarId]);
      }
    } else {
      saveSelection(selectedCalendarIds.filter(id => id !== calendarId));
    }
  };

  const selectAllCalendars = () => {
    const allCalendarIds = calendarsFromEvents.map(cal => cal.id);
    saveSelection(allCalendarIds);
  };

  const selectCalendarsWithEvents = () => {
    const calendarsWithEventsIds = calendarsFromEvents
      .filter(cal => cal.hasEvents)
      .map(cal => cal.id);
    saveSelection(calendarsWithEventsIds);
  };

  const clearAllCalendars = () => {
    saveSelection([]);
  };

  // Clean up deleted calendars from selection
  const cleanupDeletedCalendar = (deletedCalendarId: string) => {
    const updatedSelection = selectedCalendarIds.filter(id => id !== deletedCalendarId);
    saveSelection(updatedSelection);
  };

  // Force refresh function for external use
  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return {
    selectedCalendarIds,
    calendarsFromEvents,
    isLoading,
    updateSelectedCalendars,
    toggleCalendar,
    selectAllCalendars,
    selectCalendarsWithEvents,
    clearAllCalendars,
    cleanupDeletedCalendar,
    forceRefresh,
    // Include Notion events for the filtering hook
    notionEvents
  };
};
