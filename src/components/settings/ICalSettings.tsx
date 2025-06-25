
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useICalCalendars, ICalCalendar } from '@/hooks/useICalCalendars';
import { Calendar, Plus, Trash2, RefreshCw, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const CALENDAR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
];

const ICalSettings = () => {
  const { calendars, isLoading, syncStatus, addCalendar, updateCalendar, removeCalendar, syncCalendar } = useICalCalendars();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCalendar, setNewCalendar] = useState({
    name: '',
    url: '',
    color: CALENDAR_COLORS[0],
    enabled: true
  });

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
      const calendar = addCalendar(newCalendar);
      
      // Try to sync immediately to validate the URL
      await syncCalendar(calendar);
      
      toast({
        title: "Calendar added",
        description: `${newCalendar.name} has been added and synced successfully.`
      });
      
      setNewCalendar({ name: '', url: '', color: CALENDAR_COLORS[0], enabled: true });
      setShowAddDialog(false);
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Calendar was added but initial sync failed. Check the URL and try syncing manually.",
        variant: "destructive"
      });
    }
  };

  const handleSync = async (calendar: ICalCalendar) => {
    try {
      await syncCalendar(calendar);
      toast({
        title: "Sync successful",
        description: `${calendar.name} has been synced successfully.`
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: `Failed to sync ${calendar.name}. Please check the URL and try again.`,
        variant: "destructive"
      });
    }
  };

  const handleRemove = (calendar: ICalCalendar) => {
    removeCalendar(calendar.id);
    toast({
      title: "Calendar removed",
      description: `${calendar.name} has been removed.`
    });
  };

  const getSyncStatusBadge = (calendarId: string, lastSync?: string) => {
    const status = syncStatus[calendarId];
    
    if (status === 'syncing') {
      return <Badge variant="secondary">Syncing...</Badge>;
    }
    if (status === 'error') {
      return <Badge variant="destructive">Error</Badge>;
    }
    if (status === 'success' || lastSync) {
      return <Badge variant="default">Synced</Badge>;
    }
    return <Badge variant="secondary">Not synced</Badge>;
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Calendar className="h-5 w-5" />
          iCal Calendars
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Add external calendar feeds using iCal/ICS URLs. No authentication required.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Calendar Button */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add iCal Calendar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add iCal Calendar</DialogTitle>
              <DialogDescription>
                Enter the details for your iCal calendar feed. You can find iCal URLs in most calendar applications.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="calendar-name">Calendar Name</Label>
                <Input
                  id="calendar-name"
                  placeholder="My Calendar"
                  value={newCalendar.name}
                  onChange={(e) => setNewCalendar(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="calendar-url">iCal URL</Label>
                <Input
                  id="calendar-url"
                  placeholder="https://calendar.google.com/calendar/ical/..."
                  value={newCalendar.url}
                  onChange={(e) => setNewCalendar(prev => ({ ...prev, url: e.target.value }))}
                />
              </div>
              <div>
                <Label>Calendar Color</Label>
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
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCalendar} disabled={isLoading}>
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
              <div key={calendar.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
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
                      {calendar.url.length > 50 ? `${calendar.url.substring(0, 50)}...` : calendar.url}
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
                  {getSyncStatusBadge(calendar.id, calendar.lastSync)}
                  <Switch
                    checked={calendar.enabled}
                    onCheckedChange={(enabled) => updateCalendar(calendar.id, { enabled })}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSync(calendar)}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${syncStatus[calendar.id] === 'syncing' ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemove(calendar)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {calendars.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No iCal calendars added yet.</p>
            <p className="text-sm">Add your first calendar to get started.</p>
          </div>
        )}

        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Tip:</strong> Most calendar services provide iCal URLs. Look for "Export" or "Share" options in Google Calendar, Outlook, or other calendar apps.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ICalSettings;
