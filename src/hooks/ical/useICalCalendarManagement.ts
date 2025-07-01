
import { useState, useCallback } from 'react';
import { ICalCalendar } from '@/types/ical';
import { ICalCalendarService } from '@/services/ical/ICalCalendarService';

export const useICalCalendarManagement = () => {
  const [calendars, setCalendars] = useState<ICalCalendar[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addCalendar = useCallback(async (calendar: Omit<ICalCalendar, 'id' | 'syncStatus'>) => {
    setIsLoading(true);
    try {
      const newCalendar: ICalCalendar = {
        ...calendar,
        id: Date.now().toString(),
        syncStatus: 'idle'
      };
      
      const savedCalendar = await ICalCalendarService.saveCalendar(newCalendar);
      setCalendars(prev => [...prev, savedCalendar]);
      return savedCalendar;
    } catch (error) {
      console.error('Error adding calendar:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCalendar = useCallback(async (id: string, updates: Partial<ICalCalendar>) => {
    try {
      const updatedCalendar = await ICalCalendarService.updateCalendar(id, updates);
      setCalendars(prev => prev.map(cal => cal.id === id ? updatedCalendar : cal));
      return updatedCalendar;
    } catch (error) {
      console.error('Error updating calendar:', error);
      throw error;
    }
  }, []);

  const deleteCalendar = useCallback(async (id: string) => {
    try {
      await ICalCalendarService.deleteCalendar(id);
      setCalendars(prev => prev.filter(cal => cal.id !== id));
    } catch (error) {
      console.error('Error deleting calendar:', error);
      throw error;
    }
  }, []);

  const loadCalendars = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadedCalendars = await ICalCalendarService.loadCalendars();
      setCalendars(loadedCalendars);
    } catch (error) {
      console.error('Error loading calendars:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleCalendar = useCallback(async (id: string) => {
    const calendar = calendars.find(cal => cal.id === id);
    if (calendar) {
      await updateCalendar(id, { enabled: !calendar.enabled });
    }
  }, [calendars, updateCalendar]);

  return {
    calendars,
    isLoading,
    addCalendar,
    updateCalendar,
    deleteCalendar,
    loadCalendars,
    toggleCalendar
  };
};
