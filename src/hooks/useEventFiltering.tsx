
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
  enabledCalendarIds?: string[]; // Add this to filter by sync status
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
  
  // Enhanced time handling for all-day detection
  let eventTime = scrapedEvent.time;
  
  // If time is undefined, null, or empty, treat as all-day
  if (!eventTime || eventTime.trim() === '') {
    eventTime = 'All day';
    // debug removed: converting scraped event to all-day
  } else {
    // debug removed: converting scraped event with time
  }
  // debug removed: scraped event conversion details

  return {
    id: scrapedEvent.id,
    title: scrapedEvent.title,
    time: eventTime,
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

export const useEventFiltering = ({ 
  googleEvents = [], 
  notionEvents = [], 
  scrapedEvents = [], 
  selectedCalendarIds = [],
  enabledCalendarIds = []
}: UseEventFilteringProps) => {
  const filteredEvents = useMemo(() => {
  // debug removed: starting filtering inputs snapshot

    // Ensure all arrays are properly initialized
    const safeGoogleEvents = Array.isArray(googleEvents) ? googleEvents : [];
    const safeNotionEvents = Array.isArray(notionEvents) ? notionEvents : [];
    const safeScrapedEvents = Array.isArray(scrapedEvents) ? scrapedEvents : [];
    const safeSelectedCalendarIds = Array.isArray(selectedCalendarIds) ? selectedCalendarIds : [];
    const safeEnabledCalendarIds = Array.isArray(enabledCalendarIds) ? enabledCalendarIds : [];

  // debug removed: safe arrays lengths

    // Convert Notion events to Event format
    const convertedNotionEvents = safeNotionEvents.map(convertNotionEventToEvent);
    
    // Convert scraped events to Event format with enhanced logging
    const convertedScrapedEvents = safeScrapedEvents.map(event => {
  const convertedEvent = convertScrapedEventToEvent(event);
  // debug removed: scraped event conversion comparison
  return convertedEvent;
    });
    
    // Combine all event sources
    const hasICalEvents = safeGoogleEvents.length > 0; // googleEvents now contains iCal events
    const hasNotionEvents = convertedNotionEvents.length > 0;
    const hasScrapedEvents = convertedScrapedEvents.length > 0;
    
  // debug removed: event source availability
    
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
  // debug removed: added scraped events list
    }
    
    // Use sample events only if no real events are available
    if (!hasICalEvents && !hasNotionEvents && !hasScrapedEvents) {
      baseEvents = sampleEvents;
    }

  // debug removed: base events count before filtering

    // Filter events by BOTH sync status (enabled) AND visibility selection
    const filtered = baseEvents.filter(event => {
      // For sample events, show all when no real events are available
      if (!hasICalEvents && !hasNotionEvents && !hasScrapedEvents) {
        return true;
      }
      
      const eventCalendarId = event.calendarId || 'primary';
      
      // First check: Calendar must be enabled for sync (if we have enabled calendar info)
      if (safeEnabledCalendarIds.length > 0) {
        const isEnabledForSync = safeEnabledCalendarIds.includes(eventCalendarId);
  if (!isEnabledForSync) {
          return false;
        }
      }
      
      // Second check: Calendar must be selected for visibility
      // If no calendars are selected, show nothing (user has explicitly deselected all)
  if (safeSelectedCalendarIds.length === 0) {
        return false;
      }
      
      const isSelectedForVisibility = safeSelectedCalendarIds.includes(eventCalendarId);
      
      if (!isSelectedForVisibility) {
        return false;
      }
      
      // debug removed: event passed all checks
      
      return true;
    });

    // debug removed: filtering complete summary

    return filtered;
  }, [googleEvents, notionEvents, scrapedEvents, selectedCalendarIds, enabledCalendarIds]);

  return {
    filteredEvents,
    hasGoogleEvents: Array.isArray(googleEvents) && googleEvents.length > 0,
    hasNotionEvents: Array.isArray(notionEvents) && notionEvents.length > 0,
    hasScrapedEvents: Array.isArray(scrapedEvents) && scrapedEvents.length > 0
  };
};
