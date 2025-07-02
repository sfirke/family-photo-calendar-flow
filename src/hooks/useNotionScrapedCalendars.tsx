/**
 * Hook for managing scraped Notion calendars and events
 */

import { useState, useEffect, useCallback } from 'react';
import { NotionScrapedCalendar, notionScrapedEventsStorage } from '@/services/notionScrapedEventsStorage';
import { NotionScrapedEvent, notionPageScraper } from '@/services/NotionPageScraper';
import { useToast } from '@/hooks/use-toast';

export interface NotionScrapedSyncStatus {
  [calendarId: string]: 'syncing' | 'success' | 'error' | '';
}

export const useNotionScrapedCalendars = () => {
  const [calendars, setCalendars] = useState<NotionScrapedCalendar[]>([]);
  const [events, setEvents] = useState<NotionScrapedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<NotionScrapedSyncStatus>({});
  const { toast } = useToast();

  // Load calendars from IndexedDB
  const loadCalendars = useCallback(async () => {
    try {
      const storedCalendars = await notionScrapedEventsStorage.getAllCalendars();
      setCalendars(storedCalendars);
    } catch (error) {
      console.error('Error loading scraped Notion calendars:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load scraped Notion calendars",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Load events from IndexedDB
  const loadEvents = useCallback(async () => {
    try {
      const storedEvents = await notionScrapedEventsStorage.getAllEvents();
      setEvents(storedEvents);
      console.log('Loaded scraped Notion events:', storedEvents.length);
    } catch (error) {
      console.error('Error loading scraped Notion events:', error);
    }
  }, []);

  // Add a new calendar
  const addCalendar = useCallback(async (calendarData: Omit<NotionScrapedCalendar, 'id' | 'type'>) => {
    try {
      const newCalendar: NotionScrapedCalendar = {
        ...calendarData,
        id: `notion_scraped_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'notion-scraped'
      };

      await notionScrapedEventsStorage.addCalendar(newCalendar);
      await loadCalendars();
      
      toast({
        title: "Calendar Added",
        description: `Successfully added scraped calendar: ${newCalendar.name}`,
      });

      return newCalendar;
    } catch (error) {
      console.error('Error adding scraped calendar:', error);
      toast({
        title: "Error",
        description: "Failed to add scraped calendar",
        variant: "destructive"
      });
      throw error;
    }
  }, [loadCalendars, toast]);

  // Update a calendar
  const updateCalendar = useCallback(async (id: string, updates: Partial<NotionScrapedCalendar>) => {
    try {
      await notionScrapedEventsStorage.updateCalendar(id, updates);
      await loadCalendars();
    } catch (error) {
      console.error('Error updating scraped calendar:', error);
      toast({
        title: "Update Error",
        description: "Failed to update scraped calendar",
        variant: "destructive"
      });
      throw error;
    }
  }, [loadCalendars, toast]);

  // Remove a calendar
  const removeCalendar = useCallback(async (id: string) => {
    try {
      await notionScrapedEventsStorage.deleteCalendar(id);
      await loadCalendars();
      await loadEvents();
      
      toast({
        title: "Calendar Removed",
        description: "Successfully removed scraped calendar and its events",
      });
    } catch (error) {
      console.error('Error removing scraped calendar:', error);
      toast({
        title: "Error",
        description: "Failed to remove scraped calendar",
        variant: "destructive"
      });
      throw error;
    }
  }, [loadCalendars, loadEvents, toast]);

  // Sync a single calendar
  const syncCalendar = useCallback(async (calendar: NotionScrapedCalendar) => {
    setSyncStatus(prev => ({ ...prev, [calendar.id]: 'syncing' }));

    try {
      console.log(`🔄 Syncing scraped calendar: ${calendar.name}`);
      
      // Scrape the Notion page with the calendar ID
      const result = await notionPageScraper.scrapePage(calendar.url, calendar.id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to scrape page');
      }

      // Save events to IndexedDB
      await notionScrapedEventsStorage.saveEvents(calendar.id, result.events);

      // Update calendar metadata
      await updateCalendar(calendar.id, {
        lastSync: new Date().toISOString(),
        eventCount: result.events.length,
        metadata: result.metadata
      });

      // Reload events
      await loadEvents();

      setSyncStatus(prev => ({ ...prev, [calendar.id]: 'success' }));
      
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${result.events.length} events from ${calendar.name}`,
      });

      console.log(`✅ Synced ${result.events.length} events from scraped calendar: ${calendar.name}`);

    } catch (error) {
      console.error('Error syncing scraped calendar:', error);
      setSyncStatus(prev => ({ ...prev, [calendar.id]: 'error' }));
      
      toast({
        title: "Sync Failed",
        description: `Failed to sync ${calendar.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });

      throw error;
    }
  }, [updateCalendar, loadEvents, toast]);

  // Sync all enabled calendars
  const syncAllCalendars = useCallback(async () => {
    setIsLoading(true);
    const enabledCalendars = calendars.filter(cal => cal.enabled);

    try {
      await Promise.all(
        enabledCalendars.map(calendar => syncCalendar(calendar))
      );
      
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${enabledCalendars.length} scraped calendars`,
      });
    } catch (error) {
      console.error('Error syncing all scraped calendars:', error);
      // Individual error messages are handled in syncCalendar
    } finally {
      setIsLoading(false);
    }
  }, [calendars, syncCalendar, toast]);

  // Validate a Notion URL
  const validateNotionUrl = useCallback(async (url: string): Promise<{ isValid: boolean; error?: string }> => {
    try {
      const urlInfo = notionPageScraper.parseNotionUrl(url);
      if (!urlInfo) {
        return { isValid: false, error: 'Invalid Notion URL format' };
      }

      // Try to fetch a small sample to validate access
      const result = await notionPageScraper.scrapePage(url, 'validation');
      
      return {
        isValid: result.success,
        error: result.error
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  }, []);

  // Get events for filtering
  const getScrapedEvents = useCallback(() => {
    return events;
  }, [events]);

  // Initialize
  useEffect(() => {
    loadCalendars();
    loadEvents();
  }, [loadCalendars, loadEvents]);

  return {
    calendars,
    events,
    isLoading,
    syncStatus,
    addCalendar,
    updateCalendar,
    removeCalendar,
    syncCalendar,
    syncAllCalendars,
    validateNotionUrl,
    getScrapedEvents
  };
};
