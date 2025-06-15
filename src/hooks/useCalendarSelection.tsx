
import { useState, useEffect } from 'react';
import { useGoogleCalendarEvents } from '@/hooks/useGoogleCalendarEvents';

const SELECTED_CALENDARS_KEY = 'selectedCalendarIds';

interface CalendarFromEvents {
  id: string;
  summary: string;
  primary?: boolean;
  eventCount: number;
  hasEvents: boolean;
}

export const useCalendarSelection = () => {
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const { googleEvents, isLoading } = useGoogleCalendarEvents();

  // Load selected calendar IDs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SELECTED_CALENDARS_KEY);
    if (stored) {
      try {
        const parsedIds = JSON.parse(stored);
        setSelectedCalendarIds(parsedIds);
        console.log('useCalendarSelection: Loaded selected calendar IDs from localStorage:', parsedIds);
      } catch (error) {
        console.error('useCalendarSelection: Error parsing stored calendar IDs:', error);
      }
    }
  }, []);

  // Group events by calendar to create calendar list (same logic as CalendarList.tsx)
  const calendarsFromEvents: CalendarFromEvents[] = React.useMemo(() => {
    const calendarMap = new Map();
    
    googleEvents.forEach(event => {
      const calendarId = event.calendarId || 'primary';
      const calendarName = event.calendarName || 'Primary Calendar';
      
      if (!calendarMap.has(calendarId)) {
        calendarMap.set(calendarId, {
          id: calendarId,
          summary: calendarName,
          primary: calendarId === 'primary',
          eventCount: 0,
          hasEvents: false
        });
      }
      
      const calendar = calendarMap.get(calendarId);
      calendar.eventCount += 1;
      calendar.hasEvents = true;
    });

    return Array.from(calendarMap.values());
  }, [googleEvents]);

  // Auto-select all calendars when they are first loaded and no selection exists
  useEffect(() => {
    if (calendarsFromEvents.length > 0 && selectedCalendarIds.length === 0) {
      const allCalendarIds = calendarsFromEvents.map(cal => cal.id);
      setSelectedCalendarIds(allCalendarIds);
      localStorage.setItem(SELECTED_CALENDARS_KEY, JSON.stringify(allCalendarIds));
      console.log('useCalendarSelection: Auto-selecting all calendars on first load:', allCalendarIds);
    }
  }, [calendarsFromEvents, selectedCalendarIds.length]);

  // Update selected calendars and persist to localStorage
  const updateSelectedCalendars = (newSelectedIds: string[]) => {
    setSelectedCalendarIds(newSelectedIds);
    localStorage.setItem(SELECTED_CALENDARS_KEY, JSON.stringify(newSelectedIds));
    console.log('useCalendarSelection: Updated selected calendar IDs:', newSelectedIds);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('localStorageChange', {
      detail: { key: SELECTED_CALENDARS_KEY, newValue: JSON.stringify(newSelectedIds) }
    }));
  };

  const selectAllCalendars = () => {
    const allIds = calendarsFromEvents.map(cal => cal.id);
    updateSelectedCalendars(allIds);
  };

  const selectCalendarsWithEvents = () => {
    const calendarsWithEventsIds = calendarsFromEvents
      .filter(cal => cal.hasEvents)
      .map(cal => cal.id);
    updateSelectedCalendars(calendarsWithEventsIds);
    console.log('useCalendarSelection: Selected only calendars with events:', calendarsWithEventsIds);
  };

  const clearAllCalendars = () => {
    updateSelectedCalendars([]);
  };

  const toggleCalendar = (calendarId: string, checked: boolean) => {
    const calendarName = calendarsFromEvents.find(cal => cal.id === calendarId)?.summary || calendarId;
    console.log('useCalendarSelection: Calendar toggle requested:', { calendarId, calendarName, checked });
    
    let newSelection: string[];
    
    if (checked) {
      newSelection = [...selectedCalendarIds, calendarId];
    } else {
      newSelection = selectedCalendarIds.filter(id => id !== calendarId);
    }
    
    updateSelectedCalendars(newSelection);
  };

  // Listen for storage changes from other components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SELECTED_CALENDARS_KEY && e.newValue) {
        try {
          const newSelectedIds = JSON.parse(e.newValue);
          setSelectedCalendarIds(newSelectedIds);
        } catch (error) {
          console.error('useCalendarSelection: Error parsing storage event data:', error);
        }
      }
    };

    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === SELECTED_CALENDARS_KEY) {
        try {
          const newSelectedIds = JSON.parse(e.detail.newValue);
          setSelectedCalendarIds(newSelectedIds);
        } catch (error) {
          console.error('useCalendarSelection: Error parsing custom event data:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChange' as any, handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange' as any, handleCustomStorageChange);
    };
  }, []);

  return {
    selectedCalendarIds,
    calendarsFromEvents,
    isLoading,
    toggleCalendar,
    selectAllCalendars,
    selectCalendarsWithEvents,
    clearAllCalendars,
    updateSelectedCalendars
  };
};
