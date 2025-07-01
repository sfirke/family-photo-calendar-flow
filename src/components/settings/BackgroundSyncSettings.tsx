
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { useICalCalendars } from '@/hooks/useICalCalendars';
import { Wifi, WifiOff, RotateCcw, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const BackgroundSyncSettings = () => {
  const {
    isBackgroundSyncSupported,
    isPeriodicSyncSupported,
    lastSyncResult,
    triggerBackgroundSync
  } = useBackgroundSync();
  
  const { calendars, syncAllCalendars, isLoading } = useICalCalendars();

  const enabledCalendarsCount = calendars.filter(cal => cal.enabled).length;

  const handleManualBackgroundSync = async () => {
    const success = await triggerBackgroundSync();
    if (!success) {
      // Fallback to manual sync
      await syncAllCalendars();
    }
  };

  const handleManualSync = async () => {
    await syncAllCalendars();
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Wifi className="h-5 w-5" />
              Background Sync
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Automatic calendar synchronization using service workers and manual sync options
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {isBackgroundSyncSupported && enabledCalendarsCount > 0 && (
              <Button 
                onClick={handleManualBackgroundSync}
                variant="outline" 
                size="sm"
                disabled={isLoading}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <Wifi className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Background Sync
              </Button>
            )}
            {enabledCalendarsCount > 0 && (
              <Button 
                onClick={handleManualSync}
                variant="outline" 
                size="sm"
                disabled={isLoading}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Manual Sync
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sync Support Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              {isBackgroundSyncSupported ? (
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
              <span className="font-medium text-gray-900 dark:text-gray-100">Background Sync</span>
            </div>
            <Badge 
              variant={isBackgroundSyncSupported ? "default" : "destructive"}
              className="text-xs"
            >
              {isBackgroundSyncSupported ? 'Supported' : 'Not Supported'}
            </Badge>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              {isPeriodicSyncSupported ? (
                <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              )}
              <span className="font-medium text-gray-900 dark:text-gray-100">Periodic Sync</span>
            </div>
            <Badge 
              variant={isPeriodicSyncSupported ? "default" : "secondary"}
              className="text-xs"
            >
              {isPeriodicSyncSupported ? 'Supported' : 'Limited Support'}
            </Badge>
          </div>
        </div>

        {/* Last Sync Result */}
        {lastSyncResult && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-900 dark:text-blue-200">Last Background Sync</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <div className="font-medium text-blue-900 dark:text-blue-200">
                  {format(new Date(lastSyncResult.timestamp), 'MMM d, HH:mm')}
                </div>
                <div className="text-blue-700 dark:text-blue-300">Time</div>
              </div>
              <div>
                <div className="font-medium text-blue-900 dark:text-blue-200">
                  {lastSyncResult.syncedCount}
                </div>
                <div className="text-blue-700 dark:text-blue-300">Synced</div>
              </div>
              <div>
                <div className="font-medium text-blue-900 dark:text-blue-200">
                  {lastSyncResult.errorCount}
                </div>
                <div className="text-blue-700 dark:text-blue-300">Errors</div>
              </div>
              <div>
                <div className="font-medium text-blue-900 dark:text-blue-200">
                  {lastSyncResult.totalCalendars}
                </div>
                <div className="text-blue-700 dark:text-blue-300">Total</div>
              </div>
            </div>
          </div>
        )}

        {/* Information */}
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
            <div>
              <strong>Background Sync:</strong> Automatically syncs calendars when the app goes online or when triggered by the system.
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
            <div>
              <strong>Manual Sync:</strong> Use the "Manual Sync" button to immediately sync all enabled calendars.
            </div>
          </div>
          
          {isPeriodicSyncSupported && (
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <strong>Periodic Sync:</strong> Automatically syncs calendars every 12 hours, even when the app is closed.
              </div>
            </div>
          )}
          
          {!isBackgroundSyncSupported && (
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <strong>Browser Limitation:</strong> Your browser doesn't support background sync. Use manual sync to update calendars.
              </div>
            </div>
          )}
        </div>

        {/* Calendar Count Info */}
        {enabledCalendarsCount > 0 && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Sync is configured for <strong>{enabledCalendarsCount}</strong> enabled calendar feed{enabledCalendarsCount !== 1 ? 's' : ''}.
              {isLoading && <span className="ml-2 text-blue-600 dark:text-blue-400">Syncing...</span>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BackgroundSyncSettings;
