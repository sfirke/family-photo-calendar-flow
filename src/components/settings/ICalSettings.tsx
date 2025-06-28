import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useICalCalendars, ICalCalendar } from '@/hooks/useICalCalendars';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';
import { Calendar, Plus, Trash2, RefreshCw, ExternalLink, AlertCircle, RotateCcw, BarChart3 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

const CALENDAR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
];

const ICalSettings = () => {
  const { calendars, isLoading, syncStatus, addCalendar, updateCalendar, removeCalendar, syncCalendar, syncAllCalendars } = useICalCalendars();
  const { selectedCalendarIds, toggleCalendar, calendarsFromEvents, forceRefresh } = useCalendarSelection();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCalendar, setNewCalendar] = useState({
    name: '',
    url: '',
    color: CALENDAR_COLORS[0],
    enabled: true
  });

  // Debug logging for calendar state
  useEffect(() => {
    console.log('ICalSettings - Current calendars from hook:', calendars);
    console.log('ICalSettings - Calendars from events:', calendarsFromEvents);
    console.log('ICalSettings - Selected calendar IDs:', selectedCalendarIds);
  }, [calendars, calendarsFromEvents, selectedCalendarIds]);

  // Combine calendars from hook and events, prioritizing hook data
  const allCalendars = React.useMemo(() => {
    const calendarMap = new Map();
    
    // Add calendars from hook first (these have full configuration)
    calendars.forEach(cal => {
      calendarMap.set(cal.id, {
        ...cal,
        source: 'config',
        hasEvents: calendarsFromEvents.some(eventCal => eventCal.id === cal.id && eventCal.hasEvents)
      });
    });
    
    // Add calendars from events that aren't in the hook (orphaned calendars)
    calendarsFromEvents.forEach(eventCal => {
      if (!calendarMap.has(eventCal.id) && eventCal.id !== 'local_calendar') {
        calendarMap.set(eventCal.id, {
          id: eventCal.id,
          name: eventCal.summary,
          url: eventCal.url || 'Unknown URL',
          color: eventCal.color || '#3b82f6',
          enabled: true,
          source: 'events',
          hasEvents: eventCal.hasEvents,
          eventCount: eventCal.eventCount,
          lastSync: eventCal.lastSync
        });
      }
    });
    
    return Array.from(calendarMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [calendars, calendarsFromEvents]);

  const validateCalendar = (name: string, url: string) => {
    // Check for duplicate name
    const existingByName = allCalendars.find(cal => 
      cal.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
    
    // Check for duplicate URL
    const existingByUrl = allCalendars.find(cal => 
      cal.url.toLowerCase().trim() === url.toLowerCase().trim()
    );

    if (existingByName) {
      return { isValid: false, field: 'name', message: 'A calendar with this name already exists' };
    }

    if (existingByUrl) {
      return { isValid: false, field: 'url', message: 'A calendar with this URL already exists' };
    }

    return { isValid: true };
  };

  const handleAddCalendar = async () => {
    if (!newCalendar.name.trim() || !newCalendar.url.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a name and URL for the calendar.",
        variant: "destructive"
      });
      return;
    }

    // Validate for duplicates
    const validation = validateCalendar(newCalendar.name, newCalendar.url);
    if (!validation.isValid) {
      toast({
        title: "Duplicate calendar",
        description: validation.message,
        variant: "destructive"
      });
      return;
    }

    // Basic URL validation
    if (!newCalendar.url.includes('.ics') && !newCalendar.url.includes('ical')) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid iCal URL (should contain '.ics' or 'ical').",
        variant: "destructive"
      });
      return;
    }

    try {
      const calendar = addCalendar({
        ...newCalendar,
        url: newCalendar.url // Ensure URL is stored
      });
      
      // Try to sync immediately to validate the URL
      await syncCalendar(calendar);
      
      // Force refresh the calendar selection to pick up new events
      forceRefresh();
      
      toast({
        title: "Calendar added",
        description: `${newCalendar.name} has been added and synced successfully.`
      });
      
      setNewCalendar({ name: '', url: '', color: CALENDAR_COLORS[0], enabled: true });
      setShowAddDialog(false);
      
      // Trigger a page refresh to ensure all components update with new data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Sync failed",
        description: `Calendar was added but sync failed: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  const handleSync = async (calendar: any) => {
    if (!calendar.url || calendar.url === 'Unknown URL') {
      toast({
        title: "Cannot sync",
        description: "This calendar doesn't have a valid URL for syncing.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (calendar.source === 'config') {
        await syncCalendar(calendar);
      } else {
        // For orphaned calendars, we need to create a proper calendar config first
        const newCal = addCalendar({
          name: calendar.name,
          url: calendar.url,
          color: calendar.color,
          enabled: true
        });
        await syncCalendar(newCal);
      }
      
      toast({
        title: "Sync successful",
        description: `${calendar.name} has been synced successfully.`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Sync failed",
        description: `Failed to sync ${calendar.name}: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  const handleSyncAll = async () => {
    try {
      await syncAllCalendars();
      
      toast({
        title: "Sync completed",
        description: "All enabled calendars have been synced."
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Sync failed",
        description: `Failed to sync some calendars: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  const handleRemove = (calendar: any) => {
    // Remove from iCal calendars if it exists there
    if (calendar.source === 'config') {
      removeCalendar(calendar.id);
    }
    
    // Clean up events from localStorage for any calendar
    try {
      const storedEvents = localStorage.getItem('family_calendar_ical_events');
      if (storedEvents) {
        const events = JSON.parse(storedEvents);
        const filteredEvents = events.filter((event: any) => event.calendarId !== calendar.id);
        localStorage.setItem('family_calendar_ical_events', JSON.stringify(filteredEvents));
        console.log('Calendar events removed from localStorage');
      }
    } catch (error) {
      console.error('Error removing calendar events:', error);
    }
    
    toast({
      title: "Calendar removed",
      description: `${calendar.name} and all its events have been removed.`
    });
  };

  const getSyncStatusBadge = (calendar: any) => {
    const status = syncStatus[calendar.id];
    
    if (status === 'syncing') {
      return <Badge variant="secondary">Syncing...</Badge>;
    }
    if (status === 'error') {
      return <Badge variant="destructive">Error</Badge>;
    }
    if (status === 'success' || calendar.lastSync) {
      return <Badge variant="default">Synced</Badge>;
    }
    if (calendar.source === 'events') {
      return <Badge variant="outline">From Events</Badge>;
    }
    return <Badge variant="secondary">Not synced</Badge>;
  };

  const enabledCalendarsCount = allCalendars.filter(cal => cal.enabled).length;
  const totalEvents = calendarsFromEvents.reduce((sum, cal) => sum + cal.eventCount, 0);
  const calendarsWithEventsCount = calendarsFromEvents.filter(cal => cal.hasEvents).length;

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Calendar className="h-5 w-5" />
              Calendar Feeds
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Add external calendar feeds using iCal/ICS URLs. No authentication required.
            </CardDescription>
          </div>
          {allCalendars.length > 0 && (
            <Button 
              onClick={handleSyncAll}
              disabled={isLoading || enabledCalendarsCount === 0}
              variant="outline"
              size="sm"
              className="ml-4 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <RotateCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Sync All ({enabledCalendarsCount})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Event Summary */}
        {totalEvents > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-900 dark:text-blue-200">Event Summary</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-blue-900 dark:text-blue-200">{totalEvents}</div>
                <div className="text-blue-700 dark:text-blue-300">Total Events</div>
              </div>
              <div>
                <div className="font-medium text-blue-900 dark:text-blue-200">{calendarsWithEventsCount}</div>
                <div className="text-blue-700 dark:text-blue-300">Active Calendars</div>
              </div>
              <div>
                <div className="font-medium text-blue-900 dark:text-blue-200">{selectedCalendarIds.length}</div>
                <div className="text-blue-700 dark:text-blue-300">Selected</div>
              </div>
            </div>
          </div>
        )}

        {/* Add Calendar Button */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" variant="default">
              <Plus className="h-4 w-4 mr-2" />
              Add Calendar Feed
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-gray-100">Add Calendar Feed</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Enter the details for your calendar feed. Make sure the URL is publicly accessible.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="calendar-name" className="text-gray-700 dark:text-gray-300">Calendar Name</Label>
                <Input
                  id="calendar-name"
                  placeholder="My Calendar"
                  value={newCalendar.name}
                  onChange={(e) => setNewCalendar(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="calendar-url" className="text-gray-700 dark:text-gray-300">iCal URL</Label>
                <Input
                  id="calendar-url"
                  placeholder="https://calendar.example.com/feed.ics"
                  value={newCalendar.url}
                  onChange={(e) => setNewCalendar(prev => ({ ...prev, url: e.target.value }))}
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Calendar Color</Label>
                <div className="flex gap-2 mt-2">
                  {CALENDAR_COLORS.map(color => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded-full border-2 ${newCalendar.color === color ? 'border-gray-900 dark:border-gray-100' : 'border-gray-300 dark:border-gray-600'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewCalendar(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddDialog(false)}
                  className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddCalendar} 
                  disabled={isLoading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Add Calendar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Calendar List */}
        {allCalendars.length > 0 && (
          <div className="space-y-3">
            {allCalendars.map(calendar => {
              const isSelected = selectedCalendarIds.includes(calendar.id);
              
              return (
                <div key={calendar.id} className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: calendar.color }}
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {calendar.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          {calendar.url && calendar.url !== 'Unknown URL' 
                            ? (calendar.url.length > 50 ? `${calendar.url.substring(0, 50)}...` : calendar.url)
                            : 'No URL available'
                          }
                        </p>
                        {calendar.lastSync && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Last synced: {new Date(calendar.lastSync).toLocaleString()}
                            {calendar.eventCount !== undefined && ` • ${calendar.eventCount} events`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSyncStatusBadge(calendar)}
                      {calendar.source === 'config' && (
                        <Switch
                          checked={calendar.enabled}
                          onCheckedChange={(enabled) => updateCalendar(calendar.id, { enabled })}
                        />
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSync(calendar)}
                        disabled={isLoading}
                        title="Sync this calendar"
                        className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <RefreshCw className={`h-4 w-4 ${syncStatus[calendar.id] === 'syncing' ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemove(calendar)}
                        title="Remove this calendar"
                        className="border-red-300 dark:border-red-600 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Calendar selection and stats */}
                  <div className="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`calendar-selection-${calendar.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => toggleCalendar(calendar.id, checked === true)}
                          className="border-gray-300 dark:border-gray-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground"
                        />
                        <label
                          htmlFor={`calendar-selection-${calendar.id}`}
                          className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                        >
                          Show in calendar view
                        </label>
                      </div>
                      
                      {calendar.hasEvents && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200">
                          {calendar.eventCount || 0} event{(calendar.eventCount || 0) !== 1 ? 's' : ''}
                        </span>
                      )}
                      {!calendar.hasEvents && calendar.source === 'events' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400">
                          No events
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {allCalendars.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No calendar feeds added yet.</p>
            <p className="text-sm">Add your first calendar feed to get started.</p>
          </div>
        )}

        {/* Help and Tips */}
        <Alert className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">Tips for Calendar Feeds</AlertTitle>
          <AlertDescription className="text-sm space-y-2 text-blue-700 dark:text-blue-300">
            <p>• Most calendar services provide public iCal feeds for sharing</p>
            <p>• Look for "Export" or "Share" options in your calendar application</p>
            <p>• Ensure the calendar is set to "Public" or you have the private URL with access key</p>
            <p>• The URL should end with .ics or contain "ical" in the path</p>
            <p>• Use the sync buttons to manually refresh calendar data</p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default ICalSettings;
