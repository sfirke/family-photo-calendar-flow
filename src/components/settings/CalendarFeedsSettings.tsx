
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useICalCalendars } from '@/hooks/useICalCalendars';
import { useNotionCalendars } from '@/hooks/useNotionCalendars';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';
import { Calendar, RotateCcw } from 'lucide-react';
import EditableCalendarCard from './EditableCalendarCard';
import AddCalendarDialog from './AddCalendarDialog';
import CalendarEventsSummary from './CalendarEventsSummary';
import CalendarHelpSection from './CalendarHelpSection';
import { ICalCalendar } from '@/types/ical';
import { NotionCalendar } from '@/types/notion';
import { NotionService } from '@/services/notionService';

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

  const handleAddCalendar = async (calendarData: {
    name: string;
    url: string;
    color: string;
    enabled: boolean;
    type: 'ical' | 'notion';
  }) => {
    if (!calendarData.name.trim() || !calendarData.url.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a name and URL for the calendar.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (calendarData.type === 'ical') {
        if (!calendarData.url.includes('.ics') && !calendarData.url.includes('ical')) {
          toast({
            title: "Invalid URL",
            description: "Please enter a valid iCal URL (should contain '.ics' or 'ical').",
            variant: "destructive"
          });
          return;
        }

        const calendar = await addICalCalendar({
          name: calendarData.name,
          url: calendarData.url,
          color: calendarData.color,
          enabled: calendarData.enabled
        });

        try {
          await syncICalCalendar(calendar);
          toast({
            title: "iCal calendar added and synced",
            description: `${calendarData.name} has been added and synced successfully.`
          });
        } catch (syncError) {
          const errorMessage = syncError instanceof Error ? syncError.message : 'Unknown sync error';
          toast({
            title: "Calendar added",
            description: `${calendarData.name} was added but sync failed: ${errorMessage}`,
            variant: "destructive"
          });
        }
      } else {
        if (!NotionService.isValidNotionUrl(calendarData.url)) {
          toast({
            title: "Invalid URL",
            description: "Please enter a valid Notion database sharing URL.",
            variant: "destructive"
          });
          return;
        }

        const calendar = await addNotionCalendar({
          name: calendarData.name,
          url: calendarData.url,
          color: calendarData.color,
          enabled: calendarData.enabled
        });

        try {
          await syncNotionCalendar(calendar);
          toast({
            title: "Notion calendar added and synced",
            description: `${calendarData.name} has been added and synced successfully.`
          });
        } catch (syncError) {
          const errorMessage = syncError instanceof Error ? syncError.message : 'Unknown sync error';
          toast({
            title: "Calendar added",
            description: `${calendarData.name} was added but sync failed: ${errorMessage}`,
            variant: "destructive"
          });
        }
      }

      forceRefresh();
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
        <CalendarEventsSummary
          totalEvents={totalEvents}
          calendarsWithEventsCount={calendarsWithEventsCount}
          selectedCalendarIds={selectedCalendarIds}
        />

        <AddCalendarDialog onAdd={handleAddCalendar} isLoading={isLoading} />

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

        <CalendarHelpSection />
      </CardContent>
    </Card>
  );
};

export default CalendarFeedsSettings;
