
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Event } from '@/types/calendar';

const CACHE_KEY = 'google_calendar_events_cache';
const CACHE_EXPIRY_KEY = 'google_calendar_events_cache_expiry';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CachedEvents {
  events: Event[];
  timestamp: number;
}

export const useGoogleCalendarEvents = () => {
  const [googleEvents, setGoogleEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Load events from cache
  const loadFromCache = useCallback((): Event[] | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
      
      if (cached && expiry) {
        const cacheData: CachedEvents = JSON.parse(cached);
        const expiryTime = parseInt(expiry);
        
        if (Date.now() < expiryTime) {
          return cacheData.events;
        } else {
          localStorage.removeItem(CACHE_KEY);
          localStorage.removeItem(CACHE_EXPIRY_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
    }
    return null;
  }, []);

  // Save events to cache
  const saveToCache = useCallback((events: Event[]) => {
    try {
      const cacheData: CachedEvents = {
        events,
        timestamp: Date.now()
      };
      const expiry = Date.now() + CACHE_DURATION;
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      localStorage.setItem(CACHE_EXPIRY_KEY, expiry.toString());
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
  }, []);

  const loadGoogleEvents = useCallback(async (forceRefresh = false) => {
    if (!user) {
      return;
    }

    // Try to load from cache first unless force refresh is requested
    if (!forceRefresh) {
      const cachedEvents = loadFromCache();
      if (cachedEvents) {
        setGoogleEvents(cachedEvents);
        return;
      }
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Convert database events to Event format
      const convertedEvents: Event[] = (data || []).map((dbEvent, index) => {
        // Use start_time from database as the primary date source
        const startTime = new Date(dbEvent.start_time);
        const endTime = new Date(dbEvent.end_time);
        
        // Check if this is an all-day event
        const isAllDay = dbEvent.is_all_day || false;
        
        // Calculate if this is a multi-day event
        const daysDiff = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24));
        const isMultiDay = daysDiff > 1;
        
        let timeDisplay;
        if (isAllDay) {
          if (isMultiDay) {
            timeDisplay = `All Day (${daysDiff} days)`;
          } else {
            timeDisplay = 'All Day';
          }
        } else if (isMultiDay) {
          const startTimeStr = startTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
          });
          const endTimeStr = endTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
          });
          timeDisplay = `${startTimeStr} - ${endTimeStr} (${daysDiff} days)`;
        } else {
          timeDisplay = startTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
          });
        }

        // Use calendar_name if available, otherwise fall back to calendar_id or default
        const calendarName = dbEvent.calendar_name || 
                            (dbEvent.calendar_id === 'primary' ? 'Primary Calendar' : dbEvent.calendar_id) || 
                            'Unknown Calendar';

        return {
          id: index + 1000,
          title: dbEvent.title,
          time: timeDisplay,
          location: dbEvent.location || undefined,
          attendees: 0,
          category: 'Personal' as const,
          color: 'bg-blue-500',
          description: dbEvent.description || '',
          organizer: 'Google Calendar',
          date: startTime, // Use start_time as the main date
          calendarId: dbEvent.calendar_id || 'primary',
          calendarName: calendarName
        };
      });

      setGoogleEvents(convertedEvents);
      
      // Save to cache
      saveToCache(convertedEvents);
    } catch (error) {
      console.error('Error loading Google Calendar events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, loadFromCache, saveToCache]);

  // Handle real-time updates from push notifications
  const handleWebhookUpdate = useCallback(async (calendarId: string, eventId?: string) => {
    if (!user) return;
    
    // Clear cache and reload events
    clearCache();
    await loadGoogleEvents(true);
  }, [user, clearCache, loadGoogleEvents]);

  // Listen for custom webhook events
  useEffect(() => {
    const handleCustomWebhook = (event: CustomEvent) => {
      const { calendarId, eventId } = event.detail;
      handleWebhookUpdate(calendarId, eventId);
    };

    const handleCalendarUpdate = (event: CustomEvent) => {
      console.log('Calendar update event received:', event.detail);
      // Reload events when calendar is updated
      loadGoogleEvents(true);
    };

    window.addEventListener('google-calendar-webhook' as any, handleCustomWebhook);
    window.addEventListener('calendar-updated' as any, handleCalendarUpdate);

    return () => {
      window.removeEventListener('google-calendar-webhook' as any, handleCustomWebhook);
      window.removeEventListener('calendar-updated' as any, handleCalendarUpdate);
    };
  }, [handleWebhookUpdate, loadGoogleEvents]);

  useEffect(() => {
    if (user) {
      loadGoogleEvents();
    } else {
      setGoogleEvents([]);
      clearCache();
    }
  }, [user, loadGoogleEvents, clearCache]);

  // Memoize return value to prevent unnecessary re-renders
  const memoizedValue = useMemo(() => ({
    googleEvents,
    isLoading,
    refreshEvents: () => loadGoogleEvents(true),
    clearCache,
    handleWebhookUpdate
  }), [googleEvents, isLoading, loadGoogleEvents, clearCache, handleWebhookUpdate]);

  return memoizedValue;
};
