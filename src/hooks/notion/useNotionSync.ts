
/**
 * Notion Sync Hook
 * 
 * Handles synchronization logic for Notion calendars
 */

import { useState, useCallback } from 'react';
import { NotionCalendar } from '@/types/notion';
import { NotionServiceFacade } from '@/services/notion/NotionServiceFacade';

export const useNotionSync = () => {
  const [syncStatus, setSyncStatus] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const syncCalendar = useCallback(async (
    calendar: NotionCalendar, 
    token: string, 
    onEventsReady: (calendarId: string, events: any[]) => void,
    onCalendarUpdate: (calendarId: string, updates: Partial<NotionCalendar>) => Promise<void>
  ) => {
    if (!token.trim()) {
      throw new Error('Notion integration token is required. Please configure it in Settings → Notion tab.');
    }

    setIsLoading(true);
    setSyncStatus(prev => ({ ...prev, [calendar.id]: 'syncing' }));

    try {
      console.log('Syncing Notion calendar:', calendar.name);
      
      if (!calendar.databaseId) {
        throw new Error('Calendar does not have a valid database ID');
      }

      // Fetch all pages from the database
      const allPages = await NotionServiceFacade.fetchDatabaseEntries(calendar.databaseId, token);
      console.log(`Processing ${allPages.length} pages from Notion database`);

      // Convert pages to events
      const events = allPages.map(page => 
        NotionServiceFacade.pageToEvent(page, calendar, calendar.propertyMappings)
      );

      // Filter out events with invalid dates or titles
      const validEvents = events.filter(event => 
        event.title && event.title !== 'Untitled Event' && event.date
      );

      console.log(`Converted ${validEvents.length} valid events`);

      // Store events via callback
      onEventsReady(calendar.id, validEvents);

      // Update calendar sync status
      await onCalendarUpdate(calendar.id, {
        lastSync: new Date().toISOString(),
        eventCount: validEvents.length
      });

      setSyncStatus(prev => ({ ...prev, [calendar.id]: 'success' }));
      console.log(`Successfully synced ${validEvents.length} events from ${calendar.name}`);
      return validEvents;

    } catch (error) {
      console.error('Error syncing Notion calendar:', error);
      setSyncStatus(prev => ({ ...prev, [calendar.id]: 'error' }));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    syncStatus,
    isLoading,
    syncCalendar
  };
};
