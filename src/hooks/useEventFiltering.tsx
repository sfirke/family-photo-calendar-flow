
import { useMemo } from 'react';
import { Event } from '@/types/calendar';
import { NotionEvent } from '@/types/notion';
import { sampleEvents } from '@/data/sampleEvents';

interface UseEventFilteringProps {
  googleEvents: Event[];
  notionEvents: NotionEvent[];
  selectedCalendarIds: string[];
}

// Helper function to convert NotionEvent to Event format
const convertNotionEventToEvent = (notionEvent: NotionEvent): Event => {
  return {
    id: notionEvent.id,
    title: notionEvent.title,
    time: notionEvent.time,
    location: notionEvent.location || '',
    attendees: 0, // Notion events don't have attendee count
    category: 'Personal', // Default category for Notion events
    color: notionEvent.color,
    description: notionEvent.description || '',
    organizer: 'Notion',
    date: notionEvent.date,
    calendarId: notionEvent.calendarId,
    calendarName: notionEvent.calendarName,
    source: 'notion'
  };
};

export const useEventFiltering = ({ googleEvents, notionEvents, selectedCalendarIds }: UseEventFilteringProps) => {
  const filteredEvents = useMemo(() => {
    // Convert Notion events to Event format
    const convertedNotionEvents = notionEvents.map(convertNotionEventToEvent);
    
    // Combine all event sources
    const hasGoogleEvents = googleEvents.length > 0;
    const hasNotionEvents = convertedNotionEvents.length > 0;
    
    let baseEvents: Event[] = [];
    
    // Add Google events if available
    if (hasGoogleEvents) {
      baseEvents = [...baseEvents, ...googleEvents];
    }
    
    // Add Notion events if available
    if (hasNotionEvents) {
      baseEvents = [...baseEvents, ...convertedNotionEvents];
    }
    
    // Use sample events only if no real events are available
    if (!hasGoogleEvents && !hasNotionEvents) {
      baseEvents = sampleEvents;
    }

    // Filter events by selected calendar IDs
    const filtered = baseEvents.filter(event => {
      // For sample events, show all when no real events are available
      if (!hasGoogleEvents && !hasNotionEvents) {
        return true;
      }
      
      // Filter by selected calendar IDs
      if (selectedCalendarIds.length === 0) {
        return false;
      }
      
      const eventCalendarId = event.calendarId || 'primary';
      return selectedCalendarIds.includes(eventCalendarId);
    });

    // Process events to ensure single-day all-day events only appear on their specific date
    const processedEvents = filtered.map(event => {
      // If it's an all-day event that is NOT multi-day, ensure it only appears on its specific date
      if (event.time === 'All day' && ('isMultiDay' in event ? event.isMultiDay === false : true)) {
        return {
          ...event,
          date: new Date(event.date) // Ensure date is a proper Date object
        };
      }
      
      return event;
    });

    return processedEvents;
  }, [googleEvents, notionEvents, selectedCalendarIds]);

  return {
    filteredEvents,
    hasGoogleEvents: googleEvents.length > 0,
    hasNotionEvents: notionEvents.length > 0
  };
};
