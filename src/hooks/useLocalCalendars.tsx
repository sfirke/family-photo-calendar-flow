
import { useState, useEffect, useMemo } from 'react';
import { Event } from '@/types/calendar';

interface LocalCalendar {
  id: string;
  summary: string;
  primary?: boolean;
  eventCount: number;
  hasEvents: boolean;
}

export const useLocalCalendars = (events: Event[] = []) => {
  const [calendars, setCalendars] = useState<LocalCalendar[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate calendars from events
  const calendarsFromEvents = useMemo(() => {
    const calendarMap = new Map<string, LocalCalendar>();
    
    // Always include the default local calendar
    calendarMap.set('local_calendar', {
      id: 'local_calendar',
      summary: 'Family Calendar',
      primary: true,
      eventCount: 0,
      hasEvents: false
    });

    // Count events per calendar
    events.forEach(event => {
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
      if (calendar) {
        calendar.eventCount += 1;
        calendar.hasEvents = true;
      }
    });

    return Array.from(calendarMap.values()).sort((a, b) => {
      // Sort by: primary first, then by event count (descending), then by name
      if (a.primary && !b.primary) return -1;
      if (!a.primary && b.primary) return 1;
      if (a.eventCount !== b.eventCount) return b.eventCount - a.eventCount;
      return a.summary.localeCompare(b.summary);
    });
  }, [events]);

  useEffect(() => {
    setCalendars(calendarsFromEvents);
  }, [calendarsFromEvents]);

  const fetchCalendars = async () => {
    // No-op for local calendars, they're derived from events
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 100);
  };

  return {
    calendars,
    isLoading,
    refetch: fetchCalendars
  };
};
