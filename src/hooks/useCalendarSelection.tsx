import { useState, useEffect, useCallback, useMemo } from 'react';
import { useICalCalendars } from './useICalCalendars';
import { useNotionCalendars } from './useNotionCalendars';
import { useNotionScrapedCalendars } from './useNotionScrapedCalendars';

export interface CalendarFromEvents {
  id: string;
  summary: string;
  color: string;
  primary: boolean;
  hasEvents: boolean;
  eventCount: number;
  lastSync?: string;
}

export const useCalendarSelection = () => {
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Get calendars from all sources
  const { calendars: iCalCalendars = [], isLoading: iCalLoading, getICalEvents } = useICalCalendars();
  const { calendars: notionCalendars = [], events: notionEvents = [], isLoading: notionLoading } = useNotionCalendars();
  const { calendars: scrapedCalendars = [], events: scrapedEvents = [], isLoading: scrapedLoading } = useNotionScrapedCalendars();

  // Combine all calendars with safe array handling
  const allCalendars = useMemo(() => {
    const safeICalCalendars = Array.isArray(iCalCalendars) ? iCalCalendars : [];
    const safeNotionCalendars = Array.isArray(notionCalendars) ? notionCalendars : [];
    const safeScrapedCalendars = Array.isArray(scrapedCalendars) ? scrapedCalendars : [];
    
    return [
      ...safeICalCalendars,
      ...safeNotionCalendars,
      ...safeScrapedCalendars
    ];
  }, [iCalCalendars, notionCalendars, scrapedCalendars]);

  // Get enabled calendars with safe array handling
  const enabledCalendars = useMemo(() => {
    if (!Array.isArray(allCalendars)) return [];
    return allCalendars.filter(cal => cal && cal.enabled);
  }, [allCalendars]);

  // Create calendarsFromEvents based on actual calendar data
  const calendarsFromEvents = useMemo((): CalendarFromEvents[] => {
    if (!Array.isArray(allCalendars)) return [];
    
    // Get iCal events to count them per calendar
    const iCalEvents = getICalEvents ? getICalEvents() : [];
    
    // Convert all calendars to CalendarFromEvents format with proper event counting
    const calendarList: CalendarFromEvents[] = allCalendars.map(cal => {
      let eventCount = 0;
      let hasEvents = false;

      // Count events based on calendar source
      if (cal.source === 'ical' || (!cal.source && cal.url)) {
        // For iCal calendars, count events from storage
        eventCount = iCalEvents.filter(event => event.calendarId === cal.id).length;
        hasEvents = eventCount > 0;
      } else if (cal.source === 'notion') {
        // For Notion calendars, use existing event counting logic
        eventCount = notionEvents.filter(event => event.calendarId === cal.id).length;
        hasEvents = eventCount > 0;
      } else if (cal.source === 'scraped') {
        // For scraped calendars, count scraped events
        eventCount = scrapedEvents.filter(event => event.calendarId === cal.id).length;
        hasEvents = eventCount > 0;
      } else {
        // Use eventCount property if available (for backwards compatibility)
        eventCount = cal.eventCount || 0;
        hasEvents = eventCount > 0;
      }

      return {
        id: cal?.id || '',
        summary: cal?.name || 'Unnamed Calendar',
        color: cal?.color || '#3b82f6',
        primary: cal?.id === 'primary',
        hasEvents,
        eventCount,
        lastSync: cal?.lastSync
      };
    });

    return calendarList;
  }, [allCalendars, getICalEvents, notionEvents, scrapedEvents, refreshKey]);

  // Initialize selected calendars with enabled calendars that have events
  useEffect(() => {
    if (!Array.isArray(enabledCalendars)) return;
    
    const enabledWithEventsIds = calendarsFromEvents
      .filter(cal => cal?.hasEvents)
      .map(cal => cal?.id)
      .filter(Boolean);
    
    if (enabledWithEventsIds.length > 0 && selectedCalendarIds.length === 0) {
      setSelectedCalendarIds(enabledWithEventsIds);
    }
  }, [calendarsFromEvents, selectedCalendarIds.length]);

  // Toggle calendar (support both 1 and 2 parameter versions)
  const toggleCalendar = useCallback((calendarId: string, checked?: boolean) => {
    setSelectedCalendarIds(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      
      if (typeof checked === 'boolean') {
        // Two parameter version
        if (checked) {
          return safePrev.includes(calendarId) ? safePrev : [...safePrev, calendarId];
        } else {
          return safePrev.filter(id => id !== calendarId);
        }
      } else {
        // Single parameter version (toggle)
        if (safePrev.includes(calendarId)) {
          return safePrev.filter(id => id !== calendarId);
        } else {
          return [...safePrev, calendarId];
        }
      }
    });
  }, []);

  const selectAllCalendars = useCallback(() => {
    if (!Array.isArray(enabledCalendars)) return;
    const enabledIds = enabledCalendars.map(cal => cal?.id).filter(Boolean);
    setSelectedCalendarIds(enabledIds);
  }, [enabledCalendars]);

  const selectCalendarsWithEvents = useCallback(() => {
    if (!Array.isArray(calendarsFromEvents)) return;
    const calendarsWithEventsIds = calendarsFromEvents
      .filter(cal => cal?.hasEvents)
      .map(cal => cal?.id)
      .filter(Boolean);
    setSelectedCalendarIds(calendarsWithEventsIds);
  }, [calendarsFromEvents]);

  const clearAllCalendars = useCallback(() => {
    setSelectedCalendarIds([]);
  }, []);

  const updateSelectedCalendars = useCallback((newSelectedIds: string[]) => {
    const safeNewSelectedIds = Array.isArray(newSelectedIds) ? newSelectedIds : [];
    setSelectedCalendarIds(safeNewSelectedIds);
  }, []);

  const cleanupDeletedCalendar = useCallback((calendarId: string) => {
    setSelectedCalendarIds(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.filter(id => id !== calendarId);
    });
  }, []);

  const forceRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const isLoading = iCalLoading || notionLoading || scrapedLoading;

  // Ensure all returned arrays are safe
  const safeNotionEvents = Array.isArray(notionEvents) ? notionEvents : [];
  const safeScrapedEvents = Array.isArray(scrapedEvents) ? scrapedEvents : [];
  const safeSelectedCalendarIds = Array.isArray(selectedCalendarIds) ? selectedCalendarIds : [];

  return {
    allCalendars,
    enabledCalendars,
    selectedCalendarIds: safeSelectedCalendarIds,
    notionEvents: safeNotionEvents,
    scrapedEvents: safeScrapedEvents,
    calendarsFromEvents,
    isLoading,
    toggleCalendar,
    selectAllCalendars,
    deselectAllCalendars: clearAllCalendars,
    setSelectedCalendarIds,
    clearAllCalendars,
    selectCalendarsWithEvents,
    updateSelectedCalendars,
    cleanupDeletedCalendar,
    forceRefresh
  };
};
