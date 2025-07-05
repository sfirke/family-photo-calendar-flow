
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useICalCalendars } from './useICalCalendars';
import { useNotionScrapedCalendars } from './useNotionScrapedCalendars';

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

  // Load selectedCalendarIds from localStorage on init
  useEffect(() => {
    const stored = localStorage.getItem('selectedCalendarIds');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSelectedCalendarIds(parsed);
          setHasUserMadeSelection(true);
          console.log('📦 useCalendarSelection - Loaded from localStorage:', parsed);
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
      console.log('💾 useCalendarSelection - Saved to localStorage:', selectedCalendarIds);
    }
  }, [selectedCalendarIds, hasUserMadeSelection]);
  
  // Get calendars from all sources
  const { calendars: iCalCalendars = [], isLoading: iCalLoading, getICalEvents } = useICalCalendars();
  const { calendars: scrapedCalendars = [], events: scrapedEvents = [], isLoading: scrapedLoading } = useNotionScrapedCalendars();

  // Combine all calendars with safe array handling
  const allCalendars = useMemo(() => {
    const safeICalCalendars = Array.isArray(iCalCalendars) ? iCalCalendars : [];
    const safeScrapedCalendars = Array.isArray(scrapedCalendars) ? scrapedCalendars : [];
    
    console.log('Calendar counts:', {
      iCal: safeICalCalendars.length,
      scraped: safeScrapedCalendars.length
    });
    
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
    
    console.log('Event counts:', {
      iCal: iCalEvents.length,
      scraped: scrapedEvents.length
    });

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

      console.log(`Calendar ${cal.name} (${cal.id}):`, {
        source,
        eventCount,
        hasEvents,
        type: 'type' in cal ? cal.type : 'no-type'
      });

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
  }, [allCalendars, getICalEvents, scrapedEvents, refreshKey]);

  // Initialize selected calendars ONLY on first load when user hasn't made selections
  useEffect(() => {
    if (!Array.isArray(enabledCalendars) || hasUserMadeSelection) return;
    
    const enabledWithEventsIds = calendarsFromEvents
      .filter(cal => cal?.hasEvents)
      .map(cal => cal?.id)
      .filter(Boolean);
    
    // Only auto-select if there are calendars with events AND user hasn't made any explicit selections
    if (enabledWithEventsIds.length > 0 && selectedCalendarIds.length === 0 && !hasUserMadeSelection) {
      console.log('🔄 Initial auto-selecting calendars with events:', enabledWithEventsIds);
      setSelectedCalendarIds(enabledWithEventsIds);
    }
  }, [calendarsFromEvents, enabledCalendars, hasUserMadeSelection]);

  // Toggle calendar (support both 1 and 2 parameter versions)
  const toggleCalendar = useCallback((calendarId: string, checked?: boolean) => {
    console.log('🔄 toggleCalendar called:', { calendarId, checked });
    
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
      
      console.log('🔄 toggleCalendar state change:', {
        calendarId,
        checked,
        before: safePrev,
        after: newSelected,
        action: typeof checked === 'boolean' ? (checked ? 'select' : 'deselect') : 'toggle'
      });
      
      return newSelected;
    });
  }, []); // Remove dependency on selectedCalendarIds to fix circular dependency

  const selectAllCalendars = useCallback(() => {
    if (!Array.isArray(enabledCalendars)) return;
    setHasUserMadeSelection(true);
    const enabledIds = enabledCalendars.map(cal => cal?.id).filter(Boolean);
    console.log('🔄 selectAllCalendars called:', enabledIds);
    setSelectedCalendarIds(enabledIds);
  }, [enabledCalendars]);

  const selectCalendarsWithEvents = useCallback(() => {
    if (!Array.isArray(calendarsFromEvents)) return;
    setHasUserMadeSelection(true);
    const calendarsWithEventsIds = calendarsFromEvents
      .filter(cal => cal?.hasEvents)
      .map(cal => cal?.id)
      .filter(Boolean);
    console.log('🔄 selectCalendarsWithEvents called:', calendarsWithEventsIds);
    setSelectedCalendarIds(calendarsWithEventsIds);
  }, [calendarsFromEvents]);

  const clearAllCalendars = useCallback(() => {
    console.log('🔄 clearAllCalendars called');
    setHasUserMadeSelection(true);
    setSelectedCalendarIds([]);
  }, []);

  const updateSelectedCalendars = useCallback((newSelectedIds: string[]) => {
    const safeNewSelectedIds = Array.isArray(newSelectedIds) ? newSelectedIds : [];
    console.log('🔄 updateSelectedCalendars called:', safeNewSelectedIds);
    setHasUserMadeSelection(true);
    setSelectedCalendarIds(safeNewSelectedIds);
  }, []);

  const cleanupDeletedCalendar = useCallback((calendarId: string) => {
    console.log('🔄 cleanupDeletedCalendar called:', calendarId);
    setSelectedCalendarIds(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.filter(id => id !== calendarId);
    });
  }, []);

  const forceRefresh = useCallback(() => {
    console.log('🔄 forceRefresh called');
    setRefreshKey(prev => prev + 1);
  }, []);

  const isLoading = iCalLoading || scrapedLoading;

  // Ensure all returned arrays are safe
  const safeScrapedEvents = Array.isArray(scrapedEvents) ? scrapedEvents : [];
  const safeSelectedCalendarIds = Array.isArray(selectedCalendarIds) ? selectedCalendarIds : [];

  // Add logging for current state
  console.log('📊 useCalendarSelection current state:', {
    selectedCalendarIds: safeSelectedCalendarIds,
    calendarsFromEventsCount: calendarsFromEvents.length,
    isLoading
  });

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
