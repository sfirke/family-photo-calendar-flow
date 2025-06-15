
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useGoogleCalendarEvents } from '@/hooks/useGoogleCalendarEvents';
import { useGoogleCalendars } from '@/hooks/useGoogleCalendars';

const SELECTED_CALENDARS_KEY = 'selectedCalendarIds';

const CalendarsTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const { refreshEvents } = useGoogleCalendarEvents();
  const { calendars, isLoading: calendarsLoading, refetch: refetchCalendars } = useGoogleCalendars();

  // Load selected calendar IDs from localStorage on component mount
  useEffect(() => {
    const stored = localStorage.getItem(SELECTED_CALENDARS_KEY);
    if (stored) {
      try {
        const parsedIds = JSON.parse(stored);
        setSelectedCalendarIds(parsedIds);
        console.log('Loaded selected calendar IDs from localStorage:', parsedIds);
      } catch (error) {
        console.error('Error parsing stored calendar IDs:', error);
      }
    }
  }, []);

  // Auto-select all calendars when they are first loaded and no previous selection exists
  useEffect(() => {
    if (calendars.length > 0 && selectedCalendarIds.length === 0) {
      const allCalendarIds = calendars.map(cal => cal.id);
      setSelectedCalendarIds(allCalendarIds);
      localStorage.setItem(SELECTED_CALENDARS_KEY, JSON.stringify(allCalendarIds));
      console.log('Auto-selecting all calendars on first load:', allCalendarIds);
    }
  }, [calendars, selectedCalendarIds.length]);

  // Save selected calendar IDs to localStorage whenever they change
  const updateSelectedCalendars = (newSelectedIds: string[]) => {
    setSelectedCalendarIds(newSelectedIds);
    localStorage.setItem(SELECTED_CALENDARS_KEY, JSON.stringify(newSelectedIds));
    console.log('Updated selected calendar IDs:', newSelectedIds);
  };

  const handleCalendarToggle = (calendarId: string, checked: boolean) => {
    console.log('Calendar toggle:', calendarId, 'checked:', checked);
    let newSelection: string[];
    
    if (checked) {
      newSelection = [...selectedCalendarIds, calendarId];
    } else {
      newSelection = selectedCalendarIds.filter(id => id !== calendarId);
    }
    
    updateSelectedCalendars(newSelection);
  };

  const selectAllCalendars = () => {
    const allIds = calendars.map(cal => cal.id);
    updateSelectedCalendars(allIds);
    console.log('Selected all calendars:', allIds);
  };

  const clearAllCalendars = () => {
    updateSelectedCalendars([]);
    console.log('Cleared all calendar selections');
  };

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

      // Refresh events and calendars
      await refreshEvents();
      await refetchCalendars();
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

      {/* Available Calendars */}
      {calendars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Available Calendars
            </CardTitle>
            <CardDescription>
              Select which calendars to display in your calendar view
            </CardDescription>
          </CardHeader>
          <CardContent>
            {calendarsLoading ? (
              <div className="flex items-center gap-2 text-gray-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading calendars...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2 pb-3 border-b border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllCalendars}
                    className="text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllCalendars}
                    className="text-xs"
                  >
                    Clear All
                  </Button>
                  <div className="ml-auto text-xs text-gray-500 self-center">
                    {selectedCalendarIds.length} of {calendars.length} selected
                  </div>
                </div>

                {calendars.map((calendar) => {
                  const isSelected = selectedCalendarIds.includes(calendar.id);
                  return (
                    <div key={calendar.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Checkbox
                        id={`calendar-${calendar.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => handleCalendarToggle(calendar.id, checked === true)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`calendar-${calendar.id}`}
                          className="text-sm font-medium text-gray-900 cursor-pointer"
                        >
                          {calendar.summary}
                          {calendar.primary && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Primary
                            </span>
                          )}
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Calendar ID: {calendar.id}
                        </p>
                      </div>
                    </div>
                  );
                })}
                
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Note: Calendar selections are automatically applied to the calendar view and dropdown filter.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CalendarsTab;
