
/**
 * Notion Event Storage Hook
 * 
 * Handles persistence of Notion events in localStorage
 */

import { useCallback } from 'react';

const NOTION_EVENTS_KEY = 'family_calendar_notion_events';

export const useNotionEventStorage = () => {
  const storeEvents = useCallback((calendarId: string, events: any[]) => {
    try {
      const existingEvents = JSON.parse(localStorage.getItem(NOTION_EVENTS_KEY) || '[]');
      const filteredExisting = existingEvents.filter((event: any) => event.calendarId !== calendarId);
      const combinedEvents = [...filteredExisting, ...events];
      localStorage.setItem(NOTION_EVENTS_KEY, JSON.stringify(combinedEvents));
      console.log('Notion events stored successfully');
    } catch (error) {
      console.error('Error storing Notion events:', error);
    }
  }, []);

  const getEvents = useCallback(() => {
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

  const removeCalendarEvents = useCallback((calendarId: string) => {
    try {
      const storedEvents = localStorage.getItem(NOTION_EVENTS_KEY);
      if (storedEvents) {
        const events = JSON.parse(storedEvents);
        const filteredEvents = events.filter((event: any) => event.calendarId !== calendarId);
        localStorage.setItem(NOTION_EVENTS_KEY, JSON.stringify(filteredEvents));
      }
    } catch (error) {
      console.error('Error removing Notion calendar events:', error);
    }
  }, []);

  return {
    storeEvents,
    getEvents,
    removeCalendarEvents
  };
};
