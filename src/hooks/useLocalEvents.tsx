
import { useState, useEffect } from 'react';
import { Event } from '@/types/calendar';
import { useICalCalendars } from './useICalCalendars';

export const useLocalEvents = () => {
  const [googleEvents, setGoogleEvents] = useState<Event[]>([]);
  const { calendars: iCalCalendars } = useICalCalendars();

  useEffect(() => {
    // Convert iCal events to the unified Event format
    const convertICalEventsToEvents = (): Event[] => {
      const allEvents: Event[] = [];
      
      iCalCalendars.forEach(calendar => {
        if (calendar.enabled && calendar.events && calendar.events.length > 0) {
          const convertedEvents = calendar.events.map((event, index) => ({
            id: `ical_${calendar.id}_${index}`,
            title: event.summary || 'Untitled Event',
            time: event.dtstart ? new Date(event.dtstart).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : 'All day',
            location: event.location || '',
            attendees: 0,
            category: 'Personal' as const,
            color: calendar.color,
            description: event.description || '',
            organizer: 'iCal',
            date: event.dtstart ? new Date(event.dtstart) : new Date(),
            calendarId: calendar.id,
            calendarName: calendar.name,
            source: 'ical' as const
          }));
          allEvents.push(...convertedEvents);
        }
      });

      return allEvents;
    };

    const iCalEvents = convertICalEventsToEvents();
    setGoogleEvents(iCalEvents);
  }, [iCalCalendars]);

  return {
    googleEvents,
    isLoading: false
  };
};
