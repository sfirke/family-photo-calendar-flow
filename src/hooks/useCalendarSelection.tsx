
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
  const { calendars: iCalCalendars, isLoading: iCalLoading } = useICalCalendars();
  const { calendars: notionCalendars, events: notionEvents, isLoading: notionLoading } = useNotionCalendars();
  const { calendars: scrapedCalendars, events: scrapedEvents, isLoading: scrapedLoading } = useNotionScrapedCalendars();

  // Combine all calendars
  const allCalendars = useMemo(() => [
    ...iCalCalendars,
    ...notionCalendars,
    ...scrapedCalendars
  ], [iCalCalendars, notionCalendars, scrapedCalendars]);

  // Get enabled calendars
  const enabledCalendars = useMemo(() => 
    allCalendars.filter(cal => cal.enabled), 
    [allCalendars]
  );

  // Create calendarsFromEvents (mock data for now - this would be populated from actual events)
  const calendarsFromEvents = useMemo((): CalendarFromEvents[] => {
    // Convert all calendars to CalendarFromEvents format
    const calendarList: CalendarFromEvents[] = allCalendars.map(cal => ({
      id: cal.id,
      summary: cal.name,
      color: cal.color,
      primary: false,
      hasEvents: (cal.eventCount || 0) > 0,
      eventCount: cal.eventCount || 0,
      lastSync: cal.lastSync
    }));

    return calendarList;
  }, [allCalendars, refreshKey]);

  // Initialize selected calendars with all enabled calendars
  useEffect(() => {
    const enabledIds = enabledCalendars.map(cal => cal.id);
    if (enabledIds.length > 0 && selectedCalendarIds.length === 0) {
      setSelectedCalendarIds(enabledIds);
    }
  }, [enabledCalendars, selectedCalendarIds.length]);

  // Update selected calendars when calendars change
  useEffect(() => {
    const enabledIds = enabledCalendars.map(cal => cal.id);
    const validSelectedIds = selectedCalendarIds.filter(id => enabledIds.includes(id));
    
    if (validSelectedIds.length !== selectedCalendarIds.length) {
      setSelectedCalendarIds(validSelectedIds);
    }
  }, [enabledCalendars, selectedCalendarIds]);

  // Toggle calendar (support both 1 and 2 parameter versions)
  const toggleCalendar = useCallback((calendarId: string, checked?: boolean) => {
    setSelectedCalendarIds(prev => {
      if (typeof checked === 'boolean') {
        // Two parameter version
        if (checked) {
          return prev.includes(calendarId) ? prev : [...prev, calendarId];
        } else {
          return prev.filter(id => id !== calendarId);
        }
      } else {
        // Single parameter version (toggle)
        if (prev.includes(calendarId)) {
          return prev.filter(id => id !== calendarId);
        } else {
          return [...prev, calendarId];
        }
      }
    });
  }, []);

  const selectAllCalendars = useCallback(() => {
    const enabledIds = enabledCalendars.map(cal => cal.id);
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
    const calendarsWithEventsIds = calendarsFromEvents
      .filter(cal => cal.hasEvents)
      .map(cal => cal.id);
    setSelectedCalendarIds(calendarsWithEventsIds);
  }, [calendarsFromEvents]);

  const updateSelectedCalendars = useCallback((newSelectedIds: string[]) => {
    setSelectedCalendarIds(newSelectedIds);
  }, []);

  const cleanupDeletedCalendar = useCallback((calendarId: string) => {
    setSelectedCalendarIds(prev => prev.filter(id => id !== calendarId));
  }, []);

  const forceRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const isLoading = iCalLoading || notionLoading || scrapedLoading;

  return {
    allCalendars,
    enabledCalendars,
    selectedCalendarIds,
    notionEvents,
    scrapedEvents,
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
