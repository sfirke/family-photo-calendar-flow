
/**
 * Hook for managing Notion API-based calendars (formerly scraped calendars)
 */

import { useState, useEffect, useCallback } from 'react';
import { NotionScrapedCalendar, notionScrapedEventsStorage } from '@/services/notionScrapedEventsStorage';
import { NotionScrapedEvent } from '@/services/NotionPageScraper';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NotionApiEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  description?: string;
  location?: string;
  status?: string;
  categories?: string[];
  priority?: string;
  properties?: Record<string, any>;
  sourceUrl?: string;
  scrapedAt?: string;
  endDate?: string;
  customProperties?: Record<string, any>;
}

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
      console.error('Error loading Notion calendars:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load Notion calendars",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Load events from IndexedDB
  const loadEvents = useCallback(async () => {
    try {
      const storedEvents = await notionScrapedEventsStorage.getAllEvents();
      setEvents(storedEvents);
      console.log('Loaded Notion events:', storedEvents.length);
    } catch (error) {
      console.error('Error loading Notion events:', error);
    }
  }, []);

  // Add a new calendar
  const addCalendar = useCallback(async (calendarData: Omit<NotionScrapedCalendar, 'id' | 'type'>) => {
    try {
      const newCalendar: NotionScrapedCalendar = {
        ...calendarData,
        id: `notion_api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'notion-scraped'
      };

      await notionScrapedEventsStorage.addCalendar(newCalendar);
      await loadCalendars();
      
      toast({
        title: "Calendar Added",
        description: `Successfully added Notion calendar: ${newCalendar.name}`,
      });

      return newCalendar;
    } catch (error) {
      console.error('Error adding calendar:', error);
      toast({
        title: "Error",
        description: "Failed to add calendar",
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
      console.error('Error updating calendar:', error);
      toast({
        title: "Update Error",
        description: "Failed to update calendar",
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
        description: "Successfully removed calendar and its events",
      });
    } catch (error) {
      console.error('Error removing calendar:', error);
      toast({
        title: "Error",
        description: "Failed to remove calendar",
        variant: "destructive"
      });
      throw error;
    }
  }, [loadCalendars, loadEvents, toast]);

  // Sync a single calendar using Notion API
  const syncCalendar = useCallback(async (calendar: NotionScrapedCalendar) => {
    if (!calendar.metadata?.token) {
      throw new Error('Notion integration token is required for this calendar');
    }

    if (!calendar.metadata?.databaseId) {
      throw new Error('Database ID is required for this calendar');
    }

    setSyncStatus(prev => ({ ...prev, [calendar.id]: 'syncing' }));

    try {
      console.log(`🔄 Syncing Notion calendar: ${calendar.name}`);
      
      // Call the Notion API edge function
      const { data, error } = await supabase.functions.invoke('notion-api', {
        body: {
          action: 'query',
          token: calendar.metadata.token,
          databaseId: calendar.metadata.databaseId,
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to sync with Notion API');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch events from Notion');
      }

      // Transform API events to our format
      const apiEvents: NotionApiEvent[] = data.events || [];
      const notionEvents: NotionScrapedEvent[] = apiEvents.map((event: NotionApiEvent) => {
        // Extract calendar name from properties to use as title
        const calendarNameProperty = event.properties?.['calendar name'] || event.properties?.['Calendar Name'];
        const eventTitle = calendarNameProperty?.title?.[0]?.plain_text || 
                          calendarNameProperty?.rich_text?.[0]?.plain_text ||
                          calendarNameProperty?.select?.name ||
                          event.title;

        // Build description with recipe, notes, and ingredients
        let enhancedDescription = event.description || '';
        
        const specialColumns = ['recipe', 'notes', 'ingredients'];
        const columnDescriptions: string[] = [];
        
        if (event.properties) {
          specialColumns.forEach(columnName => {
            const property = event.properties[columnName] || event.properties[columnName.charAt(0).toUpperCase() + columnName.slice(1)];
            if (property) {
              let value = '';
              if (property.rich_text && Array.isArray(property.rich_text)) {
                value = property.rich_text.map((text: any) => text.plain_text || '').join('');
              } else if (property.title && Array.isArray(property.title)) {
                value = property.title.map((text: any) => text.plain_text || '').join('');
              } else if (property.select?.name) {
                value = property.select.name;
              } else if (property.multi_select && Array.isArray(property.multi_select)) {
                value = property.multi_select.map((option: any) => option.name).join(', ');
              }
              
              if (value.trim()) {
                columnDescriptions.push(`${columnName.charAt(0).toUpperCase() + columnName.slice(1)}: ${value}`);
              }
            }
          });
        }

        if (columnDescriptions.length > 0) {
          enhancedDescription = enhancedDescription ? 
            `${enhancedDescription}\n\n${columnDescriptions.join('\n')}` : 
            columnDescriptions.join('\n');
        }

        return {
          id: event.id,
          title: eventTitle,
          date: new Date(event.date),
          time: event.time,
          description: enhancedDescription,
          location: event.location,
          status: event.status,
          categories: event.categories,
          priority: event.priority,
          properties: event.properties,
          sourceUrl: event.sourceUrl,
          scrapedAt: new Date(event.scrapedAt),
          calendarId: calendar.id,
          customProperties: event.customProperties,
          source: 'notion',
          dateRange: event.date ? {
            startDate: new Date(event.date),
            endDate: event.endDate ? new Date(event.endDate) : undefined
          } : undefined
        };
      });

      // Save events to IndexedDB
      await notionScrapedEventsStorage.saveEvents(calendar.id, notionEvents);

      // Update calendar metadata
      await updateCalendar(calendar.id, {
        lastSync: new Date().toISOString(),
        eventCount: notionEvents.length,
        metadata: {
          ...calendar.metadata,
          ...data.metadata
        }
      });

      // Reload events
      await loadEvents();

      setSyncStatus(prev => ({ ...prev, [calendar.id]: 'success' }));
      
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${notionEvents.length} events from ${calendar.name}`,
      });

      console.log(`✅ Synced ${notionEvents.length} events from Notion calendar: ${calendar.name}`);

    } catch (error) {
      console.error('Error syncing calendar:', error);
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
        description: `Successfully synced ${enabledCalendars.length} calendars`,
      });
    } catch (error) {
      console.error('Error syncing all calendars:', error);
      // Individual error messages are handled in syncCalendar
    } finally {
      setIsLoading(false);
    }
  }, [calendars, syncCalendar, toast]);

  // Validate a Notion integration and database
  const validateNotionUrl = useCallback(async (url: string, token?: string): Promise<{ isValid: boolean; error?: string }> => {
    try {
      console.log('Validating Notion integration and database...');
      
      if (!token) {
        return { isValid: false, error: 'Notion integration token is required' };
      }

      // Call the edge function to validate
      const { data, error } = await supabase.functions.invoke('notion-api', {
        body: {
          action: 'validate',
          token,
          url,
        }
      });

      if (error) {
        return { isValid: false, error: error.message || 'Validation failed' };
      }

      if (data.success) {
        console.log('Validation successful');
        return { isValid: true };
      } else {
        console.log('Validation failed:', data.error);
        return { isValid: false, error: data.error || 'Unable to access the Notion database' };
      }
    } catch (error) {
      console.error('URL validation error:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error occurred'
      };
    }
  }, []);

  // Test database access
  const testDatabaseAccess = useCallback(async (token: string, databaseId: string) => {
    const { data, error } = await supabase.functions.invoke('notion-api', {
      body: {
        action: 'test',
        token,
        databaseId,
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to test database access');
    }

    return data;
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
    testDatabaseAccess,
    getScrapedEvents
  };
};
