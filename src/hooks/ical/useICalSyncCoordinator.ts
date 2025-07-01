
import { useState, useCallback } from 'react';
import { Event } from '@/types/calendar';
import { ICalCalendar } from './useICalCalendarManagement';
import { ICalCalendarService } from '@/services/ical/ICalCalendarService';

export const useICalSyncCoordinator = () => {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const syncCalendar = useCallback(async (calendar: ICalCalendar): Promise<Event[]> => {
    setSyncStatus('syncing');
    setSyncError(null);
    
    try {
      const events = await ICalCalendarService.syncCalendar(calendar);
      setSyncStatus('success');
      setLastSyncTime(new Date());
      return events;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      setSyncStatus('error');
      setSyncError(errorMessage);
      console.error('Sync error:', error);
      throw error;
    }
  }, []);

  const syncAllCalendars = useCallback(async (calendars: ICalCalendar[]): Promise<Event[]> => {
    setSyncStatus('syncing');
    setSyncError(null);
    
    try {
      const enabledCalendars = calendars.filter(cal => cal.enabled);
      const syncPromises = enabledCalendars.map(calendar => syncCalendar(calendar));
      const results = await Promise.allSettled(syncPromises);
      
      const allEvents: Event[] = [];
      let hasErrors = false;
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allEvents.push(...result.value);
        } else {
          hasErrors = true;
          console.error(`Failed to sync calendar ${enabledCalendars[index].name}:`, result.reason);
        }
      });
      
      if (hasErrors) {
        setSyncStatus('error');
        setSyncError('Some calendars failed to sync');
      } else {
        setSyncStatus('success');
      }
      
      setLastSyncTime(new Date());
      return allEvents;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      setSyncStatus('error');
      setSyncError(errorMessage);
      throw error;
    }
  }, [syncCalendar]);

  const resetSyncStatus = useCallback(() => {
    setSyncStatus('idle');
    setSyncError(null);
  }, []);

  return {
    syncStatus,
    lastSyncTime,
    syncError,
    syncCalendar,
    syncAllCalendars,
    resetSyncStatus
  };
};
