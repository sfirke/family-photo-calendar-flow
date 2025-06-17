
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw, Webhook, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface GoogleCalendarSyncProps {
  lastSync: Date | null;
  onLastSyncUpdate: (date: Date) => void;
}

const GoogleCalendarSync = ({ lastSync, onLastSyncUpdate }: GoogleCalendarSyncProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingUpWebhook, setIsSettingUpWebhook] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleManualSync = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to sync your calendar events.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Starting manual calendar sync...');
      
      const { data, error } = await supabase.functions.invoke('sync-google-calendar', {
        body: { 
          userId: user.id,
          manualSync: true 
        }
      });

      if (error) {
        console.error('Manual sync error:', error);
        throw error;
      }

      console.log('Manual sync completed successfully:', data);
      onLastSyncUpdate(new Date());
      
      toast({
        title: "Calendar synced",
        description: "Your Google Calendar events have been updated successfully.",
      });
    } catch (error) {
      console.error('Error during manual sync:', error);
      toast({
        title: "Sync failed",
        description: "Failed to sync calendar events. Please try again.",
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

    setIsSettingUpWebhook(true);
    try {
      console.log('Setting up webhook for real-time sync...');
      
      const { data, error } = await supabase.functions.invoke('google-calendar-webhook', {
        body: { 
          userId: user.id,
          action: 'setup'
        }
      });

      if (error) {
        console.error('Webhook setup error:', error);
        throw error;
      }

      console.log('Webhook setup completed:', data);
      
      toast({
        title: "Real-time sync enabled",
        description: "Your calendar will now update automatically when events change in Google Calendar.",
      });
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
              disabled={isSettingUpWebhook}
              variant="outline"
              size="sm"
              className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <Webhook className={`h-4 w-4 mr-2 ${isSettingUpWebhook ? 'animate-spin' : ''}`} />
              {isSettingUpWebhook ? 'Setting up...' : 'Setup Real-time'}
            </Button>
            <Button
              onClick={handleManualSync}
              disabled={isLoading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
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
              <p className="font-medium text-blue-800 dark:text-blue-200">Real-time sync</p>
              <p className="text-blue-700 dark:text-blue-300">
                Set up webhooks to automatically update your calendar when events change in Google Calendar. Manual sync is always available as a fallback.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarSync;
