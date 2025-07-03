
import { useState, useEffect } from 'react';
import { Event } from '@/types/calendar';
import { useICalCalendars } from './useICalCalendars';

export const useLocalEvents = () => {
  const [googleEvents, setGoogleEvents] = useState<Event[]>([]);
  const { calendars: iCalCalendars, getICalEvents } = useICalCalendars();

  useEffect(() => {
    // Get ALL iCal events from storage - don't filter by enabled status here
    // Let useIntegratedEvents handle all filtering logic
    const iCalEvents = getICalEvents();
    
    console.log('🔄 useLocalEvents - Loading all iCal events:', {
      totalEvents: iCalEvents.length,
      calendarsCount: iCalCalendars.length
    });
    
    setGoogleEvents(iCalEvents);
  }, [iCalCalendars, getICalEvents]);

  return {
    googleEvents,
    isLoading: false
  };
};
