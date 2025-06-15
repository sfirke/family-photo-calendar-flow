
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useGoogleCalendarEvents } from '@/hooks/useGoogleCalendarEvents';

interface GoogleCalendarSyncProps {
  lastSync: Date | null;
  onLastSyncUpdate: (date: Date) => void;
}

const GoogleCalendarSync = ({ lastSync, onLastSyncUpdate }: GoogleCalendarSyncProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { refreshEvents } = useGoogleCalendarEvents();

  const syncCalendar = async () => {
    if (!user) return;

    setIsLoading(true);
    console.log('GoogleCalendarSync: Starting Google Calendar sync for user:', user.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-google-calendar', {
        body: { userId: user.id }
      });

      if (error) {
        console.error('GoogleCalendarSync: Sync error:', error);
        throw error;
      }

      console.log('GoogleCalendarSync: Sync successful, events synced:', data.events?.length || 0);
      onLastSyncUpdate(new Date());
      toast({
        title: "Calendar synced!",
        description: `Found ${data.events?.length || 0} events from your Google Calendar.`,
      });

      // Refresh events
      console.log('GoogleCalendarSync: Refreshing events...');
      await refreshEvents();
      console.log('GoogleCalendarSync: Refresh complete');
    } catch (error) {
      console.error('GoogleCalendarSync: Error syncing calendar:', error);
      toast({
        title: "Sync failed",
        description: "Unable to sync your Google Calendar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    console.log('GoogleCalendarSync: No user authenticated');
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
  );
};

export default GoogleCalendarSync;
