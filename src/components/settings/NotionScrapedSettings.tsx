
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Trash2, Plus, ExternalLink, AlertCircle } from 'lucide-react';
import { useNotionScrapedCalendars } from '@/hooks/useNotionScrapedCalendars';
import { NotionScrapedCalendar } from '@/services/notionScrapedEventsStorage';
import { useToast } from '@/hooks/use-toast';
import NotionUrlForm from './NotionUrlForm';
import ScrapedCalendarCard from './ScrapedCalendarCard';

const NotionScrapedSettings = () => {
  const {
    calendars,
    isLoading,
    syncStatus,
    addCalendar,
    updateCalendar,
    removeCalendar,
    syncCalendar,
    syncAllCalendars,
    validateNotionUrl
  } = useNotionScrapedCalendars();

  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSyncAll = async () => {
    try {
      await syncAllCalendars();
      toast({
        title: "Sync Complete",
        description: "All scraped calendars have been synced successfully.",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Some calendars failed to sync. Check individual calendar status for details.",
        variant: "destructive"
      });
    }
  };

  const enabledCalendars = calendars.filter(cal => cal.enabled);
  const totalEvents = calendars.reduce((sum, cal) => sum + (cal.eventCount || 0), 0);

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <ExternalLink className="h-5 w-5" />
              Public Notion Pages
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Scrape events from public Notion database pages. No API access required.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {calendars.length} configured
            </Badge>
            <Badge variant="outline" className="text-xs">
              {totalEvents} events
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAddForm(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Page
            </Button>
            {enabledCalendars.length > 0 && (
              <Button
                onClick={handleSyncAll}
                disabled={isLoading}
                size="sm"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Sync All
              </Button>
            )}
          </div>
          
          {enabledCalendars.length > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {enabledCalendars.length} active calendar{enabledCalendars.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
            <NotionUrlForm
              onCancel={() => setShowAddForm(false)}
              onSuccess={() => {
                setShowAddForm(false);
                toast({
                  title: "Calendar Added",
                  description: "Public Notion page has been added successfully.",
                });
              }}
              addCalendar={addCalendar}
              validateNotionUrl={validateNotionUrl}
            />
          </div>
        )}

        <Separator />

        {/* Calendar List */}
        {calendars.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <ExternalLink className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Public Notion Pages</h3>
            <p className="text-sm mb-4">
              Add public Notion database pages to automatically scrape calendar events.
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Your First Page
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {calendars.map((calendar) => (
              <ScrapedCalendarCard
                key={calendar.id}
                calendar={calendar}
                syncStatus={syncStatus[calendar.id]}
                onSync={() => syncCalendar(calendar)}
                onUpdate={updateCalendar}
                onRemove={removeCalendar}
              />
            ))}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                How to use Public Notion Pages
              </h4>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-xs">
                <li>• Only public Notion database pages are supported</li>
                <li>• Pages must be accessible without authentication</li>
                <li>• Events are detected based on date properties in the database</li>
                <li>• Sync manually or calendars update automatically on app refresh</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotionScrapedSettings;
