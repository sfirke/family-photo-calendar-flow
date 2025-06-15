import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Database } from '@/integrations/supabase/types';

type DatabaseEvent = Database['public']['Tables']['calendar_events']['Row'];

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees: any[];
}

interface GoogleCalendarSyncProps {
  onEventsUpdated?: () => void;
}

const GoogleCalendarSync = ({ onEventsUpdated }: GoogleCalendarSyncProps = {}) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const syncCalendar = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      console.log('Starting Google Calendar sync...');
      const { data, error } = await supabase.functions.invoke('sync-google-calendar', {
        body: { userId: user.id }
      });

      if (error) {
        throw error;
      }

      setEvents(data.events || []);
      setLastSync(new Date());
      toast({
        title: "Calendar synced!",
        description: `Found ${data.events?.length || 0} events from your Google Calendar.`,
      });

      // Notify parent component to refresh events
      if (onEventsUpdated) {
        onEventsUpdated();
      }
    } catch (error) {
      console.error('Error syncing calendar:', error);
      toast({
        title: "Sync failed",
        description: "Unable to sync your Google Calendar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStoredEvents = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      // Convert database events to CalendarEvent format
      const convertedEvents: CalendarEvent[] = (data || []).map((dbEvent: DatabaseEvent) => ({
        id: dbEvent.id,
        title: dbEvent.title,
        description: dbEvent.description || undefined,
        start_time: dbEvent.start_time,
        end_time: dbEvent.end_time,
        location: dbEvent.location || undefined,
        attendees: Array.isArray(dbEvent.attendees) ? dbEvent.attendees : []
      }));
      
      setEvents(convertedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadStoredEvents();
    }
  }, [user]);

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar
          </CardTitle>
          <CardDescription>
            Sign in to sync your Google Calendar events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Authentication required</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar
        </CardTitle>
        <CardDescription>
          Sync and display your Google Calendar events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {lastSync ? `Last synced: ${lastSync.toLocaleString()}` : 'Not synced yet'}
          </div>
          <Button
            onClick={syncCalendar}
            disabled={isLoading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Sync Calendar
          </Button>
        </div>

        {events.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Recent Events ({events.length})</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {events.slice(0, 5).map((event) => (
                <div key={event.id} className="p-2 bg-gray-50 rounded text-sm">
                  <div className="font-medium">{event.title}</div>
                  <div className="text-gray-600">
                    {new Date(event.start_time).toLocaleString()}
                  </div>
                  {event.location && (
                    <div className="text-gray-500">{event.location}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarSync;
