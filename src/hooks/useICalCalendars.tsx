
import { useState, useEffect, useCallback } from 'react';
import { CalendarFeedService } from '@/services/calendarFeedService';
import { ICalEventService } from '@/services/icalEventService';
import { ICalFetchService } from '@/services/icalFetchService';
import { useCalendarSync } from './useCalendarSync';
import { useBackgroundSync } from './useBackgroundSync';

export interface ICalCalendar {
  id: string;
  name: string;
  url: string;
  color: string;
  enabled: boolean;
  lastSync?: string;
  eventCount?: number;
}

export const useICalCalendars = () => {
  const [calendars, setCalendars] = useState<ICalCalendar[]>([]);
  const { syncStatus, isLoading, startSync, completeSync, clearSyncStatus } = useCalendarSync();
  const { 
    registerBackgroundSync, 
    registerPeriodicSync, 
    triggerBackgroundSync,
    isBackgroundSyncSupported,
    processSyncQueue
  } = useBackgroundSync();

  // Load calendars from storage
  const loadCalendars = useCallback(async () => {
    try {
      const storedCalendars = await CalendarFeedService.getAllCalendars();
      const icalCalendars = storedCalendars.filter(cal => CalendarFeedService.isICalCalendar(cal)) as ICalCalendar[];
      setCalendars(icalCalendars);
      return icalCalendars;
    } catch (error) {
      console.error('Error loading iCal calendars:', error);
      setCalendars([]);
      return [];
    }
  }, []);

  // Initialize background sync
  useEffect(() => {
    if (calendars.length > 0 && isBackgroundSyncSupported) {
      const initBackgroundSync = async () => {
        try {
          await registerBackgroundSync();
          await registerPeriodicSync();
        } catch (error) {
          console.error('Failed to initialize background sync:', error);
        }
      };
      
      initBackgroundSync();
    }
  }, [calendars.length, isBackgroundSyncSupported, registerBackgroundSync, registerPeriodicSync]);

  // Add a new iCal calendar
  const addCalendar = useCallback(async (calendar: Omit<ICalCalendar, 'id'>) => {
    if (!calendar.name || !calendar.url) {
      throw new Error('Calendar name and URL are required');
    }
    
    const trimmedUrl = calendar.url.trim();
    if (!trimmedUrl) {
      throw new Error('Calendar URL cannot be empty');
    }
    
    // Check for duplicates
    const existingCalendars = await CalendarFeedService.getAllCalendars();
    const existingByName = existingCalendars.find(cal => 
      cal.name.toLowerCase().trim() === calendar.name.toLowerCase().trim()
    );
    const existingByUrl = existingCalendars.find(cal => 
      cal.url.toLowerCase().trim() === trimmedUrl.toLowerCase().trim()
    );

    if (existingByName) {
      throw new Error('A calendar with this name already exists');
    }
    if (existingByUrl) {
      throw new Error('A calendar with this URL already exists');
    }
    
    const newCalendar = await CalendarFeedService.addCalendar({
      ...calendar,
      url: trimmedUrl,
      type: 'ical'
    }) as ICalCalendar;
    
    await loadCalendars();
    
    // Schedule background sync
    if (isBackgroundSyncSupported) {
      await triggerBackgroundSync();
    }
    
    return newCalendar;
  }, [loadCalendars, isBackgroundSyncSupported, triggerBackgroundSync]);

  // Update an existing calendar
  const updateCalendar = useCallback(async (id: string, updates: Partial<ICalCalendar>) => {
    await CalendarFeedService.updateCalendar(id, updates);
    await loadCalendars();
  }, [loadCalendars]);

  // Remove a calendar
  const removeCalendar = useCallback(async (id: string) => {
    await CalendarFeedService.removeCalendar(id);
    setCalendars(prev => prev.filter(cal => cal.id !== id));
    clearSyncStatus(id);
    ICalEventService.removeEvents(id);
    await loadCalendars();
  }, [loadCalendars, clearSyncStatus]);

  // Sync a single calendar
  const syncCalendar = useCallback(async (calendar: ICalCalendar) => {
    if (!calendar.url || calendar.url.trim() === '') {
      throw new Error('Calendar does not have a valid URL for syncing.');
    }

    startSync(calendar.id);

    try {
      const icalData = await ICalFetchService.fetchICalData(calendar.url);
      
      if (!icalData || icalData.trim().length === 0) {
        throw new Error('Received empty calendar data');
      }

      if (!ICalEventService.isValidICalData(icalData)) {
        throw new Error('Invalid calendar format received');
      }

      const events = ICalEventService.parseICalData(icalData, calendar);
      ICalEventService.storeEvents(calendar.id, events);

      await updateCalendar(calendar.id, {
        lastSync: new Date().toISOString(),
        eventCount: events.length
      });

      completeSync(calendar.id, true);
      return events;

    } catch (error) {
      completeSync(calendar.id, false);
      throw error;
    }
  }, [startSync, completeSync, updateCalendar]);

  // Sync all enabled calendars
  const syncAllCalendars = useCallback(async () => {
    const enabledCalendars = calendars.filter(cal => cal.enabled);
    
    // Try background sync first if supported
    if (isBackgroundSyncSupported && enabledCalendars.length > 0) {
      try {
        const success = await triggerBackgroundSync();
        if (success) {
          return;
        }
      } catch (error) {
        console.error('Background sync failed, falling back to foreground sync:', error);
      }
    }
    
    // Fallback to foreground sync
    for (const calendar of enabledCalendars) {
      try {
        await syncCalendar(calendar);
      } catch (error) {
        console.error(`Failed to sync calendar ${calendar.name}:`, error);
      }
    }
  }, [calendars, syncCalendar, isBackgroundSyncSupported, triggerBackgroundSync]);

  // Get events from storage
  const getICalEvents = useCallback(() => {
    return ICalEventService.getEvents();
  }, []);

  const forceRefresh = useCallback(() => {
    loadCalendars();
    processSyncQueue();
  }, [loadCalendars, processSyncQueue]);

  useEffect(() => {
    loadCalendars();
  }, [loadCalendars]);

  return {
    calendars,
    isLoading,
    syncStatus,
    addCalendar,
    updateCalendar,
    removeCalendar,
    syncCalendar,
    syncAllCalendars,
    getICalEvents,
    forceRefresh,
    isBackgroundSyncSupported,
    triggerBackgroundSync
  };
};
