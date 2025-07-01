
/**
 * Notion Calendar Manager Hook
 * 
 * Main hook that coordinates all Notion calendar operations
 */

import { useState, useEffect, useCallback } from 'react';
import { NotionCalendar } from '@/types/notion';
import { NotionServiceFacade } from '@/services/notion/NotionServiceFacade';
import { useNotionCalendarStorage } from './useNotionCalendarStorage';
import { useNotionEventStorage } from './useNotionEventStorage';
import { useNotionSync } from './useNotionSync';
import { useSettings } from '@/contexts/SettingsContext';

export const useNotionCalendarManager = () => {
  const [calendars, setCalendars] = useState<NotionCalendar[]>([]);
  const { notionIntegrationToken } = useSettings();
  
  const {
    isLoading: storageLoading,
    loadCalendars,
    saveCalendar,
    updateCalendar: updateCalendarStorage,
    removeCalendar: removeCalendarStorage
  } = useNotionCalendarStorage();

  const {
    storeEvents,
    getEvents,
    removeCalendarEvents
  } = useNotionEventStorage();

  const {
    syncStatus,
    isLoading: syncLoading,
    syncCalendar: syncSingleCalendar
  } = useNotionSync();

  const isLoading = storageLoading || syncLoading;

  // Load calendars on mount
  useEffect(() => {
    const initializeCalendars = async () => {
      try {
        const loadedCalendars = await loadCalendars();
        // Extract database IDs from URLs
        const calendarsWithIds = loadedCalendars.map(cal => ({
          ...cal,
          databaseId: NotionServiceFacade.extractDatabaseId(cal.url) || ''
        }));
        setCalendars(calendarsWithIds);
      } catch (error) {
        console.error('Failed to load calendars:', error);
        setCalendars([]);
      }
    };

    initializeCalendars();
  }, [loadCalendars]);

  const addCalendar = useCallback(async (calendar: Omit<NotionCalendar, 'id' | 'databaseId'>) => {
    if (!notionIntegrationToken.trim()) {
      throw new Error('Notion integration token is required. Please configure it in Settings → Notion tab.');
    }
    
    if (!calendar.name || !calendar.url) {
      throw new Error('Calendar name and URL are required');
    }
    
    if (!NotionServiceFacade.isValidNotionUrl(calendar.url)) {
      throw new Error('Please provide a valid Notion database sharing URL');
    }

    const databaseId = NotionServiceFacade.extractDatabaseId(calendar.url);
    if (!databaseId) {
      throw new Error('Could not extract database ID from URL');
    }

    // Test the database access with the token
    const database = await NotionServiceFacade.fetchDatabase(databaseId, notionIntegrationToken);
    if (!database) {
      throw new Error('Could not access the Notion database. Please ensure it is shared with your integration.');
    }
    
    const newCalendarData = {
      id: `notion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: calendar.name.trim(),
      url: calendar.url.trim(),
      color: calendar.color || '#3b82f6',
      enabled: calendar.enabled !== undefined ? calendar.enabled : true,
      eventCount: 0
    };
    
    const savedCalendar = await saveCalendar(newCalendarData);
    const newCalendar = {
      ...savedCalendar,
      databaseId
    };
    
    setCalendars(prev => [...prev, newCalendar]);
    return newCalendar;
  }, [notionIntegrationToken, saveCalendar]);

  const updateCalendar = useCallback(async (id: string, updates: Partial<NotionCalendar>) => {
    await updateCalendarStorage(id, updates);
    setCalendars(prev => prev.map(cal => 
      cal.id === id ? { ...cal, ...updates } : cal
    ));
  }, [updateCalendarStorage]);

  const removeCalendar = useCallback(async (id: string) => {
    await removeCalendarStorage(id);
    removeCalendarEvents(id);
    setCalendars(prev => prev.filter(cal => cal.id !== id));
  }, [removeCalendarStorage, removeCalendarEvents]);

  const syncCalendar = useCallback(async (calendar: NotionCalendar) => {
    return syncSingleCalendar(
      calendar,
      notionIntegrationToken,
      storeEvents,
      updateCalendar
    );
  }, [syncSingleCalendar, notionIntegrationToken, storeEvents, updateCalendar]);

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

  const getNotionEvents = useCallback(() => {
    return getEvents();
  }, [getEvents]);

  return {
    calendars,
    isLoading,
    syncStatus,
    addCalendar,
    updateCalendar,
    removeCalendar,
    syncCalendar,
    syncAllCalendars,
    getNotionEvents,
    loadCalendars: async () => {
      const loadedCalendars = await loadCalendars();
      const calendarsWithIds = loadedCalendars.map(cal => ({
        ...cal,
        databaseId: NotionServiceFacade.extractDatabaseId(cal.url) || ''
      }));
      setCalendars(calendarsWithIds);
    }
  };
};
