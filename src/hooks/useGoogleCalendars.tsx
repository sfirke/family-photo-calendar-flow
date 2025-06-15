
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface GoogleCalendar {
  id: string;
  summary: string;
  primary?: boolean;
}

export const useGoogleCalendars = () => {
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const fetchCalendars = async () => {
    if (!user) {
      setCalendars([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-google-calendar', {
        body: { userId: user.id, action: 'list-calendars' }
      });

      if (error) throw error;

      setCalendars(data.calendars || []);
    } catch (error) {
      console.error('Error fetching calendars:', error);
      setCalendars([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCalendars();
    } else {
      setCalendars([]);
    }
  }, [user]);

  return {
    calendars,
    isLoading,
    refetch: fetchCalendars
  };
};
