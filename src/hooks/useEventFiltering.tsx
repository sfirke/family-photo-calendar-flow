
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

    console.log('useEventFiltering: Event filtering summary:');
    console.log(`- Total Google events: ${googleEvents.length}`);
    console.log(`- Using Google events: ${hasGoogleEvents}`);
    console.log(`- Total base events: ${baseEvents.length}`);
    console.log(`- Selected calendar IDs: [${selectedCalendarIds.join(', ')}]`);

    // Group events by calendar for debugging
    if (hasGoogleEvents) {
      const eventsByCalendar = {};
      googleEvents.forEach(event => {
        const calendarId = event.calendarId || 'primary';
        if (!eventsByCalendar[calendarId]) {
          eventsByCalendar[calendarId] = [];
        }
        eventsByCalendar[calendarId].push(event.title);
      });
      console.log('useEventFiltering: Google events grouped by calendar:', eventsByCalendar);
    }

    // Filter events by selected calendar IDs
    const filtered = baseEvents.filter(event => {
      // For Google Calendar events, filter by selected calendar IDs
      if (hasGoogleEvents) {
        if (selectedCalendarIds.length === 0) {
          console.log(`useEventFiltering: Event "${event.title}" - No calendars selected, hiding event`);
          return false;
        }
        const eventCalendarId = event.calendarId || 'primary';
        const calendarMatch = selectedCalendarIds.includes(eventCalendarId);
        
        console.log(`useEventFiltering: Event "${event.title}" - Calendar: "${eventCalendarId}", Selected: ${calendarMatch}`);
        return calendarMatch;
      }
      
      // For sample events, show all events when no Google events are available
      console.log(`useEventFiltering: Sample event "${event.title}" - Showing (no Google events available)`);
      return true;
    });

    console.log(`useEventFiltering: Final filtered events: ${filtered.length} out of ${baseEvents.length} total events`);
    console.log('useEventFiltering: Filtered event titles:', filtered.map(e => e.title));

    return filtered;
  }, [googleEvents, selectedCalendarIds]);

  return {
    filteredEvents,
    hasGoogleEvents: googleEvents.length > 0
  };
};
