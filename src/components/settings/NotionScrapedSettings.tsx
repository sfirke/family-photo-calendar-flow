
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { useNotionScrapedCalendars } from '@/hooks/useNotionScrapedCalendars';
import { useSettings } from '@/contexts/SettingsContext';
import NotionUrlForm from './NotionUrlForm';
import ScrapedCalendarCard from './ScrapedCalendarCard';
import { toast } from 'sonner';

interface NotionScrapedSettingsProps {
  selectedCalendarIds: string[];
  onToggleSelection: (calendarId: string, selected: boolean) => void;
}

const NotionScrapedSettings = ({ selectedCalendarIds, onToggleSelection }: NotionScrapedSettingsProps) => {
  const [showAddForm, setShowAddForm] = React.useState(false);
  const { 
    calendars, 
    isLoading, 
    addCalendar, 
    removeCalendar, 
    updateCalendar, 
    syncCalendar,
    syncAllCalendars,
    syncStatus 
  } = useNotionScrapedCalendars();

  const handleAddCalendar = async (name: string, url: string) => {
    try {
      await addCalendar({ name, url, enabled: true });
      setShowAddForm(false);
      toast.success('Notion database added successfully');
    } catch (error) {
      console.error('Error adding Notion calendar:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add Notion database');
    }
  };

  const handleToggleCalendar = async (id: string, enabled: boolean) => {
    try {
      await updateCalendar(id, { enabled });
      toast.success(enabled ? 'Calendar enabled' : 'Calendar disabled');
    } catch (error) {
      console.error('Error updating calendar:', error);
      toast.error('Failed to update calendar');
    }
  };

  const handleDeleteCalendar = async (id: string) => {
    try {
      await removeCalendar(id);
      toast.success('Notion database removed');
    } catch (error) {
      console.error('Error removing calendar:', error);
      toast.error('Failed to remove calendar');
    }
  };

  const handleSyncCalendar = async (id: string) => {
    try {
      await syncCalendar(id);
      toast.success('Calendar synced successfully');
    } catch (error) {
      console.error('Error syncing calendar:', error);
      toast.error('Failed to sync calendar');
    }
  };

  const handleSyncAll = async () => {
    try {
      await syncAllCalendars();
      toast.success('All calendars synced successfully');
    } catch (error) {
      console.error('Error syncing all calendars:', error);
      toast.error('Failed to sync calendars');
    }
  };

  const handleToggleSelection = (calendarId: string, selected: boolean) => {
    console.log('NotionScrapedSettings - Toggle selection:', { calendarId, selected });
    onToggleSelection(calendarId, selected);
  };

  const enabledCalendars = calendars.filter(cal => cal.enabled);
  const totalEvents = calendars.reduce((sum, cal) => sum + (cal.eventCount || 0), 0);
  const selectedCount = calendars.filter(cal => selectedCalendarIds.includes(cal.id)).length;

  console.log('NotionScrapedSettings - Render state:', {
    calendarsCount: calendars.length,
    enabledCount: enabledCalendars.length,
    totalEvents,
    selectedCount,
    selectedCalendarIds
  });

  return (
    <div className="space-y-4">
      {/* Header with Add Button and Sync All */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Notion Databases</h4>
          <p className="text-sm text-gray-600">
            Connect your Notion databases to sync events automatically
          </p>
        </div>
        <div className="flex gap-2">
          {enabledCalendars.length > 0 && (
            <Button
              onClick={handleSyncAll}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Sync All
            </Button>
          )}
          <Button 
            onClick={() => setShowAddForm(true)}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Database
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      {calendars.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Databases:</span>
              <span className="ml-2 font-medium">{calendars.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Active:</span>
              <span className="ml-2 font-medium">{enabledCalendars.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Visible:</span>
              <span className="ml-2 font-medium">{selectedCount}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Events:</span>
              <span className="ml-2 font-medium">{totalEvents}</span>
            </div>
          </div>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
          <h5 className="font-medium mb-3">Add Notion Database</h5>
          <NotionUrlForm
            onSubmit={handleAddCalendar}
            onCancel={() => setShowAddForm(false)}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Calendar Cards */}
      <div className="space-y-4">
        {calendars.map((calendar) => (
          <ScrapedCalendarCard
            key={calendar.id}
            calendar={calendar}
            onToggle={handleToggleCalendar}
            onDelete={handleDeleteCalendar}
            onSync={handleSyncCalendar}
            isSyncing={syncStatus[calendar.id] === 'syncing'}
            isSelected={selectedCalendarIds.includes(calendar.id)}
            onToggleSelection={handleToggleSelection}
          />
        ))}
      </div>

      {/* Empty State */}
      {calendars.length === 0 && !showAddForm && (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="mb-2">No Notion databases configured</p>
          <p className="text-sm mb-4">
            Add a Notion database to start syncing events automatically
          </p>
          <Button onClick={() => setShowAddForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Your First Database
          </Button>
        </div>
      )}
    </div>
  );
};

export default NotionScrapedSettings;
