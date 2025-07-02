
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, Trash2, Edit, ExternalLink, Save, X, CheckCircle, XCircle, Clock } from 'lucide-react';
import { NotionScrapedCalendar } from '@/services/notionScrapedEventsStorage';
import { NotionScrapedSyncStatus } from '@/hooks/useNotionScrapedCalendars';
import { formatDistanceToNow } from 'date-fns';

interface ScrapedCalendarCardProps {
  calendar: NotionScrapedCalendar;
  syncStatus: NotionScrapedSyncStatus[string];
  onSync: () => Promise<void>;
  onUpdate: (id: string, updates: Partial<NotionScrapedCalendar>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

const ScrapedCalendarCard = ({ 
  calendar, 
  syncStatus, 
  onSync, 
  onUpdate, 
  onRemove 
}: ScrapedCalendarCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(calendar.name);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleSave = async () => {
    if (editName.trim() === calendar.name) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdate(calendar.id, { name: editName.trim() });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update calendar:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditName(calendar.name);
    setIsEditing(false);
  };

  const handleToggleEnabled = async (enabled: boolean) => {
    try {
      await onUpdate(calendar.id, { enabled });
    } catch (error) {
      console.error('Failed to toggle calendar:', error);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove(calendar.id);
    } catch (error) {
      console.error('Failed to remove calendar:', error);
      setIsRemoving(false);
    }
  };

  const getSyncStatusBadge = () => {
    switch (syncStatus) {
      case 'syncing':
        return (
          <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Syncing
          </Badge>
        );
      case 'success':
        return (
          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
            <CheckCircle className="h-3 w-3 mr-1" />
            Success
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-700 border-gray-300 bg-gray-50">
            <Clock className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        );
    }
  };

  const getLastSyncText = () => {
    if (!calendar.lastSync) return 'Never synced';
    try {
      return `${formatDistanceToNow(new Date(calendar.lastSync))} ago`;
    } catch {
      return 'Unknown';
    }
  };

  return (
    <Card className="border border-gray-200 dark:border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: calendar.color }}
              />
              
              {isEditing ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave();
                      if (e.key === 'Escape') handleCancel();
                    }}
                  />
                  <Button
                    onClick={handleSave}
                    disabled={isUpdating}
                    size="sm"
                    variant="outline"
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={handleCancel}
                    size="sm"
                    variant="outline"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {calendar.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    {getSyncStatusBadge()}
                    {calendar.eventCount !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {calendar.eventCount} events
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p className="truncate">
                <ExternalLink className="h-3 w-3 inline mr-1" />
                {calendar.url}
              </p>
              <p>Last sync: {getLastSyncText()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Switch
              checked={calendar.enabled}
              onCheckedChange={handleToggleEnabled}
              size="sm"
            />
            
            <Button
              onClick={onSync}
              disabled={syncStatus === 'syncing'}
              size="sm"
              variant="outline"
              title="Sync calendar"
            >
              <RefreshCw className={`h-4 w-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              onClick={() => setIsEditing(true)}
              disabled={isEditing}
              size="sm"
              variant="outline"
              title="Edit calendar"
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={handleRemove}
              disabled={isRemoving}
              size="sm"
              variant="outline"
              title="Delete calendar"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScrapedCalendarCard;
