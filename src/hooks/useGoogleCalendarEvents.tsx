
import { useState, useEffect, useCallback } from 'react';
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
          console.log('useGoogleCalendarEvents: Loading events from cache');
          return cacheData.events;
        } else {
          console.log('useGoogleCalendarEvents: Cache expired, clearing');
          localStorage.removeItem(CACHE_KEY);
          localStorage.removeItem(CACHE_EXPIRY_KEY);
        }
      }
    } catch (error) {
      console.error('useGoogleCalendarEvents: Error loading from cache:', error);
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
      console.log('useGoogleCalendarEvents: Saved events to cache');
    } catch (error) {
      console.error('useGoogleCalendarEvents: Error saving to cache:', error);
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
    console.log('useGoogleCalendarEvents: Cache cleared');
  }, []);

  const loadGoogleEvents = useCallback(async (forceRefresh = false) => {
    if (!user) {
      console.log('useGoogleCalendarEvents: No user found, skipping event load');
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
    console.log('useGoogleCalendarEvents: Starting to load Google Calendar events for user:', user.id);
    
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('useGoogleCalendarEvents: Database error:', error);
        throw error;
      }

      console.log(`useGoogleCalendarEvents: Found ${data?.length || 0} events in database`);

      // Convert database events to Event format
      const convertedEvents: Event[] = (data || []).map((dbEvent, index) => {
        // Check if this is an all-day event
        const isAllDay = dbEvent.is_all_day || false;
        
        let timeDisplay;
        if (isAllDay) {
          timeDisplay = 'All Day';
        } else {
          timeDisplay = new Date(dbEvent.start_time).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
          });
        }

        const event = {
          id: index + 1000,
          title: dbEvent.title,
          time: timeDisplay,
          location: dbEvent.location || undefined,
          attendees: Array.isArray(dbEvent.attendees) ? dbEvent.attendees.length : 0,
          category: 'Personal' as const,
          color: 'bg-blue-500',
          description: dbEvent.description || '',
          organizer: 'Google Calendar',
          date: new Date(dbEvent.start_time),
          calendarId: dbEvent.calendar_id || 'primary',
          calendarName: dbEvent.calendar_id || 'Primary Calendar'
        };
        
        console.log(`useGoogleCalendarEvents: Converted event "${event.title}" ${isAllDay ? '(All Day)' : `at ${event.time}`} from calendar "${event.calendarId}"`);
        return event;
      });

      console.log(`useGoogleCalendarEvents: Successfully converted ${convertedEvents.length} events`);
      setGoogleEvents(convertedEvents);
      
      // Save to cache
      saveToCache(convertedEvents);
    } catch (error) {
      console.error('useGoogleCalendarEvents: Error loading Google Calendar events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, loadFromCache, saveToCache]);

  // Handle real-time updates from push notifications
  const handleWebhookUpdate = useCallback(async (calendarId: string, eventId?: string) => {
    if (!user) return;

    console.log('useGoogleCalendarEvents: Handling webhook update for calendar:', calendarId, 'event:', eventId);
    
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

    window.addEventListener('google-calendar-webhook' as any, handleCustomWebhook);

    return () => {
      window.removeEventListener('google-calendar-webhook' as any, handleCustomWebhook);
    };
  }, [handleWebhookUpdate]);

  useEffect(() => {
    if (user) {
      console.log('useGoogleCalendarEvents: User detected, loading events');
      loadGoogleEvents();
    } else {
      console.log('useGoogleCalendarEvents: No user, clearing events and cache');
      setGoogleEvents([]);
      clearCache();
    }
  }, [user, loadGoogleEvents, clearCache]);

  return {
    googleEvents,
    isLoading,
    refreshEvents: () => loadGoogleEvents(true),
    clearCache,
    handleWebhookUpdate
  };
};
