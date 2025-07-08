
import { useState, useEffect } from 'react';
import { Event } from '@/types/calendar';
import { useICalCalendars } from './useICalCalendars';

export const useLocalEvents = () => {
  const [googleEvents, setGoogleEvents] = useState<Event[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const { calendars: iCalCalendars, getICalEvents } = useICalCalendars();

  // Listen for events updates
  useEffect(() => {
    const handleEventsUpdate = () => {
      console.log('🔄 useLocalEvents - Received events update signal');
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('ical-events-updated', handleEventsUpdate);
    window.addEventListener('background-sync-data-available', handleEventsUpdate);
    
    return () => {
      window.removeEventListener('ical-events-updated', handleEventsUpdate);
      window.removeEventListener('background-sync-data-available', handleEventsUpdate);
    };
  }, []);

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

  return {
    googleEvents,
    isLoading: false
  };
};
