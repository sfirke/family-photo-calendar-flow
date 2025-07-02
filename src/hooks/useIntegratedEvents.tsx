
import { useMemo } from 'react';
import { Event } from '@/types/calendar';
import { NotionEvent } from '@/types/notion';
import { useEventFiltering } from '@/hooks/useEventFiltering';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';

export const useIntegratedEvents = (googleEvents: Event[] = []) => {
  const { selectedCalendarIds, notionEvents, scrapedEvents } = useCalendarSelection();
  
  const { filteredEvents, hasGoogleEvents, hasNotionEvents, hasScrapedEvents } = useEventFiltering({
    googleEvents,
    notionEvents,
    scrapedEvents,
    selectedCalendarIds
  });

  const eventStats = useMemo(() => {
    const googleEventCount = googleEvents.length;
    const notionEventCount = notionEvents.length;
    const scrapedEventCount = scrapedEvents.length;
    const totalEvents = filteredEvents.length;
    
    return {
      googleEventCount,
      notionEventCount,
      scrapedEventCount,
      totalEvents,
      hasGoogleEvents,
      hasNotionEvents,
      hasScrapedEvents
    };
  }, [googleEvents.length, notionEvents.length, scrapedEvents.length, filteredEvents.length, hasGoogleEvents, hasNotionEvents, hasScrapedEvents]);

  return {
    filteredEvents,
    eventStats,
    selectedCalendarIds
  };
};
