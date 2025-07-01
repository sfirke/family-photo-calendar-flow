
/**
 * Notion Calendar Storage Hook
 * 
 * Handles persistence of Notion calendar configurations
 */

import { useState, useCallback } from 'react';
import { NotionCalendar } from '@/types/notion';
import { calendarStorageService } from '@/services/calendarStorage';

export const useNotionCalendarStorage = () => {
  const [isLoading, setIsLoading] = useState(false);

  const loadCalendars = useCallback(async (): Promise<NotionCalendar[]> => {
    setIsLoading(true);
    try {
      console.log('Loading Notion calendars from IndexedDB');
      const storedCalendars = await calendarStorageService.getAllCalendars();
      
      const notionCalendars = storedCalendars
        .filter(cal => cal.url.includes('notion.so'))
        .map(cal => ({
          id: cal.id,
          name: cal.name,
          url: cal.url,
          databaseId: '', // Will be extracted from URL
          color: cal.color,
          enabled: cal.enabled,
          lastSync: cal.lastSync,
          eventCount: cal.eventCount
        }));
      
      console.log('Loaded Notion calendars:', notionCalendars);
      return notionCalendars;
    } catch (error) {
      console.error('Error loading Notion calendars:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveCalendar = useCallback(async (calendar: Omit<NotionCalendar, 'databaseId'>) => {
    setIsLoading(true);
    try {
      const newCalendar = {
        id: calendar.id,
        name: calendar.name.trim(),
        url: calendar.url.trim(),
        color: calendar.color || '#3b82f6',
        enabled: calendar.enabled !== undefined ? calendar.enabled : true,
        eventCount: calendar.eventCount || 0,
        lastSync: calendar.lastSync
      };
      
      await calendarStorageService.addCalendar(newCalendar);
      console.log('Notion calendar saved successfully');
      return newCalendar;
    } catch (error) {
      console.error('Error saving Notion calendar:', error);
      throw new Error('Failed to save calendar to database');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCalendar = useCallback(async (id: string, updates: Partial<NotionCalendar>) => {
    setIsLoading(true);
    try {
      await calendarStorageService.updateCalendar(id, updates);
      console.log('Notion calendar updated successfully');
    } catch (error) {
      console.error('Error updating Notion calendar:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeCalendar = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      await calendarStorageService.deleteCalendar(id);
      console.log(`Notion calendar ${id} removed successfully`);
    } catch (error) {
      console.error('Error removing Notion calendar:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    loadCalendars,
    saveCalendar,
    updateCalendar,
    removeCalendar
  };
};
