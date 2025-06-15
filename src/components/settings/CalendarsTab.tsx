
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useGoogleCalendars } from '@/hooks/useGoogleCalendars';
import { useGoogleCalendarEvents } from '@/hooks/useGoogleCalendarEvents';

const CalendarsTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const { calendars, isLoading: calendarsLoading, refetch: refetchCalendars } = useGoogleCalendars();
  const { refreshEvents } = useGoogleCalendarEvents();

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

      setLastSync(new Date());
      toast({
        title: "Calendar synced!",
        description: `Found ${data.events?.length || 0} events from your Google Calendar.`,
      });

      // Refresh calendars and events
      await refetchCalendars();
      await refreshEvents();
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

  const handleCalendarToggle = (calendarId: string, checked: boolean) => {
    setSelectedCalendars(prev => 
      checked 
        ? [...prev, calendarId]
        : prev.filter(id => id !== calendarId)
    );
  };

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
    <div className="space-y-6">
      {/* Google Calendar Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Sync
          </CardTitle>
          <CardDescription>
            Sync and manage your Google Calendar events
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
        </CardContent>
      </Card>

      {/* Calendar Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar Visibility</CardTitle>
          <CardDescription>
            Choose which calendars to display in the main view
          </CardDescription>
        </CardHeader>
        <CardContent>
          {calendarsLoading ? (
            <div className="text-sm text-gray-600">Loading calendars...</div>
          ) : calendars.length > 0 ? (
            <div className="space-y-3">
              {calendars.map((calendar) => (
                <div key={calendar.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={calendar.id}
                    checked={selectedCalendars.includes(calendar.id)}
                    onCheckedChange={(checked) => handleCalendarToggle(calendar.id, !!checked)}
                  />
                  <label
                    htmlFor={calendar.id}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {calendar.summary}
                    {calendar.primary && <span className="ml-2 text-xs text-blue-600">(Primary)</span>}
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              No calendars available. Sync your Google Calendar first.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarsTab;
