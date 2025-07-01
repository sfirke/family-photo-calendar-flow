
import { useMemo } from 'react';
import { Event } from '@/types/calendar';
import { NotionEvent } from '@/types/notion';
import { useEventFiltering } from '@/hooks/useEventFiltering';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';

export const useIntegratedEvents = (googleEvents: Event[] = []) => {
  const { selectedCalendarIds, notionEvents } = useCalendarSelection();
  
  const { filteredEvents, hasGoogleEvents, hasNotionEvents } = useEventFiltering({
    googleEvents,
    notionEvents,
    selectedCalendarIds
  });

  const eventStats = useMemo(() => {
    const googleEventCount = googleEvents.length;
    const notionEventCount = notionEvents.length;
    const totalEvents = filteredEvents.length;
    
    return {
      googleEventCount,
      notionEventCount,
      totalEvents,
      hasGoogleEvents,
      hasNotionEvents
    };
  }, [googleEvents.length, notionEvents.length, filteredEvents.length, hasGoogleEvents, hasNotionEvents]);

  return {
    filteredEvents,
    eventStats,
    selectedCalendarIds
  };
};
