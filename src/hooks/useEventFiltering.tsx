
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
    attendees: 0,
    category: 'Personal',
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
const convertScrapedEventToEvent = (scrapedEvent: NotionScrapedEvent): Event => {
  // Use the calendar ID from the scraped event, which should match the calendar it belongs to
  const calendarId = scrapedEvent.calendarId || 'unknown';
  
  console.log('Converting scraped event:', {
    id: scrapedEvent.id,
    title: scrapedEvent.title,
    calendarId: calendarId,
    originalCalendarId: scrapedEvent.calendarId
  });

  return {
    id: scrapedEvent.id,
    title: scrapedEvent.title,
    time: scrapedEvent.time || 'All day',
    location: scrapedEvent.location || '',
    attendees: 0,
    category: 'Personal',
    color: '#10B981', // Default green color for scraped events
    description: scrapedEvent.description || '',
    organizer: 'Notion (API)',
    date: scrapedEvent.date,
    calendarId: calendarId,
    calendarName: 'Notion API Calendar',
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

    console.log('Event filtering input:', {
      googleEvents: safeGoogleEvents.length,
      notionEvents: safeNotionEvents.length,
      scrapedEvents: safeScrapedEvents.length,
      selectedCalendarIds: safeSelectedCalendarIds.length
    });

    // Convert Notion events to Event format
    const convertedNotionEvents = safeNotionEvents.map(convertNotionEventToEvent);
    
    // Convert scraped events to Event format
    const convertedScrapedEvents = safeScrapedEvents.map(event => convertScrapedEventToEvent(event));
    
    // Combine all event sources
    const hasICalEvents = safeGoogleEvents.length > 0; // googleEvents now contains iCal events
    const hasNotionEvents = convertedNotionEvents.length > 0;
    const hasScrapedEvents = convertedScrapedEvents.length > 0;
    
    console.log('Event source availability:', {
      hasICalEvents,
      hasNotionEvents,
      hasScrapedEvents
    });
    
    let baseEvents: Event[] = [];
    
    // Add iCal events (passed through googleEvents parameter)
    if (hasICalEvents) {
      baseEvents = [...baseEvents, ...safeGoogleEvents];
    }
    
    // Add Notion API events if available
    if (hasNotionEvents) {
      baseEvents = [...baseEvents, ...convertedNotionEvents];
    }
    
    // Add scraped Notion events if available
    if (hasScrapedEvents) {
      baseEvents = [...baseEvents, ...convertedScrapedEvents];
      console.log('Added scraped events:', convertedScrapedEvents.map(e => ({ id: e.id, title: e.title, calendarId: e.calendarId })));
    }
    
    // Use sample events only if no real events are available
    if (!hasICalEvents && !hasNotionEvents && !hasScrapedEvents) {
      baseEvents = sampleEvents;
    }

    console.log('Total base events before filtering:', baseEvents.length);

    // Filter events by selected calendar IDs
    const filtered = baseEvents.filter(event => {
      // For sample events, show all when no real events are available
      if (!hasICalEvents && !hasNotionEvents && !hasScrapedEvents) {
        return true;
      }
      
      // Filter by selected calendar IDs
      if (safeSelectedCalendarIds.length === 0) {
        return false;
      }
      
      const eventCalendarId = event.calendarId || 'primary';
      const isSelected = safeSelectedCalendarIds.includes(eventCalendarId);
      
      if (!isSelected) {
        console.log('Event filtered out:', {
          title: event.title,
          calendarId: eventCalendarId,
          selectedCalendarIds: safeSelectedCalendarIds
        });
      }
      
      return isSelected;
    });

    console.log('Filtered events result:', {
      totalFiltered: filtered.length,
      bySource: {
        ical: filtered.filter(e => e.source === 'ical').length,
        notion: filtered.filter(e => e.source === 'notion').length,
        local: filtered.filter(e => e.source === 'local').length
      }
    });

    return filtered;
  }, [googleEvents, notionEvents, scrapedEvents, selectedCalendarIds]);

  return {
    filteredEvents,
    hasGoogleEvents: Array.isArray(googleEvents) && googleEvents.length > 0,
    hasNotionEvents: Array.isArray(notionEvents) && notionEvents.length > 0,
    hasScrapedEvents: Array.isArray(scrapedEvents) && scrapedEvents.length > 0
  };
};
