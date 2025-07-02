
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useICalCalendars } from './useICalCalendars';
import { useNotionCalendars } from './useNotionCalendars';
import { useNotionScrapedCalendars } from './useNotionScrapedCalendars';
import { useLocalCalendars } from './useLocalCalendars';
import { Event } from '@/types/calendar';

export const useCalendarSelection = (events: Event[] = []) => {
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  
  // Get calendars from all sources
  const { calendars: iCalCalendars } = useICalCalendars();  
  const { calendars: notionCalendars, events: notionEvents } = useNotionCalendars();
  const { calendars: scrapedCalendars, events: scrapedEvents } = useNotionScrapedCalendars();
  const { calendars: localCalendars, isLoading } = useLocalCalendars(events);

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

  // Create calendars from events (for UI components that expect this format)
  const calendarsFromEvents = useMemo(() => {
    return localCalendars.map(cal => ({
      ...cal,
      color: cal.primary ? '#3b82f6' : '#6b7280',
      lastSync: undefined
    }));
  }, [localCalendars]);

  // Initialize selected calendars with all enabled calendars
  useEffect(() => {
    const enabledIds = enabledCalendars.map(cal => cal.id);
    const localIds = localCalendars.map(cal => cal.id);
    const allIds = [...enabledIds, ...localIds];
    
    if (allIds.length > 0 && selectedCalendarIds.length === 0) {
      setSelectedCalendarIds(allIds);
    }
  }, [enabledCalendars, localCalendars, selectedCalendarIds.length]);

  // Update selected calendars when calendars change
  useEffect(() => {
    const enabledIds = enabledCalendars.map(cal => cal.id);
    const localIds = localCalendars.map(cal => cal.id);
    const allIds = [...enabledIds, ...localIds];
    const validSelectedIds = selectedCalendarIds.filter(id => allIds.includes(id));
    
    if (validSelectedIds.length !== selectedCalendarIds.length) {
      setSelectedCalendarIds(validSelectedIds);
    }
  }, [enabledCalendars, localCalendars, selectedCalendarIds]);

  const toggleCalendar = useCallback((calendarId: string, checked?: boolean) => {
    setSelectedCalendarIds(prev => {
      if (checked !== undefined) {
        if (checked) {
          return prev.includes(calendarId) ? prev : [...prev, calendarId];
        } else {
          return prev.filter(id => id !== calendarId);
        }
      } else {
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
    const localIds = localCalendars.map(cal => cal.id);
    const allIds = [...enabledIds, ...localIds];
    setSelectedCalendarIds(allIds);
  }, [enabledCalendars, localCalendars]);

  const deselectAllCalendars = useCallback(() => {
    setSelectedCalendarIds([]);
  }, []);

  const clearAllCalendars = useCallback(() => {
    setSelectedCalendarIds([]);
  }, []);

  const selectCalendarsWithEvents = useCallback(() => {
    const calendarsWithEvents = calendarsFromEvents.filter(cal => cal.hasEvents);
    const idsWithEvents = calendarsWithEvents.map(cal => cal.id);
    setSelectedCalendarIds(idsWithEvents);
  }, [calendarsFromEvents]);

  const updateSelectedCalendars = useCallback((calendarIds: string[]) => {
    setSelectedCalendarIds(calendarIds);
  }, []);

  const cleanupDeletedCalendar = useCallback((calendarId: string) => {
    setSelectedCalendarIds(prev => prev.filter(id => id !== calendarId));
  }, []);

  const forceRefresh = useCallback(() => {
    // Force re-evaluation of calendars by updating the state
    const enabledIds = enabledCalendars.map(cal => cal.id);
    const localIds = localCalendars.map(cal => cal.id);
    const allIds = [...enabledIds, ...localIds];
    const validSelectedIds = selectedCalendarIds.filter(id => allIds.includes(id));
    setSelectedCalendarIds(validSelectedIds);
  }, [enabledCalendars, localCalendars, selectedCalendarIds]);

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
    clearAllCalendars,
    selectCalendarsWithEvents,
    updateSelectedCalendars,
    cleanupDeletedCalendar,
    forceRefresh,
    setSelectedCalendarIds
  };
};
