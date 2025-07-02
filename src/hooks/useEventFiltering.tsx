
import { useMemo } from 'react';
import { Event } from '@/types/calendar';
import { NotionEvent } from '@/types/notion';
import { NotionScrapedEvent } from '@/services/NotionPageScraper';
import { sampleEvents } from '@/data/sampleEvents';

interface UseEventFilteringProps {
  googleEvents: Event[];
  notionEvents: NotionEvent[];
  scrapedEvents?: NotionScrapedEvent[];
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

// Helper function to convert NotionScrapedEvent to Event format
const convertScrapedEventToEvent = (scrapedEvent: NotionScrapedEvent, calendarId: string, calendarName: string, color: string): Event => {
  return {
    id: scrapedEvent.id,
    title: scrapedEvent.title,
    time: scrapedEvent.time || 'All day',
    location: scrapedEvent.location || '',
    attendees: 0,
    category: 'Personal',
    color: color,
    description: scrapedEvent.description || '',
    organizer: 'Notion (Scraped)',
    date: scrapedEvent.date,
    calendarId: scrapedEvent.calendarId || calendarId,
    calendarName: calendarName,
    source: 'notion'
  };
};

export const useEventFiltering = ({ googleEvents = [], notionEvents = [], scrapedEvents = [], selectedCalendarIds = [] }: UseEventFilteringProps) => {
  const filteredEvents = useMemo(() => {
    // Ensure all arrays are properly initialized
    const safeGoogleEvents = Array.isArray(googleEvents) ? googleEvents : [];
    const safeNotionEvents = Array.isArray(notionEvents) ? notionEvents : [];
    const safeScrapedEvents = Array.isArray(scrapedEvents) ? scrapedEvents : [];
    const safeSelectedCalendarIds = Array.isArray(selectedCalendarIds) ? selectedCalendarIds : [];

    // Convert Notion events to Event format
    const convertedNotionEvents = safeNotionEvents.map(convertNotionEventToEvent);
    
    // Convert scraped events to Event format
    const convertedScrapedEvents = safeScrapedEvents.map(event => 
      convertScrapedEventToEvent(event, event.calendarId || 'scraped', 'Scraped Calendar', '#10B981')
    );
    
    // Combine all event sources
    const hasGoogleEvents = safeGoogleEvents.length > 0;
    const hasNotionEvents = convertedNotionEvents.length > 0;
    const hasScrapedEvents = convertedScrapedEvents.length > 0;
    
    let baseEvents: Event[] = [];
    
    // Add Google events if available
    if (hasGoogleEvents) {
      baseEvents = [...baseEvents, ...safeGoogleEvents];
    }
    
    // Add Notion API events if available
    if (hasNotionEvents) {
      baseEvents = [...baseEvents, ...convertedNotionEvents];
    }
    
    // Add scraped Notion events if available
    if (hasScrapedEvents) {
      baseEvents = [...baseEvents, ...convertedScrapedEvents];
    }
    
    // Use sample events only if no real events are available
    if (!hasGoogleEvents && !hasNotionEvents && !hasScrapedEvents) {
      baseEvents = sampleEvents;
    }

    // Filter events by selected calendar IDs
    const filtered = baseEvents.filter(event => {
      // For sample events, show all when no real events are available
      if (!hasGoogleEvents && !hasNotionEvents && !hasScrapedEvents) {
        return true;
      }
      
      // Filter by selected calendar IDs
      if (safeSelectedCalendarIds.length === 0) {
        return false;
      }
      
      const eventCalendarId = event.calendarId || 'primary';
      return safeSelectedCalendarIds.includes(eventCalendarId);
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
  }, [googleEvents, notionEvents, scrapedEvents, selectedCalendarIds]);

  return {
    filteredEvents,
    hasGoogleEvents: Array.isArray(googleEvents) && googleEvents.length > 0,
    hasNotionEvents: Array.isArray(notionEvents) && notionEvents.length > 0,
    hasScrapedEvents: Array.isArray(scrapedEvents) && scrapedEvents.length > 0
  };
};
