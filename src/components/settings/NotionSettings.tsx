import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNotionCalendars } from '@/hooks/useNotionCalendars';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';
import { useSettings } from '@/contexts/SettingsContext';
import { GitFork, Plus, RotateCcw, BarChart3, AlertCircle, ExternalLink, CheckCircle, Loader2, TestTube, Shield, Users, Database, Hash } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { notionService } from '@/services/notionService';
import { NotionCalendar } from '@/types/notion';
import DatabaseTestModal from './DatabaseTestModal';

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
  
  const { notionToken, setNotionToken } = useSettings();
  const { toggleCalendar, calendarsFromEvents } = useCalendarSelection();
  const { toast } = useToast();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDatabaseTestModal, setShowDatabaseTestModal] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [isTestingToken, setIsTestingToken] = useState(false);
  const [tokenValidationStatus, setTokenValidationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [validationError, setValidationError] = useState<string>('');
  const [integrationInfo, setIntegrationInfo] = useState<any>(null);
  const [newCalendar, setNewCalendar] = useState({
    name: '',
    url: '',
    databaseId: '',
    color: CALENDAR_COLORS[0],
    enabled: true
  });
  const [inputValidation, setInputValidation] = useState<any>(null);

  const hasToken = Boolean(notionToken);
  const enabledCalendarsCount = calendars.filter(cal => cal.enabled).length;
  const notionEventsCount = calendarsFromEvents
    .filter(cal => cal.id.startsWith('notion_'))
    .reduce((sum, cal) => sum + cal.eventCount, 0);

  const validateTokenFormat = (token: string): { valid: boolean; error?: string } => {
    if (!token.trim()) {
      return { valid: false, error: 'Token cannot be empty' };
    }
    
    if (!token.startsWith('ntn_')) {
      return { valid: false, error: 'Notion integration tokens must start with "ntn_"' };
    }
    
    if (token.length < 50) {
      return { valid: false, error: 'Token appears to be too short. Notion tokens are typically 50+ characters' };
    }
    
    return { valid: true };
  };

  const handleTestToken = async () => {
    const formatValidation = validateTokenFormat(tokenInput);
    if (!formatValidation.valid) {
      setValidationError(formatValidation.error!);
      setTokenValidationStatus('error');
      return;
    }

    setIsTestingToken(true);
    setValidationError('');
    setTokenValidationStatus('idle');

    try {
      console.log('🧪 Testing Notion token...');
      const isValid = await notionService.validateToken(tokenInput);
      
      if (isValid) {
        // Get integration information
        const info = await notionService.getIntegrationInfo(tokenInput);
        setIntegrationInfo(info);
        setTokenValidationStatus('success');
        toast({
          title: "Token test successful",
          description: `Connected to ${info.workspace?.name || 'Notion workspace'} as ${info.name}`,
        });
      } else {
        setTokenValidationStatus('error');
        setValidationError('Token validation failed. Please check the token and try again.');
      }
    } catch (error) {
      console.error('Token test error:', error);
      setTokenValidationStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      setValidationError(errorMessage);
      
      toast({
        title: "Token test failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsTestingToken(false);
    }
  };

  const handleTokenSave = async () => {
    const formatValidation = validateTokenFormat(tokenInput);
    if (!formatValidation.valid) {
      toast({
        title: "Invalid token format",
        description: formatValidation.error,
        variant: "destructive"
      });
      return;
    }

    setIsValidatingToken(true);
    setValidationError('');

    try {
      console.log('💾 Validating and saving Notion token...');
      const isValid = await notionService.validateToken(tokenInput);
      
      if (isValid) {
        setNotionToken(tokenInput);
        setShowTokenInput(false);
        setTokenInput('');
        setTokenValidationStatus('idle');
        setIntegrationInfo(null);
        toast({
          title: "Token saved successfully",
          description: "Notion integration token has been validated and saved securely."
        });
      } else {
        toast({
          title: "Invalid token",
          description: "The provided token is not valid. Please check and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Token save error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      
      toast({
        title: "Token validation failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsValidatingToken(false);
    }
  };

  const handleDatabaseConfirm = (databaseId: string, databaseName: string) => {
    setNewCalendar(prev => ({
      ...prev,
      name: databaseName,
      databaseId: databaseId,
      url: `https://notion.so/${databaseId}`
    }));
    setShowAddDialog(true);
  };

  const validateCalendarInput = (input: string) => {
    if (!input.trim()) {
      setInputValidation(null);
      return;
    }

    const validation = notionService.validateDatabaseId(input);
    setInputValidation(validation);
    
    if (validation.isValid) {
      setNewCalendar(prev => ({
        ...prev,
        url: validation.type === 'url' ? input : `https://notion.so/${validation.id}`,
        databaseId: validation.id
      }));
    }
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

    if (!newCalendar.databaseId) {
      toast({
        title: "Missing database ID",
        description: "Please test a database first to get the database ID.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const calendar = await addCalendar({
        name: newCalendar.name,
        url: newCalendar.url,
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
        url: '',
        databaseId: '',
        color: CALENDAR_COLORS[0],
        enabled: true
      });
      setInputValidation(null);
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

  if (!hasToken) {
    return (
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <GitFork className="h-5 w-5" />
            Notion Integration
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Connect your Notion workspace to import pages and databases as calendar events.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-900 dark:text-blue-200">Internal Integration Required</AlertTitle>
            <AlertDescription className="text-sm space-y-2 text-blue-700 dark:text-blue-300">
              <p>To connect Notion, you'll need to create an internal integration:</p>
              <div className="space-y-1">
                <p>1. Go to <Button variant="link" className="p-0 h-auto text-blue-600 dark:text-blue-400" asChild>
                  <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer">
                    Notion Integrations <ExternalLink className="h-3 w-3 ml-1 inline" />
                  </a>
                </Button></p>
                <p>2. Click "Create new integration"</p>
                <p>3. Give it a name and select your workspace</p>
                <p>4. Ensure "Read content" capability is enabled</p>
                <p>5. Copy the integration token (starts with "ntn_")</p>
                <p>6. Share specific pages/databases with your integration</p>
              </div>
            </AlertDescription>
          </Alert>

          {showTokenInput ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="notion-token" className="text-gray-700 dark:text-gray-300">Integration Token</Label>
                <Input
                  id="notion-token"
                  type="password"
                  placeholder="ntn_..."
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value);
                    setTokenValidationStatus('idle');
                    setValidationError('');
                    setIntegrationInfo(null);
                  }}
                  className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
                {validationError && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{validationError}</p>
                )}
                {tokenValidationStatus === 'success' && integrationInfo && (
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900 dark:text-green-200">Integration Connected</span>
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      <p><strong>Name:</strong> {integrationInfo.name}</p>
                      {integrationInfo.workspace && (
                        <p><strong>Workspace:</strong> {integrationInfo.workspace.name}</p>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>Type: {integrationInfo.type}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleTestToken}
                  disabled={isTestingToken || !tokenInput.trim()}
                  variant="outline"
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                >
                  {isTestingToken ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Test Integration
                </Button>
                <Button 
                  onClick={handleTokenSave} 
                  disabled={isValidatingToken || !tokenInput.trim() || tokenValidationStatus !== 'success'}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isValidatingToken ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Save Integration
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowTokenInput(false);
                    setTokenInput('');
                    setTokenValidationStatus('idle');
                    setValidationError('');
                    setIntegrationInfo(null);
                  }}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              onClick={() => setShowTokenInput(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <GitFork className="h-4 w-4 mr-2" />
              Connect Notion
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
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

        <div className="flex gap-2">
          <Button 
            onClick={() => setShowDatabaseTestModal(true)}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Database className="h-4 w-4 mr-2" />
            Test Database Access
          </Button>
          <Button 
            onClick={() => setShowAddDialog(true)}
            variant="outline"
            className="border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Manual
          </Button>
        </div>

        <DatabaseTestModal
          open={showDatabaseTestModal}
          onOpenChange={setShowDatabaseTestModal}
          token={notionToken}
          onConfirm={handleDatabaseConfirm}
        />

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-gray-100">Add Notion Calendar</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Add a Notion database as a calendar. You can enter a database ID, share URL, or test access first.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="calendar-name" className="text-gray-700 dark:text-gray-300">Calendar Name</Label>
                <Input
                  id="calendar-name"
                  placeholder="My Notion Calendar"
                  value={newCalendar.name}
                  onChange={(e) => setNewCalendar(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="calendar-input" className="text-gray-700 dark:text-gray-300">
                  Database ID or Share URL
                </Label>
                <Input
                  id="calendar-input"
                  placeholder="9fc8a972a9a6489f91f9e71d7443189d or https://notion.so/..."
                  value={newCalendar.url}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewCalendar(prev => ({ ...prev, url: value }));
                    validateCalendarInput(value);
                  }}
                  className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
                {inputValidation && (
                  <div className="mt-2">
                    {inputValidation.isValid ? (
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        Valid {inputValidation.type === 'id' ? 'database ID' : 'URL'} detected
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        Please enter a valid database ID or share URL
                      </div>
                    )}
                  </div>
                )}
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
                  onClick={() => {
                    setShowAddDialog(false);
                    setNewCalendar({
                      name: '',
                      url: '',
                      databaseId: '',
                      color: CALENDAR_COLORS[0],
                      enabled: true
                    });
                    setInputValidation(null);
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
                        {calendar.url}
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
            <p className="text-sm">Test database access or add your first calendar to get started.</p>
          </div>
        )}

        <Alert className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
          <Hash className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <AlertTitle className="text-purple-900 dark:text-purple-200">Enhanced Integration Features</AlertTitle>
          <AlertDescription className="text-sm space-y-2 text-purple-700 dark:text-purple-300">
            <p>• <strong>Database ID Support:</strong> Enter database IDs directly (32 hex characters)</p>
            <p>• <strong>Live Testing:</strong> Test database access before adding to calendars</p>
            <p>• <strong>Auto-detection:</strong> Automatically detects URLs vs database IDs</p>
            <p>• <strong>Property Preview:</strong> See database structure and sample data</p>
            <p>• <strong>Share Requirements:</strong> Database must be shared with your integration</p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default NotionSettings;
