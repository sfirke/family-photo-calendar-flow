
import { useState, useEffect, useMemo } from 'react';
import { useLocalEvents } from './useLocalEvents';

const CALENDAR_SELECTION_KEY = 'family_calendar_selected_calendars';

interface CalendarFromEvents {
  id: string;
  summary: string;
  color: string;
  url?: string;
  hasEvents: boolean;
  eventCount: number;
  lastSync?: string;
  primary?: boolean;
}

export const useCalendarSelection = () => {
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const { events } = useLocalEvents();

  // Load selected calendars from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CALENDAR_SELECTION_KEY);
      if (stored) {
        const selected = JSON.parse(stored);
        setSelectedCalendarIds(selected);
      } else {
        // Default to showing all calendars
        setSelectedCalendarIds(['local_calendar']);
      }
    } catch (error) {
      console.error('Error loading calendar selection:', error);
      setSelectedCalendarIds(['local_calendar']);
    }
  }, []);

  // Save selected calendars to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CALENDAR_SELECTION_KEY, JSON.stringify(selectedCalendarIds));
    } catch (error) {
      console.error('Error saving calendar selection:', error);
    }
  }, [selectedCalendarIds]);

  // Derive calendar data from events
  const calendarsFromEvents = useMemo(() => {
    const calendarMap = new Map<string, CalendarFromEvents>();

    events.forEach(event => {
      if (!calendarMap.has(event.calendarId)) {
        calendarMap.set(event.calendarId, {
          id: event.calendarId,
          summary: event.calendarName,
          color: event.color,
          url: event.source === 'ical' ? event.organizer : undefined,
          hasEvents: true,
          eventCount: 1,
          lastSync: event.lastSync,
          primary: event.calendarId === 'local_calendar'
        });
      } else {
        const calendar = calendarMap.get(event.calendarId)!;
        calendar.eventCount += 1;
        calendarMap.set(event.calendarId, calendar);
      }
    });

    return Array.from(calendarMap.values());
  }, [events]);

  // Toggle calendar selection
  const toggleCalendar = (calendarId: string, checked: boolean) => {
    setSelectedCalendarIds(prev => {
      if (checked) {
        return [...new Set([...prev, calendarId])];
      } else {
        return prev.filter(id => id !== calendarId);
      }
    });
  };

  // Select all calendars
  const selectAllCalendars = () => {
    const allCalendarIds = calendarsFromEvents.map(cal => cal.id);
    setSelectedCalendarIds([...new Set([...allCalendarIds, 'local_calendar'])]);
  };

  // Select calendars with events
  const selectCalendarsWithEvents = () => {
    const calendarsWithEventsIds = calendarsFromEvents
      .filter(cal => cal.hasEvents)
      .map(cal => cal.id);
    setSelectedCalendarIds(calendarsWithEventsIds);
  };

  // Clear all calendars
  const clearAllCalendars = () => {
    setSelectedCalendarIds([]);
  };

  // Update selected calendars
  const updateSelectedCalendars = (calendarIds: string[]) => {
    setSelectedCalendarIds(calendarIds);
  };

  // Cleanup deleted calendar
  const cleanupDeletedCalendar = (calendarId: string) => {
    setSelectedCalendarIds(prev => prev.filter(id => id !== calendarId));
  };

  // Deselect all calendars (alias for clearAllCalendars)
  const deselectAllCalendars = () => {
    clearAllCalendars();
  };

  return {
    selectedCalendarIds,
    calendarsFromEvents,
    isLoading: false,
    toggleCalendar,
    selectAllCalendars,
    selectCalendarsWithEvents,
    clearAllCalendars,
    updateSelectedCalendars,
    cleanupDeletedCalendar,
    deselectAllCalendars
  };
};
