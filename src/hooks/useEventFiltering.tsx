
import { useMemo } from 'react';
import { Event } from '@/types/calendar';
import { sampleEvents } from '@/data/sampleEvents';

interface UseEventFilteringProps {
  googleEvents: Event[];
  selectedCalendarIds: string[];
}

export const useEventFiltering = ({ googleEvents, selectedCalendarIds }: UseEventFilteringProps) => {
  const filteredEvents = useMemo(() => {
    // Use Google Calendar events if available, otherwise use sample events
    const hasGoogleEvents = googleEvents.length > 0;
    const baseEvents = hasGoogleEvents ? googleEvents : sampleEvents;

    // Filter events by selected calendar IDs
    const filtered = baseEvents.filter(event => {
      // For Google Calendar events, filter by selected calendar IDs
      if (hasGoogleEvents) {
        if (selectedCalendarIds.length === 0) {
          return false;
        }
        const eventCalendarId = event.calendarId || 'primary';
        return selectedCalendarIds.includes(eventCalendarId);
      }
      
      // For sample events, show all events when no Google events are available
      return true;
    });

    // Process events to ensure single-day all-day events only appear on their specific date
    const processedEvents = filtered.map(event => {
      // If it's an all-day event that is NOT multi-day, ensure it only appears on its specific date
      // Check if isMultiDay property exists on the event before using it
      if (event.time === 'All day' && ('isMultiDay' in event ? event.isMultiDay === false : true)) {
        // Return the event as-is, but ensure the date is properly set
        return {
          ...event,
          date: new Date(event.date) // Ensure date is a proper Date object
        };
      }
      
      return event;
    });

    return processedEvents;
  }, [googleEvents, selectedCalendarIds]);

  return {
    filteredEvents,
    hasGoogleEvents: googleEvents.length > 0
  };
};
