
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
  }, [enabledCalendars, refreshKey]); // Add refreshKey as dependency
  
  // Ensure all arrays are safe
  const safeGoogleEvents = Array.isArray(googleEvents) ? googleEvents : [];
  const safeNotionEvents = Array.isArray(notionEvents) ? notionEvents : [];
  const safeScrapedEvents = Array.isArray(scrapedEvents) ? scrapedEvents : [];
  const safeSelectedCalendarIds = Array.isArray(selectedCalendarIds) ? selectedCalendarIds : [];
  const safeEnabledCalendarIds = Array.isArray(enabledCalendarIds) ? enabledCalendarIds : [];
  
  console.log('📈 useIntegratedEvents - Input state:', {
    googleEvents: safeGoogleEvents.length,
    notionEvents: safeNotionEvents.length,
    scrapedEvents: safeScrapedEvents.length,
    selectedCalendarIds: safeSelectedCalendarIds.length,
    enabledCalendarIds: safeEnabledCalendarIds.length,
    selectedIds: safeSelectedCalendarIds,
    enabledIds: safeEnabledCalendarIds,
    refreshKey
  });
  
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
    
    console.log('📈 useIntegratedEvents - Event stats calculated:', stats);
    
    return stats;
  }, [safeGoogleEvents.length, safeNotionEvents.length, safeScrapedEvents.length, filteredEvents, hasGoogleEvents, hasNotionEvents, hasScrapedEvents, refreshKey]);

  console.log('📈 useIntegratedEvents - Final output:', {
    filteredEventsCount: Array.isArray(filteredEvents) ? filteredEvents.length : 0,
    selectedCalendarIds: safeSelectedCalendarIds,
    enabledCalendarIds: safeEnabledCalendarIds
  });

  return {
    filteredEvents: Array.isArray(filteredEvents) ? filteredEvents : [],
    eventStats,
    selectedCalendarIds: safeSelectedCalendarIds
  };
};
