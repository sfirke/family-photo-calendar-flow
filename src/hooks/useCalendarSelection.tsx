
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useICalCalendars } from './useICalCalendars';
import { useNotionCalendars } from './useNotionCalendars';
import { useNotionScrapedCalendars } from './useNotionScrapedCalendars';
import { Event } from '@/types/calendar';

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
  const { calendars: iCalCalendars = [], isLoading: iCalLoading } = useICalCalendars();
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

  // Create calendarsFromEvents (mock data for now - this would be populated from actual events)
  const calendarsFromEvents = useMemo((): CalendarFromEvents[] => {
    if (!Array.isArray(allCalendars)) return [];
    
    // Convert all calendars to CalendarFromEvents format
    const calendarList: CalendarFromEvents[] = allCalendars.map(cal => ({
      id: cal?.id || '',
      summary: cal?.name || 'Unnamed Calendar',
      color: cal?.color || '#3b82f6',
      primary: false,
      hasEvents: (cal?.eventCount || 0) > 0,
      eventCount: cal?.eventCount || 0,
      lastSync: cal?.lastSync
    }));

    return calendarList;
  }, [allCalendars, refreshKey]);

  // Initialize selected calendars with all enabled calendars
  useEffect(() => {
    if (!Array.isArray(enabledCalendars)) return;
    
    const enabledIds = enabledCalendars.map(cal => cal?.id).filter(Boolean);
    if (enabledIds.length > 0 && selectedCalendarIds.length === 0) {
      setSelectedCalendarIds(enabledIds);
    }
  }, [enabledCalendars, selectedCalendarIds.length]);

  // Update selected calendars when calendars change
  useEffect(() => {
    if (!Array.isArray(enabledCalendars)) return;
    
    const enabledIds = enabledCalendars.map(cal => cal?.id).filter(Boolean);
    const safeSelectedIds = Array.isArray(selectedCalendarIds) ? selectedCalendarIds : [];
    const validSelectedIds = safeSelectedIds.filter(id => enabledIds.includes(id));
    
    if (validSelectedIds.length !== safeSelectedIds.length) {
      setSelectedCalendarIds(validSelectedIds);
    }
  }, [enabledCalendars, selectedCalendarIds]);

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

  const deselectAllCalendars = useCallback(() => {
    setSelectedCalendarIds([]);
  }, []);

  // Additional methods needed by components
  const clearAllCalendars = useCallback(() => {
    setSelectedCalendarIds([]);
  }, []);

  const selectCalendarsWithEvents = useCallback(() => {
    if (!Array.isArray(calendarsFromEvents)) return;
    const calendarsWithEventsIds = calendarsFromEvents
      .filter(cal => cal?.hasEvents)
      .map(cal => cal?.id)
      .filter(Boolean);
    setSelectedCalendarIds(calendarsWithEventsIds);
  }, [calendarsFromEvents]);

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
    deselectAllCalendars,
    setSelectedCalendarIds,
    clearAllCalendars,
    selectCalendarsWithEvents,
    updateSelectedCalendars,
    cleanupDeletedCalendar,
    forceRefresh
  };
};
