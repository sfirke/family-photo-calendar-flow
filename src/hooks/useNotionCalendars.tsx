
import { useState, useEffect, useCallback } from 'react';
import { NotionCalendar, NotionEvent, NotionSyncStatus, NotionPage } from '@/types/notion';
import { notionService } from '@/services/notionService';
import { useSettings } from '@/contexts/SettingsContext';

const NOTION_CALENDARS_KEY = 'notion_calendars';
const NOTION_EVENTS_KEY = 'notion_events';

export const useNotionCalendars = () => {
  const [calendars, setCalendars] = useState<NotionCalendar[]>([]);
  const [events, setEvents] = useState<NotionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<NotionSyncStatus>({});
  const { notionToken, notionDatabaseId } = useSettings();

  // Load calendars from localStorage
  const loadCalendars = useCallback(() => {
    try {
      const stored = localStorage.getItem(NOTION_CALENDARS_KEY);
      if (stored) {
        const parsedCalendars = JSON.parse(stored);
        setCalendars(parsedCalendars);
      }
    } catch (error) {
      console.error('Error loading Notion calendars:', error);
    }
  }, []);

  // Load events from localStorage
  const loadEvents = useCallback(() => {
    try {
      const stored = localStorage.getItem(NOTION_EVENTS_KEY);
      if (stored) {
        const parsedEvents = JSON.parse(stored).map((event: any) => ({
          ...event,
          date: new Date(event.date)
        }));
        setEvents(parsedEvents);
        console.log('Loaded Notion events:', parsedEvents.length);
      }
    } catch (error) {
      console.error('Error loading Notion events:', error);
    }
  }, []);

  // Save calendars to localStorage
  const saveCalendars = useCallback((calendarsToSave: NotionCalendar[]) => {
    try {
      localStorage.setItem(NOTION_CALENDARS_KEY, JSON.stringify(calendarsToSave));
      setCalendars(calendarsToSave);
    } catch (error) {
      console.error('Error saving Notion calendars:', error);
    }
  }, []);

  // Save events to localStorage
  const saveEvents = useCallback((eventsToSave: NotionEvent[]) => {
    try {
      localStorage.setItem(NOTION_EVENTS_KEY, JSON.stringify(eventsToSave));
      setEvents(eventsToSave);
    } catch (error) {
      console.error('Error saving Notion events:', error);
    }
  }, []);

  // Add a new calendar
  const addCalendar = useCallback(async (calendarData: Omit<NotionCalendar, 'id'>) => {
    const newCalendar: NotionCalendar = {
      ...calendarData,
      id: `notion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'notion'
    };

    const updatedCalendars = [...calendars, newCalendar];
    saveCalendars(updatedCalendars);
    return newCalendar;
  }, [calendars, saveCalendars]);

  // Update a calendar
  const updateCalendar = useCallback(async (id: string, updates: Partial<NotionCalendar>) => {
    const updatedCalendars = calendars.map(cal => 
      cal.id === id ? { ...cal, ...updates } : cal
    );
    saveCalendars(updatedCalendars);
  }, [calendars, saveCalendars]);

  // Remove a calendar
  const removeCalendar = useCallback(async (id: string) => {
    const updatedCalendars = calendars.filter(cal => cal.id !== id);
    const updatedEvents = events.filter(event => event.calendarId !== id);
    
    saveCalendars(updatedCalendars);
    saveEvents(updatedEvents);
  }, [calendars, events, saveCalendars, saveEvents]);

  // Sync a single calendar using the configured database ID
  const syncCalendar = useCallback(async (calendar: NotionCalendar) => {
    if (!notionToken) {
      throw new Error('Notion token not configured');
    }

    if (!notionDatabaseId) {
      throw new Error('Notion database ID not configured');
    }

    setSyncStatus(prev => ({ ...prev, [calendar.id]: 'syncing' }));

    try {
      let notionEvents: NotionEvent[] = [];
      let pages: NotionPage[] = [];

      try {
        // Use the configured database ID from settings
        const database = await notionService.getDatabase(notionDatabaseId, notionToken);
        const queryResult = await notionService.queryDatabase(notionDatabaseId, notionToken);
        pages = queryResult.results as NotionPage[];
      } catch (dbError) {
        console.error('Database access failed:', dbError);
        throw new Error('Failed to access Notion database. Please check your integration permissions.');
      }

      notionEvents = notionService.transformToEvents(
        pages,
        calendar.id,
        calendar.name,
        calendar.color
      );

      // Update events - remove old events from this calendar and add new ones
      const otherEvents = events.filter(event => event.calendarId !== calendar.id);
      const allEvents = [...otherEvents, ...notionEvents];
      saveEvents(allEvents);

      // Update calendar with sync info
      await updateCalendar(calendar.id, {
        lastSync: new Date().toISOString(),
        eventCount: notionEvents.length
      });

      setSyncStatus(prev => ({ ...prev, [calendar.id]: 'success' }));
      console.log(`Synced ${notionEvents.length} events from Notion calendar: ${calendar.name}`);

    } catch (error) {
      console.error('Error syncing Notion calendar:', error);
      setSyncStatus(prev => ({ ...prev, [calendar.id]: 'error' }));
      throw error;
    }
  }, [notionToken, notionDatabaseId, events, saveEvents, updateCalendar]);

  // Sync all calendars
  const syncAllCalendars = useCallback(async () => {
    if (!notionToken) {
      throw new Error('Notion token not configured');
    }

    if (!notionDatabaseId) {
      throw new Error('Notion database ID not configured');
    }

    setIsLoading(true);
    const enabledCalendars = calendars.filter(cal => cal.enabled);

    try {
      await Promise.all(
        enabledCalendars.map(calendar => syncCalendar(calendar))
      );
    } catch (error) {
      console.error('Error syncing all Notion calendars:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [calendars, notionToken, notionDatabaseId, syncCalendar]);

  // Get events for filtering
  const getNotionEvents = useCallback(() => {
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
    getNotionEvents
  };
};
