
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
    
    return {
      googleEventCount,
      notionEventCount,
      scrapedEventCount,
      totalEvents,
      hasGoogleEvents,
      hasNotionEvents,
      hasScrapedEvents
    };
  }, [safeGoogleEvents.length, safeNotionEvents.length, safeScrapedEvents.length, filteredEvents, hasGoogleEvents, hasNotionEvents, hasScrapedEvents]);

  return {
    filteredEvents: Array.isArray(filteredEvents) ? filteredEvents : [],
    eventStats,
    selectedCalendarIds: safeSelectedCalendarIds
  };
};
