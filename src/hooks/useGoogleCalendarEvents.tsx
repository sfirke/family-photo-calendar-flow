
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Event } from '@/types/calendar';

export const useGoogleCalendarEvents = () => {
  const [googleEvents, setGoogleEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const loadGoogleEvents = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (error) throw error;

      // Convert database events to Event format
      const convertedEvents: Event[] = (data || []).map((dbEvent, index) => ({
        id: index + 1000, // Use high numbers to avoid conflicts with sample events
        title: dbEvent.title,
        time: new Date(dbEvent.start_time).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit' 
        }),
        location: dbEvent.location || undefined,
        attendees: Array.isArray(dbEvent.attendees) ? dbEvent.attendees.length : 0,
        category: 'Personal' as const,
        color: 'bg-blue-500',
        description: dbEvent.description || '',
        organizer: 'Google Calendar',
        date: new Date(dbEvent.start_time),
        calendarId: dbEvent.calendar_id || 'primary',
        calendarName: dbEvent.calendar_id || 'Primary Calendar'
      }));

      setGoogleEvents(convertedEvents);
    } catch (error) {
      console.error('Error loading Google Calendar events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadGoogleEvents();
    }
  }, [user]);

  return {
    googleEvents,
    isLoading,
    refreshEvents: loadGoogleEvents
  };
};
