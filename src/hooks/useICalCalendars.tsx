
import { useState, useEffect, useCallback } from 'react';
import { CalendarFeedService } from '@/services/calendarFeedService';
import { ICalEventService } from '@/services/icalEventService';
import { ICalFetchService } from '@/services/icalFetchService';
import { useCalendarSync } from './useCalendarSync';
import { useBackgroundSync } from './useBackgroundSync';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  // Load calendars from storage
  const loadCalendars = useCallback(async () => {
    try {
      const storedCalendars = await CalendarFeedService.getAllCalendars();
      const icalCalendars = storedCalendars.filter(cal => CalendarFeedService.isICalCalendar(cal)) as ICalCalendar[];
      setCalendars(icalCalendars);
      console.log('Loaded iCal calendars:', icalCalendars.length);
      return icalCalendars;
    } catch (error) {
      console.error('Error loading iCal calendars:', error);
      setCalendars([]);
      return [];
    }
  }, []);

  // Initialize background sync with fallback handling
  useEffect(() => {
    if (calendars.length > 0) {
      const initBackgroundSync = async () => {
        if (isBackgroundSyncSupported) {
          try {
            const bgSyncRegistered = await registerBackgroundSync();
            const periodicSyncRegistered = await registerPeriodicSync();
            
            if (!bgSyncRegistered && !periodicSyncRegistered) {
              console.log('Background sync not available, manual sync only');
            }
          } catch (error) {
            console.error('Failed to initialize background sync:', error);
          }
        } else {
          console.log('Background sync not supported by browser');
        }
      };
      
      initBackgroundSync();
    }
  }, [calendars.length, isBackgroundSyncSupported, registerBackgroundSync, registerPeriodicSync]);

  // Add a new iCal calendar with enhanced validation
  const addCalendar = useCallback(async (calendar: Omit<ICalCalendar, 'id'>) => {
    if (!calendar.name || !calendar.url) {
      throw new Error('Calendar name and URL are required');
    }
    
    const trimmedUrl = calendar.url.trim();
    if (!trimmedUrl) {
      throw new Error('Calendar URL cannot be empty');
    }
    
    // Enhanced URL validation
    try {
      new URL(trimmedUrl);
    } catch {
      throw new Error('Please enter a valid URL');
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
    
    // Try background sync first, then fallback to manual
    if (isBackgroundSyncSupported) {
      try {
        const success = await triggerBackgroundSync();
        if (!success) {
          console.log('Background sync failed, will sync manually');
        }
      } catch (error) {
        console.error('Background sync trigger failed:', error);
      }
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

  // Sync a single calendar with enhanced error handling
  const syncCalendar = useCallback(async (calendar: ICalCalendar) => {
    if (!calendar.url || calendar.url.trim() === '') {
      throw new Error('Calendar does not have a valid URL for syncing.');
    }

    console.log(`Starting sync for calendar: ${calendar.name}`);
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

      console.log(`Successfully synced ${events.length} events for ${calendar.name}`);
      completeSync(calendar.id, true);
      
      toast({
        title: "Calendar synced",
        description: `${calendar.name}: ${events.length} events synced`,
      });
      
      return events;

    } catch (error) {
      console.error(`Sync failed for ${calendar.name}:`, error);
      completeSync(calendar.id, false);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      toast({
        title: "Sync failed",
        description: `${calendar.name}: ${errorMessage}`,
        variant: "destructive"
      });
      
      throw error;
    }
  }, [startSync, completeSync, updateCalendar, toast]);

  // Sync all enabled calendars with better error handling
  const syncAllCalendars = useCallback(async () => {
    const enabledCalendars = calendars.filter(cal => cal.enabled);
    
    if (enabledCalendars.length === 0) {
      toast({
        title: "No calendars to sync",
        description: "Enable some calendars first",
      });
      return;
    }
    
    console.log(`Syncing ${enabledCalendars.length} enabled calendars`);
    
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
    let successCount = 0;
    let errorCount = 0;
    
    for (const calendar of enabledCalendars) {
      try {
        await syncCalendar(calendar);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Failed to sync calendar ${calendar.name}:`, error);
      }
    }
    
    // Show summary toast
    if (successCount > 0 || errorCount > 0) {
      toast({
        title: "Sync completed",
        description: `${successCount} succeeded, ${errorCount} failed`,
        variant: errorCount > 0 ? "destructive" : "default"
      });
    }
  }, [calendars, syncCalendar, isBackgroundSyncSupported, triggerBackgroundSync, toast]);

  // Get events from storage
  const getICalEvents = useCallback(() => {
    return ICalEventService.getEvents();
  }, []);

  const forceRefresh = useCallback(() => {
    console.log('Force refreshing iCal calendars and events');
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
