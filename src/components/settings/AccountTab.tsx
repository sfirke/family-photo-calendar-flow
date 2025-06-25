
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, LogOut, Calendar, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useHybridAuth } from '@/hooks/useHybridAuth';
import { useHybridCalendarSync } from '@/hooks/useHybridCalendarSync';

const AccountTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user, isConnectingGoogle, connectGoogleCalendar, disconnectGoogleCalendar, signOut } = useHybridAuth();
  const { syncStatus, syncWithGoogle, isSyncing } = useHybridCalendarSync();
  const { toast } = useToast();

  const handleConnectGoogle = async () => {
    setIsLoading(true);
    try {
      await connectGoogleCalendar();
      toast({
        title: "Connecting to Google",
        description: "You will be redirected to Google to authorize calendar access.",
      });
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to connect to Google Calendar. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      await disconnectGoogleCalendar();
      toast({
        title: "Disconnected",
        description: "Google Calendar has been disconnected. Local data is preserved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect Google Calendar",
        variant: "destructive"
      });
    }
  };

  const handleManualSync = async () => {
    const success = await syncWithGoogle();
    if (success) {
      toast({
        title: "Sync completed",
        description: "Your Google Calendar events have been updated.",
      });
    } else {
      toast({
        title: "Sync failed",
        description: "Unable to sync calendar events. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* User Profile Section */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">User Profile</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Your local profile information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              {user?.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="text-center">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">{user?.full_name || user?.email}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
            </div>
            
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Reset Session
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Google Calendar Integration */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Calendar className="h-5 w-5" />
            Google Calendar Integration
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Connect your Google Calendar for real-time sync and extended date range
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.isGoogleConnected ? (
            <div className="space-y-4">
              {/* Connection Status */}
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Google Calendar Connected
                  </span>
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">
                  {syncStatus.lastSync ? `Last sync: ${new Date(syncStatus.lastSync).toLocaleString()}` : 'Ready to sync'}
                </div>
              </div>

              {/* Sync Controls */}
              <div className="flex gap-2">
                <Button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Calendar className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </Button>
                
                <Button
                  onClick={handleDisconnectGoogle}
                  variant="outline"
                  size="sm"
                  className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <WifiOff className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>

              {/* Calendar Info */}
              {syncStatus.calendars.length > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Connected Calendars ({syncStatus.calendars.length})
                  </h4>
                  <div className="space-y-1">
                    {syncStatus.calendars.slice(0, 3).map((cal) => (
                      <div key={cal.id} className="text-sm text-blue-700 dark:text-blue-300">
                        {cal.summary} {cal.primary && '(Primary)'} - {cal.eventCount} events
                      </div>
                    ))}
                    {syncStatus.calendars.length > 3 && (
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        +{syncStatus.calendars.length - 3} more calendars
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Not Connected State */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <WifiOff className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Google Calendar Not Connected
                  </span>
                </div>
              </div>

              {/* Connect Button */}
              <Button 
                onClick={handleConnectGoogle}
                disabled={isLoading || isConnectingGoogle}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {isLoading || isConnectingGoogle ? 'Connecting...' : 'Connect Google Calendar'}
              </Button>

              {/* Benefits List */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Benefits of connecting:</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Real-time sync with your Google Calendar</li>
                  <li>• Extended date range (current month + first week of next month)</li>
                  <li>• Automatic daily token refresh</li>
                  <li>• Access to all your subscribed calendars</li>
                  <li>• Webhook-based instant updates</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountTab;
