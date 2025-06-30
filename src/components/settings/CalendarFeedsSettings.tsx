
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useICalCalendars } from '@/hooks/useICalCalendars';
import { useNotionCalendars } from '@/hooks/useNotionCalendars';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';
import { Calendar, Plus, RotateCcw, BarChart3, AlertCircle, GitFork, Globe } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import EditableCalendarCard from './EditableCalendarCard';
import { ICalCalendar } from '@/types/ical';
import { NotionCalendar } from '@/types/notion';
import { NotionService } from '@/services/notionService';

const CALENDAR_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

const CalendarFeedsSettings = () => {
  const {
    calendars: icalCalendars,
    isLoading: icalLoading,
    syncStatus: icalSyncStatus,
    addCalendar: addICalCalendar,
    updateCalendar: updateICalCalendar,
    removeCalendar: removeICalCalendar,
    syncCalendar: syncICalCalendar,
    syncAllCalendars: syncAllICalCalendars
  } = useICalCalendars();

  const {
    calendars: notionCalendars,
    isLoading: notionLoading,
    syncStatus: notionSyncStatus,
    addCalendar: addNotionCalendar,
    removeCalendar: removeNotionCalendar,
    syncCalendar: syncNotionCalendar,
    syncAllCalendars: syncAllNotionCalendars
  } = useNotionCalendars();

  const {
    selectedCalendarIds,
    toggleCalendar,
    calendarsFromEvents,
    forceRefresh
  } = useCalendarSelection();
  
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [feedType, setFeedType] = useState<'ical' | 'notion'>('ical');
  const [newCalendar, setNewCalendar] = useState({
    name: '',
    url: '',
    color: CALENDAR_COLORS[0],
    enabled: true
  });

  const isLoading = icalLoading || notionLoading;

  // Combine all calendars for display
  const allCalendars = React.useMemo(() => {
    const calendarMap = new Map();

    // Add iCal calendars
    icalCalendars.forEach(cal => {
      calendarMap.set(cal.id, {
        ...cal,
        type: 'ical',
        source: 'config',
        hasEvents: calendarsFromEvents.some(eventCal => eventCal.id === cal.id && eventCal.hasEvents),
        eventCount: calendarsFromEvents.find(eventCal => eventCal.id === cal.id)?.eventCount || cal.eventCount || 0
      });
    });

    // Add Notion calendars
    notionCalendars.forEach(cal => {
      calendarMap.set(cal.id, {
        ...cal,
        type: 'notion',
        source: 'config',
        hasEvents: calendarsFromEvents.some(eventCal => eventCal.id === cal.id && eventCal.hasEvents),
        eventCount: calendarsFromEvents.find(eventCal => eventCal.id === cal.id)?.eventCount || cal.eventCount || 0
      });
    });

    // Add orphaned calendars from events
    calendarsFromEvents.forEach(eventCal => {
      if (!calendarMap.has(eventCal.id) && eventCal.id !== 'local_calendar') {
        calendarMap.set(eventCal.id, {
          id: eventCal.id,
          name: eventCal.summary,
          url: '',
          color: eventCal.color || '#3b82f6',
          enabled: true,
          type: eventCal.id.startsWith('notion_') ? 'notion' : 'ical',
          source: 'events',
          hasEvents: eventCal.hasEvents,
          eventCount: eventCal.eventCount,
          lastSync: eventCal.lastSync
        });
      }
    });
    
    return Array.from(calendarMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [icalCalendars, notionCalendars, calendarsFromEvents]);

  const handleAddCalendar = async () => {
    if (!newCalendar.name.trim() || !newCalendar.url.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a name and URL for the calendar.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (feedType === 'ical') {
        if (!newCalendar.url.includes('.ics') && !newCalendar.url.includes('ical')) {
          toast({
            title: "Invalid URL",
            description: "Please enter a valid iCal URL (should contain '.ics' or 'ical').",
            variant: "destructive"
          });
          return;
        }

        const calendar = await addICalCalendar({
          name: newCalendar.name,
          url: newCalendar.url,
          color: newCalendar.color,
          enabled: newCalendar.enabled
        });

        try {
          await syncICalCalendar(calendar);
          toast({
            title: "iCal calendar added and synced",
            description: `${newCalendar.name} has been added and synced successfully.`
          });
        } catch (syncError) {
          const errorMessage = syncError instanceof Error ? syncError.message : 'Unknown sync error';
          toast({
            title: "Calendar added",
            description: `${newCalendar.name} was added but sync failed: ${errorMessage}`,
            variant: "destructive"
          });
        }
      } else {
        if (!NotionService.isValidNotionUrl(newCalendar.url)) {
          toast({
            title: "Invalid URL",
            description: "Please enter a valid Notion database sharing URL.",
            variant: "destructive"
          });
          return;
        }

        const calendar = await addNotionCalendar({
          name: newCalendar.name,
          url: newCalendar.url,
          color: newCalendar.color,
          enabled: newCalendar.enabled
        });

        try {
          await syncNotionCalendar(calendar);
          toast({
            title: "Notion calendar added and synced",
            description: `${newCalendar.name} has been added and synced successfully.`
          });
        } catch (syncError) {
          const errorMessage = syncError instanceof Error ? syncError.message : 'Unknown sync error';
          toast({
            title: "Calendar added",
            description: `${newCalendar.name} was added but sync failed: ${errorMessage}`,
            variant: "destructive"
          });
        }
      }

      forceRefresh();
      setNewCalendar({
        name: '',
        url: '',
        color: CALENDAR_COLORS[0],
        enabled: true
      });
      setShowAddDialog(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Failed to add calendar",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleSync = async (calendar: any) => {
    try {
      if (calendar.type === 'notion') {
        await syncNotionCalendar(calendar);
      } else {
        await syncICalCalendar(calendar);
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
      await Promise.all([
        syncAllICalCalendars(),
        syncAllNotionCalendars()
      ]);
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

  const handleRemove = async (calendar: any) => {
    try {
      if (calendar.type === 'notion') {
        await removeNotionCalendar(calendar.id);
      } else {
        await removeICalCalendar(calendar.id);
      }
      toast({
        title: "Calendar removed",
        description: `${calendar.name} and all its events have been removed.`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Failed to remove calendar",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleUpdateCalendar = async (id: string, updates: Partial<ICalCalendar>) => {
    try {
      await updateICalCalendar(id, updates);
      toast({
        title: "Calendar updated",
        description: "Calendar has been updated successfully."
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Failed to update calendar",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const enabledCalendarsCount = allCalendars.filter(cal => cal.enabled && cal.source === 'config').length;
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
              Add external calendar feeds using iCal/ICS URLs or Notion database sharing links.
            </CardDescription>
          </div>
          {allCalendars.length > 0 && (
            <Button
              onClick={handleSyncAll}
              disabled={isLoading || enabledCalendarsCount === 0}
              variant="outline"
              size="sm"
              className="ml-4 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
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
            <Button className="w-full bg-gray-700 hover:bg-gray-600 dark:bg-slate-900 dark:hover:bg-slate-800 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Calendar Feed
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-gray-100">Add Calendar Feed</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Choose between iCal feeds or Notion databases to add calendar events.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Feed Type</Label>
                <Select value={feedType} onValueChange={(value: 'ical' | 'notion') => setFeedType(value)}>
                  <SelectTrigger className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ical">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        iCal Feed (.ics)
                      </div>
                    </SelectItem>
                    <SelectItem value="notion">
                      <div className="flex items-center gap-2">
                        <GitFork className="h-4 w-4" />
                        Notion Database
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="calendar-name" className="text-gray-700 dark:text-gray-300">Calendar Name</Label>
                <Input
                  id="calendar-name"
                  placeholder="My Calendar"
                  value={newCalendar.name}
                  onChange={(e) => setNewCalendar(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="calendar-url" className="text-gray-700 dark:text-gray-300">
                  {feedType === 'ical' ? 'iCal URL' : 'Notion Database URL'}
                </Label>
                <Input
                  id="calendar-url"
                  placeholder={
                    feedType === 'ical' 
                      ? "https://calendar.example.com/feed.ics"
                      : "https://www.notion.so/database-id?v=view-id"
                  }
                  value={newCalendar.url}
                  onChange={(e) => setNewCalendar(prev => ({ ...prev, url: e.target.value }))}
                  className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Calendar Color</Label>
                <div className="flex gap-2 mt-2">
                  {CALENDAR_COLORS.map(color => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded-full border-2 ${
                        newCalendar.color === color ? 'border-gray-900 dark:border-gray-100' : 'border-gray-300 dark:border-gray-600'
                      }`}
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
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddCalendar}
                  disabled={isLoading}
                  className="bg-gray-600 hover:bg-gray-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
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
            {allCalendars.map(calendar => (
              <EditableCalendarCard
                key={calendar.id}
                calendar={calendar}
                isSelected={selectedCalendarIds.includes(calendar.id)}
                syncStatus={calendar.type === 'notion' ? notionSyncStatus[calendar.id] || '' : icalSyncStatus[calendar.id] || ''}
                onUpdate={handleUpdateCalendar}
                onSync={handleSync}
                onRemove={handleRemove}
                onToggleSelection={toggleCalendar}
              />
            ))}
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
        <Alert className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-900 dark:text-blue-200">Tips for Calendar Feeds</AlertTitle>
          <AlertDescription className="text-sm space-y-2 text-blue-700 dark:text-blue-300">
            <p>• <strong>iCal Feeds:</strong> Export calendar from Google, Outlook, or other services as .ics files</p>
            <p>• <strong>Notion Databases:</strong> Share your database publicly and copy the sharing link</p>
            <p>• Calendar data is stored locally in your browser using IndexedDB</p>
            <p>• Click the edit icon to modify calendar name, URL, or color</p>
            <p>• Use the sync buttons to manually refresh calendar data</p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default CalendarFeedsSettings;
