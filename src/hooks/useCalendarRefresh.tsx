/**
 * Calendar Refresh Hook
 * 
 * Provides a centralized mechanism for triggering calendar refresh
 * when sync operations complete for both iCal and Notion calendars.
 */

import { useCallback, useEffect, useState } from 'react';

export interface CalendarRefreshEvent {
  type: 'ical' | 'notion' | 'all';
  calendarId?: string;
  eventCount?: number;
  success: boolean;
  message?: string;
  phase: 'start' | 'complete';
}

const CALENDAR_REFRESH_EVENT = 'calendar-refresh';

export const useCalendarRefresh = () => {
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  /**
   * Trigger a calendar refresh event
   */
  const triggerRefresh = useCallback((refreshData: CalendarRefreshEvent) => {
  // debug removed: calendar refresh triggered
    
    const customEvent = new CustomEvent(CALENDAR_REFRESH_EVENT, {
      detail: refreshData
    });
    
    window.dispatchEvent(customEvent);
    setLastRefresh(new Date());
    setRefreshCount(prev => prev + 1);
  }, []);

  /**
   * Listen for calendar refresh events
   */
  const useRefreshListener = (callback: (event: CalendarRefreshEvent) => void) => {
    useEffect(() => {
      const handleRefresh = (event: CustomEvent<CalendarRefreshEvent>) => {
  // debug removed: calendar refresh event received
        callback(event.detail);
      };

      window.addEventListener(CALENDAR_REFRESH_EVENT, handleRefresh as EventListener);
      
      return () => {
        window.removeEventListener(CALENDAR_REFRESH_EVENT, handleRefresh as EventListener);
      };
    }, [callback]);
  };

  /**
   * Trigger refresh for iCal calendar sync completion
   */
  const triggerICalRefreshStart = useCallback((calendarId: string) => {
    triggerRefresh({
      type: 'ical',
      calendarId,
      eventCount: 0,
      success: true,
      phase: 'start'
    });
  }, [triggerRefresh]);

  const triggerICalRefresh = useCallback((calendarId: string, eventCount: number, success: boolean, message?: string) => {
    triggerRefresh({
      type: 'ical',
      calendarId,
      eventCount,
      success,
      message,
      phase: 'complete'
    });
  }, [triggerRefresh]);

  /**
   * Trigger refresh for Notion calendar sync completion
   */
  const triggerNotionRefreshStart = useCallback((calendarId: string) => {
    triggerRefresh({
      type: 'notion',
      calendarId,
      eventCount: 0,
      success: true,
      phase: 'start'
    });
  }, [triggerRefresh]);

  const triggerNotionRefresh = useCallback((calendarId: string, eventCount: number, success: boolean, message?: string) => {
    triggerRefresh({
      type: 'notion',
      calendarId,
      eventCount,
      success,
      message,
      phase: 'complete'
    });
  }, [triggerRefresh]);

  /**
   * Trigger refresh for all calendars (bulk sync completion)
   */
  const triggerAllRefreshStart = useCallback(() => {
    triggerRefresh({
      type: 'all',
      success: true,
      phase: 'start'
    });
  }, [triggerRefresh]);

  const triggerAllRefresh = useCallback((success: boolean, message?: string) => {
    triggerRefresh({
      type: 'all',
      success,
      message,
      phase: 'complete'
    });
  }, [triggerRefresh]);

  return {
    triggerRefresh,
  triggerICalRefreshStart,
  triggerICalRefresh,
  triggerNotionRefreshStart,
  triggerNotionRefresh,
  triggerAllRefreshStart,
    triggerAllRefresh,
    useRefreshListener,
    lastRefresh,
    refreshCount
  };
};

/**
 * Static utility functions for triggering refreshes from any component
 */
export const CalendarRefreshUtils = {
  triggerICalRefreshStart: (calendarId: string) => {
    const event = new CustomEvent(CALENDAR_REFRESH_EVENT, {
      detail: {
        type: 'ical',
        calendarId,
        eventCount: 0,
        success: true,
        phase: 'start'
      } as CalendarRefreshEvent
    });
    window.dispatchEvent(event);
  },
  triggerICalRefresh: (calendarId: string, eventCount: number, success: boolean, message?: string) => {
    const event = new CustomEvent(CALENDAR_REFRESH_EVENT, {
      detail: {
        type: 'ical',
        calendarId,
        eventCount,
        success,
        message,
        phase: 'complete'
      } as CalendarRefreshEvent
    });
    window.dispatchEvent(event);
  },
  triggerNotionRefreshStart: (calendarId: string) => {
    const event = new CustomEvent(CALENDAR_REFRESH_EVENT, {
      detail: {
        type: 'notion',
        calendarId,
        eventCount: 0,
        success: true,
        phase: 'start'
      } as CalendarRefreshEvent
    });
    window.dispatchEvent(event);
  },
  triggerNotionRefresh: (calendarId: string, eventCount: number, success: boolean, message?: string) => {
    const event = new CustomEvent(CALENDAR_REFRESH_EVENT, {
      detail: {
        type: 'notion',
        calendarId,
        eventCount,
        success,
        message,
        phase: 'complete'
      } as CalendarRefreshEvent
    });
    window.dispatchEvent(event);
  },
  triggerAllRefreshStart: () => {
    const event = new CustomEvent(CALENDAR_REFRESH_EVENT, {
      detail: {
        type: 'all',
        success: true,
        phase: 'start'
      } as CalendarRefreshEvent
    });
    window.dispatchEvent(event);
  },
  triggerAllRefresh: (success: boolean, message?: string) => {
    const event = new CustomEvent(CALENDAR_REFRESH_EVENT, {
      detail: {
        type: 'all',
        success,
        message,
        phase: 'complete'
      } as CalendarRefreshEvent
    });
    window.dispatchEvent(event);
  }
};