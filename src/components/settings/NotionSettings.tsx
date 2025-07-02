
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNotionCalendars } from '@/hooks/useNotionCalendars';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';
import { useIntegratedEvents } from '@/hooks/useIntegratedEvents';
import { useSettings } from '@/contexts/SettingsContext';
import { GitFork, Plus, RotateCcw, BarChart3, Database, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NotionCalendar } from '@/types/notion';
import NotionIntegrationForm from './NotionIntegrationForm';

const CALENDAR_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

const NotionSettings = () => {
  const {
    calendars,
    isLoading,
    syncStatus,
    addCalendar,
    updateCalendar,
    removeCalendar,
    syncCalendar,
    syncAllCalendars
  } = useNotionCalendars();
  
  const { notionToken, notionDatabaseId } = useSettings();
  const { filteredEvents } = useIntegratedEvents();
  const { calendarsFromEvents } = useCalendarSelection(filteredEvents);
  const { toast } = useToast();
  
  const [showIntegrationForm, setShowIntegrationForm] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCalendar, setNewCalendar] = useState({
    name: '',
    color: CALENDAR_COLORS[0],
    enabled: true
  });

  const hasIntegration = Boolean(notionToken && notionDatabaseId);
  const enabledCalendarsCount = calendars.filter(cal => cal.enabled).length;
  const notionEventsCount = calendarsFromEvents
    .filter(cal => cal.id.startsWith('notion_'))
    .reduce((sum, cal) => sum + cal.eventCount, 0);

  const handleIntegrationComplete = async () => {
    setShowIntegrationForm(false);
    toast({
      title: "Integration configured",
      description: "You can now add calendars from your Notion database."
    });
  };

  const handleAddCalendar = async () => {
    if (!newCalendar.name.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a name for the calendar.",
        variant: "destructive"
      });
      return;
    }

    if (!hasIntegration) {
      toast({
        title: "Integration required",
        description: "Please configure your Notion integration first.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const calendar = await addCalendar({
        name: newCalendar.name,
        url: `https://notion.so/${notionDatabaseId}`,
        color: newCalendar.color,
        enabled: newCalendar.enabled,
        type: 'notion'
      });

      try {
        await syncCalendar(calendar);
        toast({
          title: "Calendar added and synced",
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

      setNewCalendar({
        name: '',
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

  const handleSync = async (calendar: NotionCalendar) => {
    try {
      await syncCalendar(calendar);
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
        description: "All enabled Notion calendars have been synced."
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

  if (!hasIntegration) {
    return (
      <div className="space-y-4">
        <NotionIntegrationForm onIntegrationComplete={handleIntegrationComplete} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <GitFork className="h-5 w-5" />
                Notion Integration
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Connected
                </Badge>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Import pages and databases from your Notion workspace as calendar events.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowIntegrationForm(true)}
                variant="outline"
                size="sm"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              {calendars.length > 0 && (
                <Button
                  onClick={handleSyncAll}
                  disabled={isLoading || enabledCalendarsCount === 0}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                >
                  <RotateCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Sync All ({enabledCalendarsCount})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Event Summary */}
          {notionEventsCount > 0 && (
            <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="font-medium text-purple-900 dark:text-purple-200">Notion Events</span>
              </div>
              <div className="text-sm">
                <div className="font-medium text-purple-900 dark:text-purple-200">{notionEventsCount}</div>
                <div className="text-purple-700 dark:text-purple-300">Events from Notion</div>
              </div>
            </div>
          )}

          <Button 
            onClick={() => setShowAddDialog(true)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Calendar from Database
          </Button>

          {/* Integration Settings Dialog */}
          <Dialog open={showIntegrationForm} onOpenChange={setShowIntegrationForm}>
            <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-gray-100">Notion Integration Settings</DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  Update your Notion integration token and database configuration.
                </DialogDescription>
              </DialogHeader>
              <NotionIntegrationForm onIntegrationComplete={handleIntegrationComplete} />
            </DialogContent>
          </Dialog>

          {/* Add Calendar Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-gray-100">Add Notion Calendar</DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  Add a calendar using your configured Notion database.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label htmlFor="calendar-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Calendar Name</label>
                  <input
                    id="calendar-name"
                    type="text"
                    placeholder="My Notion Calendar"
                    value={newCalendar.name}
                    onChange={(e) => setNewCalendar(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Calendar Color</label>
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
                    onClick={() => {
                      setShowAddDialog(false);
                      setNewCalendar({
                        name: '',
                        color: CALENDAR_COLORS[0],
                        enabled: true
                      });
                    }}
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddCalendar}
                    disabled={isLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Add Calendar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Calendar List */}
          {calendars.length > 0 && (
            <div className="space-y-3">
              {calendars.map(calendar => (
                <div
                  key={calendar.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: calendar.color }}
                      />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">{calendar.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          Connected to Notion database
                        </p>
                        {calendar.lastSync && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Last sync: {new Date(calendar.lastSync).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {calendar.eventCount !== undefined && (
                        <Badge variant="secondary" className="text-xs">
                          {calendar.eventCount} events
                        </Badge>
                      )}
                      <Button
                        onClick={() => handleSync(calendar)}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                      >
                        <RotateCcw className={`h-3 w-3 ${syncStatus[calendar.id] === 'syncing' ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        onClick={() => removeCalendar(calendar.id)}
                        variant="outline"
                        size="sm"
                        className="border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {calendars.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No Notion calendars added yet.</p>
              <p className="text-sm">Add your first calendar to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotionSettings;
