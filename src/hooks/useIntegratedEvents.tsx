
import { useMemo } from 'react';
import { Event } from '@/types/calendar';
import { NotionEvent } from '@/types/notion';
import { useEventFiltering } from '@/hooks/useEventFiltering';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';

export const useIntegratedEvents = (googleEvents: Event[] = []) => {
  const { selectedCalendarIds, notionEvents, scrapedEvents } = useCalendarSelection();
  
  // Ensure all arrays are safe
  const safeGoogleEvents = Array.isArray(googleEvents) ? googleEvents : [];
  const safeNotionEvents = Array.isArray(notionEvents) ? notionEvents : [];
  const safeScrapedEvents = Array.isArray(scrapedEvents) ? scrapedEvents : [];
  const safeSelectedCalendarIds = Array.isArray(selectedCalendarIds) ? selectedCalendarIds : [];
  
  console.log('📈 useIntegratedEvents - Input state:', {
    googleEvents: safeGoogleEvents.length,
    notionEvents: safeNotionEvents.length,
    scrapedEvents: safeScrapedEvents.length,
    selectedCalendarIds: safeSelectedCalendarIds.length,
    selectedIds: safeSelectedCalendarIds
  });
  
  const { filteredEvents, hasGoogleEvents, hasNotionEvents, hasScrapedEvents } = useEventFiltering({
    googleEvents: safeGoogleEvents,
    notionEvents: safeNotionEvents,
    scrapedEvents: safeScrapedEvents,
    selectedCalendarIds: safeSelectedCalendarIds
  });

  const eventStats = useMemo(() => {
    const googleEventCount = safeGoogleEvents.length;
    const notionEventCount = safeNotionEvents.length;
    const scrapedEventCount = safeScrapedEvents.length;
    const totalEvents = Array.isArray(filteredEvents) ? filteredEvents.length : 0;
    
    const stats = {
      googleEventCount,
      notionEventCount,
      scrapedEventCount,
      totalEvents,
      hasGoogleEvents,
      hasNotionEvents,
      hasScrapedEvents
    };
    
    console.log('📈 useIntegratedEvents - Event stats calculated:', stats);
    
    return stats;
  }, [safeGoogleEvents.length, safeNotionEvents.length, safeScrapedEvents.length, filteredEvents, hasGoogleEvents, hasNotionEvents, hasScrapedEvents]);

  console.log('📈 useIntegratedEvents - Final output:', {
    filteredEventsCount: Array.isArray(filteredEvents) ? filteredEvents.length : 0,
    selectedCalendarIds: safeSelectedCalendarIds
  });

  return {
    filteredEvents: Array.isArray(filteredEvents) ? filteredEvents : [],
    eventStats,
    selectedCalendarIds: safeSelectedCalendarIds
  };
};
