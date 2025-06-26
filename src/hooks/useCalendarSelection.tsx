
import { useState, useEffect, useMemo } from 'react';
import { useLocalEvents } from '@/hooks/useLocalEvents';
import { useICalCalendars } from '@/hooks/useICalCalendars';

const SELECTED_CALENDARS_KEY = 'family_calendar_selected_calendars';

export const useCalendarSelection = () => {
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const { localEvents } = useLocalEvents();
  const { getICalEvents, calendars: iCalCalendars } = useICalCalendars();
  const [isLoading, setIsLoading] = useState(false);

  // Get all events (local + iCal)
  const allEvents = useMemo(() => {
    const iCalEvents = getICalEvents();
    return [...localEvents, ...iCalEvents];
  }, [localEvents, getICalEvents]);

  // Generate calendars from all events + iCal calendars (even if they don't have events yet)
  const calendarsFromEvents = useMemo(() => {
    const calendarMap = new Map();
    
    // Count events by calendar
    const calendarEventCounts = new Map();
    allEvents.forEach(event => {
      const calendarId = event.calendarId || 'local_calendar';
      calendarEventCounts.set(calendarId, (calendarEventCounts.get(calendarId) || 0) + 1);
    });

    // Add ALL iCal calendars to always show them in the Calendar Feeds section
    iCalCalendars.forEach(iCalCalendar => {
      calendarMap.set(iCalCalendar.id, {
        id: iCalCalendar.id,
        summary: iCalCalendar.name,
        primary: false,
        eventCount: calendarEventCounts.get(iCalCalendar.id) || 0,
        hasEvents: calendarEventCounts.has(iCalCalendar.id)
      });
    });

    // Process events to add any additional calendars not already in the map
    // but skip local_calendar - don't include it in available calendars
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
          hasEvents: false
        });
      }
      
      const calendar = calendarMap.get(calendarId);
      calendar.eventCount = calendarEventCounts.get(calendarId) || 0;
      calendar.hasEvents = calendarEventCounts.has(calendarId);
    });

    return Array.from(calendarMap.values()).sort((a, b) => {
      if (a.eventCount !== b.eventCount) return b.eventCount - a.eventCount;
      return a.summary.localeCompare(b.summary);
    });
  }, [allEvents, iCalCalendars]);

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

  return {
    selectedCalendarIds,
    calendarsFromEvents,
    isLoading,
    updateSelectedCalendars,
    toggleCalendar,
    selectAllCalendars,
    selectCalendarsWithEvents,
    clearAllCalendars,
    cleanupDeletedCalendar
  };
};
