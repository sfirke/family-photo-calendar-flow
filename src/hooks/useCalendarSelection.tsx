
import { useState, useEffect, useMemo } from 'react';
import { useLocalEvents } from '@/hooks/useLocalEvents';

const SELECTED_CALENDARS_KEY = 'family_calendar_selected_calendars';

export const useCalendarSelection = () => {
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const { localEvents } = useLocalEvents();
  const [isLoading, setIsLoading] = useState(false);

  // Generate calendars from local events
  const calendarsFromEvents = useMemo(() => {
    const calendarMap = new Map();
    
    // Always include the default local calendar
    calendarMap.set('local_calendar', {
      id: 'local_calendar',
      summary: 'Family Calendar',
      primary: true,
      eventCount: 0,
      hasEvents: false
    });

    localEvents.forEach(event => {
      const calendarId = event.calendarId || 'local_calendar';
      const calendarName = event.calendarName || 'Family Calendar';
      
      if (!calendarMap.has(calendarId)) {
        calendarMap.set(calendarId, {
          id: calendarId,
          summary: calendarName,
          primary: calendarId === 'local_calendar',
          eventCount: 0,
          hasEvents: false
        });
      }
      
      const calendar = calendarMap.get(calendarId);
      calendar.eventCount += 1;
      calendar.hasEvents = true;
    });

    return Array.from(calendarMap.values()).sort((a, b) => {
      if (a.primary && !b.primary) return -1;
      if (!a.primary && b.primary) return 1;
      if (a.eventCount !== b.eventCount) return b.eventCount - a.eventCount;
      return a.summary.localeCompare(b.summary);
    });
  }, [localEvents]);

  // Load selected calendars from localStorage
  useEffect(() => {
    const savedSelection = localStorage.getItem(SELECTED_CALENDARS_KEY);
    if (savedSelection) {
      try {
        const parsedSelection = JSON.parse(savedSelection);
        setSelectedCalendarIds(parsedSelection);
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

  return {
    selectedCalendarIds,
    calendarsFromEvents,
    isLoading,
    updateSelectedCalendars,
    toggleCalendar,
    selectAllCalendars,
    selectCalendarsWithEvents,
    clearAllCalendars
  };
};
