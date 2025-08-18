
import { useMemo } from 'react';
import { Event } from '@/types/calendar';
import { NotionEvent } from '@/types/notion';
import { useEventFiltering } from '@/hooks/useEventFiltering';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';
import { useICalCalendars } from '@/hooks/useICalCalendars';

export const useIntegratedEvents = (googleEvents: Event[] = [], refreshKey?: number) => {
  const { selectedCalendarIds, notionEvents, scrapedEvents, enabledCalendars } = useCalendarSelection();
  
  // Get enabled calendar IDs for sync status filtering from ALL sources
  const enabledCalendarIds = useMemo(() => {
    return enabledCalendars
      .filter(cal => cal.enabled)
      .map(cal => cal.id);
  }, [enabledCalendars]); // Remove refreshKey dependency
  
  // Ensure all arrays are safe
  const safeGoogleEvents = Array.isArray(googleEvents) ? googleEvents : [];
  const safeNotionEvents = Array.isArray(notionEvents) ? notionEvents : [];
  const safeScrapedEvents = Array.isArray(scrapedEvents) ? scrapedEvents : [];
  const safeSelectedCalendarIds = Array.isArray(selectedCalendarIds) ? selectedCalendarIds : [];
  const safeEnabledCalendarIds = Array.isArray(enabledCalendarIds) ? enabledCalendarIds : [];
  
  // debug removed: input state snapshot
  
  const { filteredEvents, hasGoogleEvents, hasNotionEvents, hasScrapedEvents } = useEventFiltering({
    googleEvents: safeGoogleEvents,
    notionEvents: safeNotionEvents,
    scrapedEvents: safeScrapedEvents,
    selectedCalendarIds: safeSelectedCalendarIds,
    enabledCalendarIds: safeEnabledCalendarIds
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
    
  // debug removed: event stats calculated
    
    return stats;
  }, [safeGoogleEvents.length, safeNotionEvents.length, safeScrapedEvents.length, filteredEvents, hasGoogleEvents, hasNotionEvents, hasScrapedEvents]); // Remove refreshKey dependency

  // debug removed: final output summary

  return {
    filteredEvents: Array.isArray(filteredEvents) ? filteredEvents : [],
    eventStats,
    selectedCalendarIds: safeSelectedCalendarIds
  };
};
