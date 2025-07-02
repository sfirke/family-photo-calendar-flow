
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useICalCalendars } from './useICalCalendars';
import { useNotionCalendars } from './useNotionCalendars';
import { useNotionScrapedCalendars } from './useNotionScrapedCalendars';

export const useCalendarSelection = () => {
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  
  // Get calendars from all sources
  const { calendars: iCalCalendars } = useICalCalendars();
  const { calendars: notionCalendars, events: notionEvents } = useNotionCalendars();
  const { calendars: scrapedCalendars, events: scrapedEvents } = useNotionScrapedCalendars();

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

  const toggleCalendar = useCallback((calendarId: string) => {
    setSelectedCalendarIds(prev => {
      if (prev.includes(calendarId)) {
        return prev.filter(id => id !== calendarId);
      } else {
        return [...prev, calendarId];
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

  return {
    allCalendars,
    enabledCalendars,
    selectedCalendarIds,
    notionEvents,
    scrapedEvents,
    toggleCalendar,
    selectAllCalendars,
    deselectAllCalendars,
    setSelectedCalendarIds
  };
};
