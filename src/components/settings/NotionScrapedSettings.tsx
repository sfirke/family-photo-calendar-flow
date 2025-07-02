
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  RefreshCw, 
  Loader2, 
  Calendar, 
  ExternalLink,
  Bug,
  Eye
} from 'lucide-react';
import { useNotionScrapedCalendars } from '@/hooks/useNotionScrapedCalendars';
import { NotionUrlForm } from './NotionUrlForm';
import { ScrapedCalendarCard } from './ScrapedCalendarCard';
import { NotionDebugPreview } from './NotionDebugPreview';

export const NotionScrapedSettings: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [debugUrl, setDebugUrl] = useState<string | null>(null);
  
  const {
    calendars,
    events,
    isLoading,
    syncStatus,
    addCalendar,
    updateCalendar,
    removeCalendar,
    syncCalendar,
    syncAllCalendars,
    validateNotionUrl
  } = useNotionScrapedCalendars();

  const handleAddCalendar = async (formData: { name: string; url: string; color: string }) => {
    try {
      await addCalendar({
        name: formData.name,
        url: formData.url,
        color: formData.color,
        enabled: true,
        eventCount: 0
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add calendar:', error);
    }
  };

  const handleDebugPreview = (url: string) => {
    setDebugUrl(url);
  };

  const totalEvents = events.length;
  const enabledCalendars = calendars.filter(cal => cal.enabled);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Scraped Notion Pages</h3>
          <p className="text-sm text-muted-foreground">
            Import events from public Notion database pages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={syncAllCalendars}
            disabled={isLoading || enabledCalendars.length === 0}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync All
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Page
          </Button>
        </div>
      </div>

      {/* Stats */}
      {calendars.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Total Pages</p>
                  <p className="text-2xl font-bold">{calendars.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Enabled</p>
                  <p className="text-2xl font-bold">{enabledCalendars.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Total Events</p>
                  <p className="text-2xl font-bold">{totalEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Notion Page</CardTitle>
          </CardHeader>
          <CardContent>
            <NotionUrlForm
              onSubmit={handleAddCalendar}
              onCancel={() => setShowAddForm(false)}
              validateUrl={validateNotionUrl}
              showDebugButton={true}
              onDebugPreview={handleDebugPreview}
            />
          </CardContent>
        </Card>
      )}

      {/* Calendars List */}
      {calendars.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Configured Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {calendars.map((calendar) => (
                  <ScrapedCalendarCard
                    key={calendar.id}
                    calendar={calendar}
                    syncStatus={syncStatus[calendar.id] || ''}
                    onUpdate={updateCalendar}
                    onRemove={removeCalendar}
                    onSync={syncCalendar}
                    onDebugPreview={handleDebugPreview}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        !showAddForm && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Notion Pages Added</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first public Notion database page to start importing events
                </p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Page
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            How to Use Scraped Notion Pages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">1</Badge>
            <span>Make sure your Notion database page is shared publicly</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">2</Badge>
            <span>Your database should have at least a title column and a date column</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">3</Badge>
            <span>Copy the full URL from your browser when viewing the database</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">4</Badge>
            <span>Use the debug preview to see how your data will be parsed before adding</span>
          </div>
          <Separator className="my-3" />
          <p className="text-xs">
            <strong>Supported column types:</strong> Title, Date, Time, Location, Description, Status, Categories, Priority
          </p>
        </CardContent>
      </Card>

      {/* Debug Preview Modal */}
      {debugUrl && (
        <NotionDebugPreview
          url={debugUrl}
          onClose={() => setDebugUrl(null)}
        />
      )}
    </div>
  );
};
