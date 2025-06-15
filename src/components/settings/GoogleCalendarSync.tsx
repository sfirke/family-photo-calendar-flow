
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, RefreshCw, AlertCircle, Webhook } from 'lucide-react';
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
  const [isSettingUpWebhooks, setIsSettingUpWebhooks] = useState(false);
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

  const setupWebhooks = async () => {
    if (!user) return;

    setIsSettingUpWebhooks(true);
    console.log('GoogleCalendarSync: Setting up webhooks for user:', user.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-google-calendar', {
        body: { 
          userId: user.id,
          action: 'setup-webhooks'
        }
      });

      if (error) {
        console.error('GoogleCalendarSync: Webhook setup error:', error);
        throw error;
      }

      console.log('GoogleCalendarSync: Webhooks setup result:', data);
      
      const successCount = data.webhookResults?.filter((r: any) => r.success).length || 0;
      const totalCount = data.webhookResults?.length || 0;

      toast({
        title: "Webhooks configured!",
        description: `Set up real-time sync for ${successCount} out of ${totalCount} calendars.`,
      });
    } catch (error) {
      console.error('GoogleCalendarSync: Error setting up webhooks:', error);
      toast({
        title: "Webhook setup failed",
        description: "Unable to set up real-time sync. You can still sync manually.",
        variant: "destructive"
      });
    } finally {
      setIsSettingUpWebhooks(false);
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
          Sync and manage your Google Calendar events with real-time updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {lastSync ? `Last synced: ${lastSync.toLocaleString()}` : 'Not synced yet'}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={setupWebhooks}
              disabled={isSettingUpWebhooks}
              size="sm"
              variant="outline"
            >
              <Webhook className={`h-4 w-4 mr-2 ${isSettingUpWebhooks ? 'animate-spin' : ''}`} />
              Setup Real-time
            </Button>
            <Button
              onClick={syncCalendar}
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Sync Now
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <strong>Real-time sync:</strong> Set up webhooks to automatically update your calendar when events change in Google Calendar. 
          Manual sync is always available as a fallback.
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarSync;
