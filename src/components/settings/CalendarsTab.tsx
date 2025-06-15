
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, RefreshCw, AlertCircle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useGoogleCalendarEvents } from '@/hooks/useGoogleCalendarEvents';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';

const CalendarsTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { refreshEvents } = useGoogleCalendarEvents();
  const { 
    selectedCalendarIds, 
    calendarsWithEvents, 
    isLoading: calendarsLoading,
    toggleCalendar,
    selectAllCalendars,
    selectCalendarsWithEvents,
    clearAllCalendars
  } = useCalendarSelection();

  const syncCalendar = async () => {
    if (!user) return;

    setIsLoading(true);
    console.log('CalendarsTab: Starting Google Calendar sync for user:', user.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-google-calendar', {
        body: { userId: user.id }
      });

      if (error) {
        console.error('CalendarsTab: Sync error:', error);
        throw error;
      }

      console.log('CalendarsTab: Sync successful, events synced:', data.events?.length || 0);
      setLastSync(new Date());
      toast({
        title: "Calendar synced!",
        description: `Found ${data.events?.length || 0} events from your Google Calendar.`,
      });

      // Refresh events
      console.log('CalendarsTab: Refreshing events...');
      await refreshEvents();
      console.log('CalendarsTab: Refresh complete');
    } catch (error) {
      console.error('CalendarsTab: Error syncing calendar:', error);
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
    console.log('CalendarsTab: No user authenticated');
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

  const totalEvents = calendarsWithEvents.reduce((sum, cal) => sum + cal.eventCount, 0);
  const calendarsWithEventsCount = calendarsWithEvents.filter(cal => cal.hasEvents).length;

  console.log('CalendarsTab: Rendering with calendars:', calendarsWithEvents.length);
  console.log('CalendarsTab: Selected calendars:', selectedCalendarIds.length);
  console.log('CalendarsTab: Total events across all calendars:', totalEvents);

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

          {/* Event Summary */}
          {totalEvents > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Event Summary</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium text-blue-900">{totalEvents}</div>
                  <div className="text-blue-700">Total Events</div>
                </div>
                <div>
                  <div className="font-medium text-blue-900">{calendarsWithEventsCount}</div>
                  <div className="text-blue-700">Active Calendars</div>
                </div>
                <div>
                  <div className="font-medium text-blue-900">{selectedCalendarIds.length}</div>
                  <div className="text-blue-700">Selected</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Calendars */}
      {calendarsWithEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Available Calendars
            </CardTitle>
            <CardDescription>
              Select which calendars to display in your calendar view. Calendars with events are highlighted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {calendarsLoading ? (
              <div className="flex items-center gap-2 text-gray-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading calendars...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Quick Actions */}
                <div className="flex gap-2 pb-3 border-b border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllCalendars}
                    className="text-xs"
                  >
                    Select All ({calendarsWithEvents.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectCalendarsWithEvents}
                    className="text-xs"
                    disabled={calendarsWithEventsCount === 0}
                  >
                    With Events ({calendarsWithEventsCount})
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
                    {selectedCalendarIds.length} of {calendarsWithEvents.length} selected
                  </div>
                </div>

                {/* Calendar List */}
                <div className="space-y-3">
                  {calendarsWithEvents
                    .sort((a, b) => {
                      // Sort by: primary first, then by event count (descending), then by name
                      if (a.primary && !b.primary) return -1;
                      if (!a.primary && b.primary) return 1;
                      if (a.eventCount !== b.eventCount) return b.eventCount - a.eventCount;
                      return a.summary.localeCompare(b.summary);
                    })
                    .map((calendar) => {
                      const isSelected = selectedCalendarIds.includes(calendar.id);
                      return (
                        <div key={calendar.id} className={`flex items-center space-x-3 p-4 rounded-lg border ${
                          calendar.hasEvents 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <Checkbox
                            id={`calendar-${calendar.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => toggleCalendar(calendar.id, checked === true)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <label
                                htmlFor={`calendar-${calendar.id}`}
                                className="text-sm font-medium text-gray-900 cursor-pointer"
                              >
                                {calendar.summary}
                              </label>
                              {calendar.primary && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Primary
                                </span>
                              )}
                              {calendar.hasEvents && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  {calendar.eventCount} event{calendar.eventCount !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              Calendar ID: {calendar.id}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
                
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Note: Calendar selections are automatically applied to the calendar view and dropdown filter.
                    Calendars with events are highlighted and sorted by event count.
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
