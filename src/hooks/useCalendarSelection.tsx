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

  // Generate calendars from all events
  const calendarsFromEvents = useMemo(() => {
    const calendarMap = new Map();
    
    // Count events by calendar
    const calendarEventCounts = new Map();
    allEvents.forEach(event => {
      const calendarId = event.calendarId || 'local_calendar';
      calendarEventCounts.set(calendarId, (calendarEventCounts.get(calendarId) || 0) + 1);
    });

    // Check if we have synced iCal calendars with events
    const syncedICalCalendars = iCalCalendars.filter(cal => 
      cal.enabled && cal.lastSync && cal.eventCount && cal.eventCount > 0
    );
    const hasSyncedICalEvents = syncedICalCalendars.length > 0;
    
    const localCalendarHasEvents = calendarEventCounts.get('local_calendar') > 0;

    // Hide local calendar if:
    // 1. We have synced iCal calendars with events, AND
    // 2. Local calendar has no events
    const shouldHideLocalCalendar = hasSyncedICalEvents && !localCalendarHasEvents;

    allEvents.forEach(event => {
      const calendarId = event.calendarId || 'local_calendar';
      const calendarName = event.calendarName || 'Family Calendar';
      
      // Skip local calendar if it should be hidden
      if (calendarId === 'local_calendar' && shouldHideLocalCalendar) {
        return;
      }
      
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

    // Always include local calendar if no synced iCal calendars exist and local has events
    if (!hasSyncedICalEvents && localCalendarHasEvents) {
      if (!calendarMap.has('local_calendar')) {
        calendarMap.set('local_calendar', {
          id: 'local_calendar',
          summary: 'Family Calendar',
          primary: true,
          eventCount: calendarEventCounts.get('local_calendar') || 0,
          hasEvents: localCalendarHasEvents
        });
      }
    }

    return Array.from(calendarMap.values()).sort((a, b) => {
      if (a.primary && !b.primary) return -1;
      if (!a.primary && b.primary) return 1;
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
