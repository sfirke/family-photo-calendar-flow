
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw, Webhook, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useHybridAuth } from '@/hooks/useHybridAuth';

interface GoogleCalendarSyncProps {
  lastSync: Date | null;
  onLastSyncUpdate: (date: Date) => void;
}

const GoogleCalendarSync = ({ lastSync, onLastSyncUpdate }: GoogleCalendarSyncProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingUpWebhook, setIsSettingUpWebhook] = useState(false);
  const [webhookSetup, setWebhookSetup] = useState(false);
  const { toast } = useToast();
  const { user } = useHybridAuth();
  const calendarChannelRef = useRef<any>(null);

  const handleManualSync = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to sync your calendar events.",
        variant: "destructive"
      });
      return;
    }

    if (!user.isGoogleConnected) {
      toast({
        title: "Google Calendar Not Connected",
        description: "Please connect your Google Calendar in the Account tab first.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Starting manual calendar sync with extended range...');
      
      // Calculate date range: current month + first week of next month
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Start of current month
      const timeMin = new Date(currentYear, currentMonth, 1).toISOString();
      
      // First week of next month (7 days after next month starts)
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const timeMax = new Date(nextYear, nextMonth, 8).toISOString();
      
      const { data, error } = await supabase.functions.invoke('sync-google-calendar', {
        body: { 
          userId: user.id,
          manualSync: true,
          timeMin,
          timeMax,
          extendedRange: true
        }
      });

      if (error) {
        console.error('Manual sync error:', error);
        throw error;
      }

      if (data?.requiresConnection) {
        toast({
          title: "Connection Required",
          description: data.error || "Please reconnect your Google Calendar account.",
          variant: "destructive"
        });
        return;
      }

      console.log('Manual sync completed successfully:', data);
      onLastSyncUpdate(new Date());
      
      toast({
        title: "Calendar synced",
        description: `Successfully synced events for current month and first week of next month. Found ${data.eventCount || 0} events.`,
      });
    } catch (error) {
      console.error('Error during manual sync:', error);
      toast({
        title: "Sync failed",
        description: "Failed to sync calendar events. Please try reconnecting your Google account.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupWebhook = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to set up real-time sync.",
        variant: "destructive"
      });
      return;
    }

    if (!user.isGoogleConnected) {
      toast({
        title: "Google Calendar Not Connected",
        description: "Please connect your Google Calendar in the Account tab first.",
        variant: "destructive"
      });
      return;
    }

    setIsSettingUpWebhook(true);
    try {
      console.log('Setting up webhook for real-time sync...');
      
      const { data, error } = await supabase.functions.invoke('sync-google-calendar', {
        body: { 
          userId: user.id,
          action: 'setup-webhooks'
        }
      });

      if (error) {
        console.error('Webhook setup error:', error);
        throw error;
      }

      if (data?.requiresConnection) {
        toast({
          title: "Connection Required",
          description: data.error || "Please reconnect your Google Calendar account.",
          variant: "destructive"
        });
        return;
      }

      console.log('Webhook setup completed:', data);
      setWebhookSetup(true);
      
      toast({
        title: "Real-time sync enabled",
        description: "Your calendar will now update automatically when events change in Google Calendar.",
      });

      // Clean up existing channel first
      if (calendarChannelRef.current) {
        try {
          await supabase.removeChannel(calendarChannelRef.current);
        } catch (cleanupError) {
          console.warn('Channel cleanup warning:', cleanupError);
        }
        calendarChannelRef.current = null;
      }

      // Set up real-time listener for calendar events with a unique channel name
      const channelName = `calendar-changes-${user.id}-${Date.now()}`;
      const channel = supabase
        .channel(channelName)
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
            // Trigger a custom event to notify other components
            window.dispatchEvent(new CustomEvent('calendar-updated', { 
              detail: { payload, userId: user.id } 
            }));
          }
        )
        .subscribe((status) => {
          console.log('Real-time subscription status:', status);
        });

      // Store channel reference for cleanup
      calendarChannelRef.current = channel;

    } catch (error) {
      console.error('Error setting up webhook:', error);
      toast({
        title: "Setup failed",
        description: "Failed to enable real-time sync. Manual sync is still available.",
        variant: "destructive"
      });
    } finally {
      setIsSettingUpWebhook(false);
    }
  };

  if (!user?.isGoogleConnected) {
    return (
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Calendar className="h-5 w-5" />
            Google Calendar Sync
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Connect your Google Calendar to sync events automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">Google Calendar Not Connected</p>
              <p className="text-amber-700 dark:text-amber-300">
                Please connect your Google Calendar in the Account tab to enable sync features.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Calendar className="h-5 w-5" />
          Google Calendar Sync
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Sync and manage your Google Calendar events with real-time updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {lastSync ? 'Last synced' : 'Not synced yet'}
            </p>
            {lastSync && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {lastSync.toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSetupWebhook}
              disabled={isSettingUpWebhook || webhookSetup}
              variant="outline"
              size="sm"
              className={`${
                webhookSetup 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600' 
                  : 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
            >
              {webhookSetup ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <Webhook className={`h-4 w-4 mr-2 ${isSettingUpWebhook ? 'animate-spin' : ''}`} />
              )}
              {webhookSetup ? 'Real-time Active' : isSettingUpWebhook ? 'Setting up...' : 'Setup Real-time'}
            </Button>
            <Button
              onClick={handleManualSync}
              disabled={isLoading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 border-0"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-200">Enhanced Sync Range</p>
              <p className="text-blue-700 dark:text-blue-300">
                Calendar sync now includes all events for the current month plus the first week of the following month. 
                Real-time sync automatically updates your calendar when events change in Google Calendar.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarSync;
