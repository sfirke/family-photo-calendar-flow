
import { useMemo } from 'react';
import { Event } from '@/types/calendar';
import { sampleEvents } from '@/data/sampleEvents';

interface UseEventAggregationProps {
  localEvents: Event[];
  icalEvents: Event[];
  notionEvents: Event[];
  useSampleData?: boolean;
}

export const useEventAggregation = ({
  localEvents,
  icalEvents,
  notionEvents,
  useSampleData = false
}: UseEventAggregationProps) => {
  // Aggregate all events from different sources
  const allEvents = useMemo(() => {
    // If we have no real events and sample data is requested, use sample events
    const hasRealEvents = localEvents.length > 0 || icalEvents.length > 0 || notionEvents.length > 0;
    
    if (!hasRealEvents && useSampleData) {
      // Enhance sample events with proper metadata
      return sampleEvents.map((event, index) => ({
        ...event,
        id: event.id || (1000 + index),
        calendarId: 'local_calendar',
        calendarName: 'Family Calendar',
        source: 'local' as const
      }));
    }

    // Combine all real events
    return [...localEvents, ...icalEvents, ...notionEvents];
  }, [localEvents, icalEvents, notionEvents, useSampleData]);

  // Sort events by date and time
  const sortedEvents = useMemo(() => {
    return [...allEvents].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      
      // If same date, sort by time
      if (a.time === 'All day' && b.time !== 'All day') return -1;
      if (a.time !== 'All day' && b.time === 'All day') return 1;
      
      return a.time.localeCompare(b.time);
    });
  }, [allEvents]);

  // Group events by source
  const eventsBySource = useMemo(() => {
    return {
      local: allEvents.filter(event => event.source === 'local' || event.calendarId === 'local_calendar'),
      ical: allEvents.filter(event => event.source === 'ical'),
      notion: allEvents.filter(event => event.source === 'notion'),
      total: allEvents.length
    };
  }, [allEvents]);

  // Get events for a specific date
  const getEventsForDate = useMemo(() => {
    return (date: Date) => {
      const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      return sortedEvents.filter(event => {
        const eventDate = new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate());
        return eventDate.getTime() === targetDate.getTime();
      });
    };
  }, [sortedEvents]);

  return {
    allEvents: sortedEvents,
    eventsBySource,
    getEventsForDate,
    hasEvents: allEvents.length > 0,
    totalEvents: allEvents.length
  };
};
