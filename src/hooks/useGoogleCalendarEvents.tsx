
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Event } from '@/types/calendar';

export const useGoogleCalendarEvents = () => {
  const [googleEvents, setGoogleEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const loadGoogleEvents = async () => {
    if (!user) {
      console.log('useGoogleCalendarEvents: No user found, skipping event load');
      return;
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
      
      // Group events by calendar for debugging
      const eventsByCalendar = {};
      (data || []).forEach(dbEvent => {
        const calendarId = dbEvent.calendar_id || 'primary';
        if (!eventsByCalendar[calendarId]) {
          eventsByCalendar[calendarId] = [];
        }
        eventsByCalendar[calendarId].push(dbEvent);
      });

      console.log('useGoogleCalendarEvents: Events grouped by calendar:', eventsByCalendar);

      // Convert database events to Event format
      const convertedEvents: Event[] = (data || []).map((dbEvent, index) => {
        const event = {
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
        };
        
        console.log(`useGoogleCalendarEvents: Converted event "${event.title}" from calendar "${event.calendarId}"`);
        return event;
      });

      console.log(`useGoogleCalendarEvents: Successfully converted ${convertedEvents.length} events`);
      setGoogleEvents(convertedEvents);
    } catch (error) {
      console.error('useGoogleCalendarEvents: Error loading Google Calendar events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      console.log('useGoogleCalendarEvents: User detected, loading events');
      loadGoogleEvents();
    } else {
      console.log('useGoogleCalendarEvents: No user, clearing events');
      setGoogleEvents([]);
    }
  }, [user]);

  return {
    googleEvents,
    isLoading,
    refreshEvents: loadGoogleEvents
  };
};
