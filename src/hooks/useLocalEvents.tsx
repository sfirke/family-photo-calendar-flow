
import { useState, useEffect } from 'react';
import { Event } from '@/types/calendar';
import { useICalCalendars } from './useICalCalendars';

export const useLocalEvents = () => {
  const [googleEvents, setGoogleEvents] = useState<Event[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const { calendars: iCalCalendars, getICalEvents, forceRefresh: iCalForceRefresh } = useICalCalendars();

  useEffect(() => {
    // Get ALL iCal events from storage - don't filter by enabled status here
    // Let useIntegratedEvents handle all filtering logic
    const iCalEvents = getICalEvents();
    
    console.log('🔄 useLocalEvents - Loading all iCal events:', {
      totalEvents: iCalEvents.length,
      calendarsCount: iCalCalendars.length,
      refreshKey
    });
    
    setGoogleEvents(iCalEvents);
  }, [iCalCalendars, getICalEvents, refreshKey]);

  const forceRefresh = () => {
    console.log('🔄 useLocalEvents - Force refresh triggered');
    if (iCalForceRefresh) {
      iCalForceRefresh();
    }
    setRefreshKey(prev => prev + 1);
  };

  return {
    googleEvents,
    isLoading: false,
    forceRefresh
  };
};
