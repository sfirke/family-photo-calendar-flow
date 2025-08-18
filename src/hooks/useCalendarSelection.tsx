
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useICalCalendars } from './useICalCalendars';
import { useNotionScrapedCalendars } from './useNotionScrapedCalendars';
import { useCalendarRefresh } from './useCalendarRefresh';

export interface CalendarFromEvents {
  id: string;
  summary: string;
  color: string;
  primary: boolean;
  hasEvents: boolean;
  eventCount: number;
  lastSync?: string;
  source?: 'ical' | 'notion' | 'notion-scraped' | 'local';
}

export const useCalendarSelection = () => {
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasUserMadeSelection, setHasUserMadeSelection] = useState(false);
  const { useRefreshListener } = useCalendarRefresh();

  // Load selectedCalendarIds from localStorage on init
  useEffect(() => {
    const stored = localStorage.getItem('selectedCalendarIds');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSelectedCalendarIds(parsed);
          setHasUserMadeSelection(true);
          // debug removed: loaded selected calendar IDs from localStorage
        }
      } catch (error) {
        console.error('Failed to parse stored selectedCalendarIds:', error);
      }
    }
  }, []);

  // Save selectedCalendarIds to localStorage whenever it changes
  useEffect(() => {
    if (hasUserMadeSelection && selectedCalendarIds.length >= 0) {
      localStorage.setItem('selectedCalendarIds', JSON.stringify(selectedCalendarIds));
  // debug removed: saved selected calendar IDs to localStorage
    }
  }, [selectedCalendarIds, hasUserMadeSelection]);
  
  // Get calendars from all sources
  const { calendars: iCalCalendars = [], isLoading: iCalLoading, getICalEvents } = useICalCalendars();
  const { calendars: scrapedCalendars = [], events: scrapedEvents = [], isLoading: scrapedLoading } = useNotionScrapedCalendars();

  // Listen for calendar refresh events to update data
  useRefreshListener((refreshEvent) => {
  // debug removed: received refresh event
    setRefreshKey(prev => prev + 1);
  });

  // Combine all calendars with safe array handling
  const allCalendars = useMemo(() => {
    const safeICalCalendars = Array.isArray(iCalCalendars) ? iCalCalendars : [];
    const safeScrapedCalendars = Array.isArray(scrapedCalendars) ? scrapedCalendars : [];
    
  // debug removed: calendar counts
    
    return [
      ...safeICalCalendars,
      ...safeScrapedCalendars
    ];
  }, [iCalCalendars, scrapedCalendars]);

  // Get enabled calendars with safe array handling
  const enabledCalendars = useMemo(() => {
    if (!Array.isArray(allCalendars)) return [];
    return allCalendars.filter(cal => cal && cal.enabled);
  }, [allCalendars]);

  // Create calendarsFromEvents based on actual calendar data with proper source attribution
  const calendarsFromEvents = useMemo((): CalendarFromEvents[] => {
    if (!Array.isArray(allCalendars)) return [];
    
    // Get iCal events to count them per calendar
    const iCalEvents = getICalEvents ? getICalEvents() : [];
    
  // debug removed: event counts

    // Convert all calendars to CalendarFromEvents format with proper event counting and source attribution
    const calendarList: CalendarFromEvents[] = allCalendars.map(cal => {
      let eventCount = 0;
      let hasEvents = false;
      let source: 'ical' | 'notion' | 'notion-scraped' | 'local' = 'local';

      // Determine source and count events based on calendar type
      if (cal.url && typeof cal.url === 'string' && cal.url.trim() !== '' && !('type' in cal)) {
        // This is an iCal calendar (has url property but no type)
        source = 'ical';
        eventCount = iCalEvents.filter(event => event.calendarId === cal.id).length;
        hasEvents = eventCount > 0;
      } else if ('type' in cal && cal.type === 'notion-scraped') {
        // This is a Notion API calendar
        source = 'notion-scraped';
        eventCount = scrapedEvents.filter(event => event.calendarId === cal.id).length;
        hasEvents = eventCount > 0;
      } else {
        // Local or unknown calendar type
        source = 'local';
        eventCount = cal.eventCount || 0;
        hasEvents = eventCount > 0;
      }

  // debug removed: calendar event summary

      return {
        id: cal?.id || '',
        summary: cal?.name || 'Unnamed Calendar',
        color: cal?.color || '#3b82f6',
        primary: cal?.id === 'primary',
        hasEvents,
        eventCount,
        lastSync: cal?.lastSync,
        source
      };
    });

    return calendarList;
  }, [allCalendars, getICalEvents, scrapedEvents]);

  // Initialize selected calendars ONLY on first load when user hasn't made selections
  useEffect(() => {
    if (!Array.isArray(enabledCalendars) || hasUserMadeSelection) return;
    
    const enabledWithEventsIds = calendarsFromEvents
      .filter(cal => cal?.hasEvents)
      .map(cal => cal?.id)
      .filter(Boolean);
    
    // Only auto-select if there are calendars with events AND user hasn't made any explicit selections
    if (enabledWithEventsIds.length > 0 && selectedCalendarIds.length === 0 && !hasUserMadeSelection) {
  // debug removed: initial auto-select of calendars with events
      setSelectedCalendarIds(enabledWithEventsIds);
    }
  }, [calendarsFromEvents, enabledCalendars, hasUserMadeSelection, selectedCalendarIds.length]);

  // Toggle calendar (support both 1 and 2 parameter versions)
  const toggleCalendar = useCallback((calendarId: string, checked?: boolean) => {
  // debug removed: toggleCalendar invocation
    
    // Mark that user has made an explicit selection
    setHasUserMadeSelection(true);
    
    setSelectedCalendarIds(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      let newSelected: string[];
      
      if (typeof checked === 'boolean') {
        // Two parameter version
        if (checked) {
          newSelected = safePrev.includes(calendarId) ? safePrev : [...safePrev, calendarId];
        } else {
          newSelected = safePrev.filter(id => id !== calendarId);
        }
      } else {
        // Single parameter version (toggle)
        if (safePrev.includes(calendarId)) {
          newSelected = safePrev.filter(id => id !== calendarId);
        } else {
          newSelected = [...safePrev, calendarId];
        }
      }
      
  // debug removed: toggleCalendar state change details
      
      return newSelected;
    });
  }, []); // Remove dependency on selectedCalendarIds to fix circular dependency

  const selectAllCalendars = useCallback(() => {
    if (!Array.isArray(enabledCalendars)) return;
    setHasUserMadeSelection(true);
    const enabledIds = enabledCalendars.map(cal => cal?.id).filter(Boolean);
  // debug removed: selectAllCalendars called
    setSelectedCalendarIds(enabledIds);
  }, [enabledCalendars]);

  const selectCalendarsWithEvents = useCallback(() => {
    if (!Array.isArray(calendarsFromEvents)) return;
    setHasUserMadeSelection(true);
    const calendarsWithEventsIds = calendarsFromEvents
      .filter(cal => cal?.hasEvents)
      .map(cal => cal?.id)
      .filter(Boolean);
  // debug removed: selectCalendarsWithEvents called
    setSelectedCalendarIds(calendarsWithEventsIds);
  }, [calendarsFromEvents]);

  const clearAllCalendars = useCallback(() => {
  // debug removed: clearAllCalendars called
    setHasUserMadeSelection(true);
    setSelectedCalendarIds([]);
  }, []);

  const updateSelectedCalendars = useCallback((newSelectedIds: string[]) => {
    const safeNewSelectedIds = Array.isArray(newSelectedIds) ? newSelectedIds : [];
  // debug removed: updateSelectedCalendars invoked
    setHasUserMadeSelection(true);
    setSelectedCalendarIds(safeNewSelectedIds);
  }, []);

  const cleanupDeletedCalendar = useCallback((calendarId: string) => {
  // debug removed: cleanupDeletedCalendar called
    setSelectedCalendarIds(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.filter(id => id !== calendarId);
    });
  }, []);

  const forceRefresh = useCallback(() => {
  // debug removed: forceRefresh called
    setRefreshKey(prev => prev + 1);
  }, []);

  const isLoading = iCalLoading || scrapedLoading;

  // Ensure all returned arrays are safe
  const safeScrapedEvents = Array.isArray(scrapedEvents) ? scrapedEvents : [];
  const safeSelectedCalendarIds = Array.isArray(selectedCalendarIds) ? selectedCalendarIds : [];

  // Add logging for current state
  // debug removed: current state snapshot

  return {
    allCalendars,
    enabledCalendars,
    selectedCalendarIds: safeSelectedCalendarIds,
    notionEvents: [], // Legacy support - empty array since legacy integration removed
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
