
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Event } from '@/types/calendar';
import { sampleEvents } from '@/data/sampleEvents';
import { supabase } from '@/integrations/supabase/client';
import { useHybridAuth } from './useHybridAuth';

const LOCAL_EVENTS_KEY = 'family_calendar_events';
const GOOGLE_SYNC_STATUS_KEY = 'family_calendar_google_sync_status';
const LAST_SYNC_KEY = 'family_calendar_last_sync';

interface GoogleSyncStatus {
  isEnabled: boolean;
  lastSync: string | null;
  selectedCalendarIds: string[];
  calendars: Array<{
    id: string;
    summary: string;
    primary?: boolean;
    eventCount: number;
  }>;
}

interface LocalEventStorage {
  events: Event[];
  lastSync: string;
  version: string;
  googleEvents: Event[];
  localEvents: Event[];
}

export const useHybridCalendarSync = () => {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<GoogleSyncStatus>({
    isEnabled: false,
    lastSync: null,
    selectedCalendarIds: [],
    calendars: []
  });
  const { user } = useHybridAuth();

  // Load events from localStorage
  const loadLocalEvents = useCallback(() => {
    try {
      const storedData = localStorage.getItem(LOCAL_EVENTS_KEY);
      const storedSyncStatus = localStorage.getItem(GOOGLE_SYNC_STATUS_KEY);
      
      if (storedData) {
        const eventData: LocalEventStorage = JSON.parse(storedData);
        
        // Convert date strings back to Date objects
        const eventsWithDates = eventData.events.map(event => ({
          ...event,
          date: new Date(event.date)
        }));
        
        setAllEvents(eventsWithDates);
      } else {
        // Initialize with sample events
        const enhancedSampleEvents = sampleEvents.map((event, index) => ({
          ...event,
          id: event.id || (1000 + index),
          calendarId: 'local_calendar',
          calendarName: 'Family Calendar'
        }));
        
        setAllEvents(enhancedSampleEvents);
        saveEventsToStorage(enhancedSampleEvents, [], enhancedSampleEvents);
      }

      if (storedSyncStatus) {
        setSyncStatus(JSON.parse(storedSyncStatus));
      }
    } catch (error) {
      console.error('Error loading local events:', error);
      setAllEvents(sampleEvents);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save events to localStorage
  const saveEventsToStorage = useCallback((allEvents: Event[], googleEvents: Event[] = [], localEvents: Event[] = []) => {
    try {
      const storageData: LocalEventStorage = {
        events: allEvents,
        googleEvents,
        localEvents,
        lastSync: new Date().toISOString(),
        version: '2.0'
      };
      
      localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(storageData));
    } catch (error) {
      console.error('Error saving events to localStorage:', error);
    }
  }, []);

  // Calculate extended date range (current month + first week of next month)
  const getExtendedDateRange = useCallback(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Start of current month
    const timeMin = new Date(currentYear, currentMonth, 1).toISOString();
    
    // First week of next month (7 days after next month starts)
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const timeMax = new Date(nextYear, nextMonth, 8).toISOString();
    
    return { timeMin, timeMax };
  }, []);

  // Sync with Google Calendar
  const syncWithGoogle = useCallback(async (manualSync = false) => {
    if (!user?.isGoogleConnected || !user.googleTokens) {
      console.log('Google Calendar not connected');
      return false;
    }

    setIsSyncing(true);
    try {
      const { timeMin, timeMax } = getExtendedDateRange();
      
      const { data, error } = await supabase.functions.invoke('sync-google-calendar', {
        body: { 
          userId: user.id,
          manualSync,
          timeMin,
          timeMax,
          extendedRange: true
        }
      });

      if (error) throw error;

      // Get current local events (non-Google)
      const currentData = localStorage.getItem(LOCAL_EVENTS_KEY);
      let localEvents: Event[] = [];
      
      if (currentData) {
        const parsed: LocalEventStorage = JSON.parse(currentData);
        localEvents = parsed.localEvents || parsed.events.filter(e => e.calendarId === 'local_calendar');
      }

      // Fetch synced events from database
      const { data: dbEvents, error: dbError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (dbError) throw dbError;

      // Convert database events to Event format
      const googleEvents: Event[] = (dbEvents || []).map(dbEvent => ({
        id: parseInt(dbEvent.id) || Date.now(),
        title: dbEvent.title,
        description: dbEvent.description || undefined,
        date: new Date(dbEvent.start_time),
        time: dbEvent.is_all_day ? undefined : new Date(dbEvent.start_time).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit'
        }),
        endTime: dbEvent.is_all_day ? undefined : new Date(dbEvent.end_time).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit'
        }),
        location: dbEvent.location || undefined,
        calendarId: dbEvent.calendar_id,
        calendarName: dbEvent.calendar_name,
        isAllDay: dbEvent.is_all_day,
        attendees: Array.isArray(dbEvent.attendees) ? dbEvent.attendees : []
      }));

      // Combine local and Google events
      const combinedEvents = [...localEvents, ...googleEvents];
      
      setAllEvents(combinedEvents);
      saveEventsToStorage(combinedEvents, googleEvents, localEvents);

      // Update sync status
      const updatedSyncStatus = {
        ...syncStatus,
        lastSync: new Date().toISOString(),
        calendars: data.calendars || []
      };
      
      setSyncStatus(updatedSyncStatus);
      localStorage.setItem(GOOGLE_SYNC_STATUS_KEY, JSON.stringify(updatedSyncStatus));
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

      console.log(`Successfully synced ${googleEvents.length} Google Calendar events`);
      return true;
    } catch (error) {
      console.error('Error syncing with Google Calendar:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [user, syncStatus, getExtendedDateRange, saveEventsToStorage]);

  // Setup real-time webhook notifications
  const setupRealtimeSync = useCallback(async () => {
    if (!user?.isGoogleConnected) return false;

    try {
      const { data, error } = await supabase.functions.invoke('sync-google-calendar', {
        body: { 
          userId: user.id,
          action: 'setup-webhooks'
        }
      });

      if (error) throw error;

      // Listen for webhook notifications
      const channel = supabase
        .channel(`calendar-changes-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'calendar_events',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Real-time calendar update:', payload);
            // Trigger sync when changes detected
            syncWithGoogle(false);
          }
        )
        .subscribe();

      return true;
    } catch (error) {
      console.error('Error setting up real-time sync:', error);
      return false;
    }
  }, [user, syncWithGoogle]);

  // Auto-refresh tokens daily
  useEffect(() => {
    if (!user?.isGoogleConnected) return;

    const refreshInterval = setInterval(async () => {
      const { refreshGoogleTokens } = require('./useHybridAuth');
      const success = await refreshGoogleTokens();
      if (success) {
        console.log('Google tokens refreshed automatically');
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    return () => clearInterval(refreshInterval);
  }, [user?.isGoogleConnected]);

  // Auto-sync on Google connection
  useEffect(() => {
    if (user?.isGoogleConnected && !isSyncing) {
      syncWithGoogle(false);
      setupRealtimeSync();
    }
  }, [user?.isGoogleConnected, syncWithGoogle, setupRealtimeSync, isSyncing]);

  // Add local event
  const addLocalEvent = useCallback((newEvent: Omit<Event, 'id'>) => {
    const event: Event = {
      ...newEvent,
      id: Date.now(),
      calendarId: 'local_calendar',
      calendarName: 'Family Calendar'
    };

    const currentData = localStorage.getItem(LOCAL_EVENTS_KEY);
    let localEvents: Event[] = [];
    let googleEvents: Event[] = [];
    
    if (currentData) {
      const parsed: LocalEventStorage = JSON.parse(currentData);
      localEvents = parsed.localEvents || parsed.events.filter(e => e.calendarId === 'local_calendar');
      googleEvents = parsed.googleEvents || [];
    }

    const updatedLocalEvents = [...localEvents, event];
    const combinedEvents = [...updatedLocalEvents, ...googleEvents];
    
    setAllEvents(combinedEvents);
    saveEventsToStorage(combinedEvents, googleEvents, updatedLocalEvents);

    return event;
  }, [saveEventsToStorage]);

  // Get events grouped by source
  const eventsBySource = useMemo(() => {
    const local = allEvents.filter(e => e.calendarId === 'local_calendar');
    const google = allEvents.filter(e => e.calendarId !== 'local_calendar');
    
    return {
      local,
      google,
      all: allEvents
    };
  }, [allEvents]);

  // Initialize
  useEffect(() => {
    loadLocalEvents();
  }, [loadLocalEvents]);

  return {
    // Events
    allEvents,
    googleEvents: eventsBySource.google,
    localEvents: eventsBySource.local,
    
    // Status
    isLoading,
    isSyncing,
    syncStatus,
    
    // Actions
    syncWithGoogle: () => syncWithGoogle(true),
    addLocalEvent,
    setupRealtimeSync,
    
    // Legacy compatibility
    refreshEvents: loadLocalEvents,
    addEvent: addLocalEvent
  };
};
