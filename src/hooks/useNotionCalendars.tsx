
import { useState, useEffect, useCallback } from 'react';
import { NotionCalendar } from '@/types/notion';
import { NotionService } from '@/services/notionService';
import { calendarStorageService } from '@/services/calendarStorage';
import { useBackgroundSync } from './useBackgroundSync';
import { useSettings } from '@/contexts/SettingsContext';

const NOTION_EVENTS_KEY = 'family_calendar_notion_events';

export const useNotionCalendars = () => {
  const [calendars, setCalendars] = useState<NotionCalendar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ [key: string]: string }>({});
  const { notionIntegrationToken } = useSettings();
  const { 
    registerBackgroundSync, 
    triggerBackgroundSync,
    isBackgroundSyncSupported
  } = useBackgroundSync();

  // Load Notion calendars from IndexedDB
  const loadCalendars = useCallback(async () => {
    try {
      console.log('Loading Notion calendars from IndexedDB');
      const storedCalendars = await calendarStorageService.getAllCalendars();
      // Filter for Notion calendars (we'll extend storage to support type field)
      const notionCalendars = storedCalendars
        .filter(cal => cal.url.includes('notion.so'))
        .map(cal => ({
          id: cal.id,
          name: cal.name,
          url: cal.url,
          databaseId: NotionService.extractDatabaseId(cal.url) || '',
          color: cal.color,
          enabled: cal.enabled,
          lastSync: cal.lastSync,
          eventCount: cal.eventCount
        }));
      
      console.log('Loaded Notion calendars:', notionCalendars);
      setCalendars(notionCalendars);
      return notionCalendars;
    } catch (error) {
      console.error('Error loading Notion calendars:', error);
      setCalendars([]);
      return [];
    }
  }, []);

  // Add a new Notion calendar
  const addCalendar = useCallback(async (calendar: Omit<NotionCalendar, 'id' | 'databaseId'>) => {
    console.log('Adding new Notion calendar with URL:', calendar.url);
    
    if (!notionIntegrationToken.trim()) {
      throw new Error('Notion integration token is required. Please configure it in Settings → Notion tab.');
    }
    
    if (!calendar.name || !calendar.url) {
      throw new Error('Calendar name and URL are required');
    }
    
    if (!NotionService.isValidNotionUrl(calendar.url)) {
      throw new Error('Please provide a valid Notion database sharing URL');
    }

    const databaseId = NotionService.extractDatabaseId(calendar.url);
    if (!databaseId) {
      throw new Error('Could not extract database ID from URL');
    }

    // Test the database access with the token
    const database = await NotionService.fetchDatabase(databaseId, notionIntegrationToken);
    if (!database) {
      throw new Error('Could not access the Notion database. Please ensure it is shared with your integration.');
    }
    
    // Check for duplicates
    const existingCalendars = await calendarStorageService.getAllCalendars();
    const existingByUrl = existingCalendars.find(cal => 
      cal.url.toLowerCase().trim() === calendar.url.toLowerCase().trim()
    );

    if (existingByUrl) {
      throw new Error('A calendar with this URL already exists');
    }
    
    const newCalendar = {
      id: `notion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: calendar.name.trim(),
      url: calendar.url.trim(),
      color: calendar.color || '#3b82f6',
      enabled: calendar.enabled !== undefined ? calendar.enabled : true,
      eventCount: 0
    };
    
    try {
      await calendarStorageService.addCalendar(newCalendar);
      await loadCalendars();
      
      // Schedule background sync
      if (isBackgroundSyncSupported) {
        await triggerBackgroundSync();
      }
      
      console.log('Notion calendar added successfully');
      return {
        ...newCalendar,
        databaseId
      };
    } catch (error) {
      console.error('Error saving Notion calendar:', error);
      throw new Error('Failed to save calendar to database');
    }
  }, [loadCalendars, isBackgroundSyncSupported, triggerBackgroundSync, notionIntegrationToken]);

  // Sync a Notion calendar
  const syncCalendar = useCallback(async (calendar: NotionCalendar) => {
    if (!notionIntegrationToken.trim()) {
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
      let allPages: any[] = [];
      let cursor: string | undefined;
      let hasMore = true;

      while (hasMore) {
        const response = await NotionService.fetchDatabaseEntries(calendar.databaseId, notionIntegrationToken, cursor);
        if (!response) {
          throw new Error('Failed to fetch database entries');
        }

        allPages = [...allPages, ...response.results];
        cursor = response.next_cursor || undefined;
        hasMore = response.has_more;

        // Safety break to avoid infinite loops
        if (allPages.length > 1000) {
          console.warn('Reached maximum page limit (1000)');
          break;
        }
      }

      console.log(`Processing ${allPages.length} pages from Notion database`);

      // Convert pages to events
      const events = allPages.map(page => 
        NotionService.pageToEvent(page, calendar, calendar.propertyMappings)
      );

      // Filter out events with invalid dates or titles
      const validEvents = events.filter(event => 
        event.title && event.title !== 'Untitled Event' && event.date
      );

      console.log(`Converted ${validEvents.length} valid events`);

      // Store events in localStorage
      try {
        const existingEvents = JSON.parse(localStorage.getItem(NOTION_EVENTS_KEY) || '[]');
        const filteredExisting = existingEvents.filter((event: any) => event.calendarId !== calendar.id);
        const combinedEvents = [...filteredExisting, ...validEvents];
        localStorage.setItem(NOTION_EVENTS_KEY, JSON.stringify(combinedEvents));
        console.log('Notion events stored successfully');
      } catch (error) {
        console.error('Error storing Notion events:', error);
      }

      // Update calendar sync status
      await calendarStorageService.updateCalendar(calendar.id, {
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
  }, [notionIntegrationToken]);

  // Remove a Notion calendar
  const removeCalendar = useCallback(async (id: string) => {
    try {
      await calendarStorageService.deleteCalendar(id);
      setCalendars(prev => prev.filter(cal => cal.id !== id));
      
      // Remove events from localStorage
      try {
        const storedEvents = localStorage.getItem(NOTION_EVENTS_KEY);
        if (storedEvents) {
          const events = JSON.parse(storedEvents);
          const filteredEvents = events.filter((event: any) => event.calendarId !== id);
          localStorage.setItem(NOTION_EVENTS_KEY, JSON.stringify(filteredEvents));
        }
      } catch (error) {
        console.error('Error removing Notion calendar events:', error);
      }
      
      await loadCalendars();
      console.log(`Notion calendar ${id} removed successfully`);
    } catch (error) {
      console.error('Error removing Notion calendar:', error);
      throw error;
    }
  }, [loadCalendars]);

  // Get Notion events from localStorage
  const getNotionEvents = useCallback(() => {
    try {
      const stored = localStorage.getItem(NOTION_EVENTS_KEY);
      if (stored) {
        const events = JSON.parse(stored);
        const processedEvents = events.map((event: any) => ({
          ...event,
          date: new Date(event.date)
        }));
        console.log(`Loaded ${processedEvents.length} Notion events`);
        return processedEvents;
      }
      return [];
    } catch (error) {
      console.error('Error loading Notion events:', error);
      return [];
    }
  }, []);

  // Sync all enabled Notion calendars
  const syncAllCalendars = useCallback(async () => {
    const enabledCalendars = calendars.filter(cal => cal.enabled);
    
    for (const calendar of enabledCalendars) {
      try {
        await syncCalendar(calendar);
      } catch (error) {
        console.error(`Failed to sync Notion calendar ${calendar.name}:`, error);
      }
    }
  }, [calendars, syncCalendar]);

  useEffect(() => {
    loadCalendars();
  }, [loadCalendars]);

  return {
    calendars,
    isLoading,
    syncStatus,
    addCalendar,
    removeCalendar,
    syncCalendar,
    syncAllCalendars,
    getNotionEvents,
    loadCalendars
  };
};
