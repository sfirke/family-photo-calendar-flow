
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
  Database,
  Key,
  Settings
} from 'lucide-react';
import { useNotionCalendars } from '@/hooks/useNotionCalendars';
import { useNotionScrapedCalendars } from '@/hooks/useNotionScrapedCalendars';
import { NotionUrlForm } from './NotionUrlForm';
import NotionIntegrationForm from './NotionIntegrationForm';
import { ScrapedCalendarCard } from './ScrapedCalendarCard';
import { NotionDebugPreview } from './NotionDebugPreview';

export const NotionIntegration: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLegacyForm, setShowLegacyForm] = useState(false);
  const [debugUrl, setDebugUrl] = useState<string | null>(null);
  const [debugToken, setDebugToken] = useState<string | null>(null);
  
  // New API-based calendars (from NotionScrapedSettings)
  const {
    calendars: apiCalendars,
    events: apiEvents,
    isLoading: apiLoading,
    syncStatus: apiSyncStatus,
    addCalendar: addApiCalendar,
    updateCalendar: updateApiCalendar,
    removeCalendar: removeApiCalendar,
    syncCalendar: syncApiCalendar,
    syncAllCalendars: syncAllApiCalendars,
    validateNotionUrl,
    testDatabaseAccess
  } = useNotionScrapedCalendars();

  // Legacy calendars (from NotionSettings)
  const {
    calendars: legacyCalendars,
    events: legacyEvents,
    isLoading: legacyLoading,
    syncStatus: legacySyncStatus,
    addCalendar: addLegacyCalendar,
    updateCalendar: updateLegacyCalendar,
    removeCalendar: removeLegacyCalendar,
    syncCalendar: syncLegacyCalendar,
    syncAllCalendars: syncAllLegacyCalendars
  } = useNotionCalendars();

  // Combine all calendars and events
  const allCalendars = [...apiCalendars, ...legacyCalendars];
  const allEvents = [...apiEvents, ...legacyEvents];
  const isLoading = apiLoading || legacyLoading;
  const enabledCalendars = allCalendars.filter(cal => cal.enabled);

  const handleAddApiCalendar = async (formData: { 
    name: string; 
    url: string; 
    color: string; 
    token: string; 
    databaseId: string;
  }) => {
    try {
      await addApiCalendar({
        name: formData.name,
        url: formData.url,
        color: formData.color,
        enabled: true,
        eventCount: 0,
        metadata: {
          url: formData.url,
          title: formData.name,
          lastScraped: new Date(),
          eventCount: 0,
          databaseId: formData.databaseId,
          token: formData.token,
          viewType: 'database'
        }
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add API calendar:', error);
    }
  };

  const handleAddLegacyCalendar = async (formData: {
    name: string;
    url: string;
    color: string;
  }) => {
    try {
      await addLegacyCalendar({
        name: formData.name,
        url: formData.url,
        color: formData.color,
        enabled: true,
        eventCount: 0,
        type: 'notion'
      });
      setShowLegacyForm(false);
    } catch (error) {
      console.error('Failed to add legacy calendar:', error);
    }
  };

  const handleDebugPreview = (url: string, token?: string) => {
    setDebugUrl(url);
    setDebugToken(token || null);
  };

  const handleSyncAll = async () => {
    try {
      await Promise.all([
        syncAllApiCalendars(),
        syncAllLegacyCalendars()
      ]);
    } catch (error) {
      console.error('Failed to sync all calendars:', error);
    }
  };

  const totalEvents = allEvents.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" />
            Notion Integration
          </h3>
          <p className="text-sm text-muted-foreground">
            Import events from Notion databases using API integration or legacy scraping
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSyncAll}
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
            Add Database
          </Button>
        </div>
      </div>

      {/* Stats */}
      {allCalendars.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Database className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Total Databases</p>
                  <p className="text-2xl font-bold">{allCalendars.length}</p>
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

      {/* Add Forms */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Add Notion Database (API Integration)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NotionUrlForm
              onSubmit={handleAddApiCalendar}
              onCancel={() => setShowAddForm(false)}
              validateUrl={validateNotionUrl}
              showDebugButton={true}
              onDebugPreview={handleDebugPreview}
            />
          </CardContent>
        </Card>
      )}

      {showLegacyForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Add Legacy Notion Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NotionIntegrationForm
              onSubmit={handleAddLegacyCalendar}
              onCancel={() => setShowLegacyForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Calendars List */}
      {allCalendars.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Configured Databases</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLegacyForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Legacy Calendar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {allCalendars.map((calendar) => {
                  const isApiCalendar = 'metadata' in calendar && calendar.metadata?.token;
                  const syncStatus = isApiCalendar 
                    ? apiSyncStatus[calendar.id] || ''
                    : legacySyncStatus[calendar.id] || '';
                  
                  return (
                    <div key={calendar.id} className="relative">
                      {isApiCalendar && (
                        <Badge variant="secondary" className="absolute -top-2 -right-2 z-10">
                          API
                        </Badge>
                      )}
                      {!isApiCalendar && (
                        <Badge variant="outline" className="absolute -top-2 -right-2 z-10">
                          Legacy
                        </Badge>
                      )}
                      <ScrapedCalendarCard
                        calendar={calendar}
                        syncStatus={syncStatus}
                        onUpdate={isApiCalendar ? updateApiCalendar : updateLegacyCalendar}
                        onRemove={isApiCalendar ? removeApiCalendar : removeLegacyCalendar}
                        onSync={isApiCalendar ? syncApiCalendar : syncLegacyCalendar}
                        onDebugPreview={handleDebugPreview}
                      />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        !showAddForm && !showLegacyForm && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Notion Databases Added</h3>
                <p className="text-muted-foreground mb-4">
                  Connect your first Notion database to start importing events
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Database (API)
                  </Button>
                  <Button variant="outline" onClick={() => setShowLegacyForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Legacy Calendar
                  </Button>
                </div>
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
            How to Connect Notion Databases
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">API Integration (Recommended)</h4>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">1</Badge>
              <span>Create an integration at <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">notion.so/my-integrations</a></span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">2</Badge>
              <span>Give your integration a name and copy the integration token</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">3</Badge>
              <span>Share your database with the integration (click "Share" → "Invite" → select your integration)</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">4</Badge>
              <span>Copy the database URL from your browser address bar</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">5</Badge>
              <span>Your database should have at least a title and date column for events</span>
            </div>
          </div>
          <Separator className="my-3" />
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">Legacy Integration</h4>
            <p className="text-xs">
              For existing setups or when API integration isn't available. Uses web scraping to extract data from publicly shared Notion pages.
            </p>
          </div>
          <Separator className="my-3" />
          <p className="text-xs">
            <strong>Benefits of API integration:</strong> Faster sync, more reliable data access, better error handling, 
            and support for all Notion property types including dates, rich text, select options, and more.
          </p>
        </CardContent>
      </Card>

      {/* Debug Preview Modal */}
      {debugUrl && (
        <NotionDebugPreview
          url={debugUrl}
          token={debugToken}
          onClose={() => {
            setDebugUrl(null);
            setDebugToken(null);
          }}
        />
      )}
    </div>
  );
};
