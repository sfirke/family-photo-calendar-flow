
import { useState, useEffect } from 'react';
import { Event } from '@/types/calendar';
import { useICalCalendars } from './useICalCalendars';

export const useLocalEvents = () => {
  const [googleEvents, setGoogleEvents] = useState<Event[]>([]);
  const { calendars: iCalCalendars, getICalEvents } = useICalCalendars();

  useEffect(() => {
    // Get all iCal events from storage
    const iCalEvents = getICalEvents();
    
    // Filter events for enabled calendars only
    const enabledCalendarIds = iCalCalendars
      .filter(cal => cal.enabled)
      .map(cal => cal.id);
    
    const filteredEvents = iCalEvents.filter(event => 
      enabledCalendarIds.includes(event.calendarId)
    );
    
    setGoogleEvents(filteredEvents);
  }, [iCalCalendars, getICalEvents]);

  return {
    googleEvents,
    isLoading: false
  };
};
