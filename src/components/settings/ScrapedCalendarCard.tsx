
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calendar,
  ExternalLink,
  RefreshCw,
  Trash2,
  Edit2,
  Save,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Bug
} from 'lucide-react';
import { NotionScrapedCalendar } from '@/services/notionScrapedEventsStorage';

interface ScrapedCalendarCardProps {
  calendar: NotionScrapedCalendar;
  syncStatus: 'syncing' | 'success' | 'error' | '';
  onUpdate: (id: string, updates: Partial<NotionScrapedCalendar>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onSync: (calendar: NotionScrapedCalendar) => Promise<void>;
  onDebugPreview?: (url: string) => void;
}

export const ScrapedCalendarCard: React.FC<ScrapedCalendarCardProps> = ({
  calendar,
  syncStatus,
  onUpdate,
  onRemove,
  onSync,
  onDebugPreview
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: calendar.name,
    color: calendar.color
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await onUpdate(calendar.id, editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update calendar:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: calendar.name,
      color: calendar.color
    });
    setIsEditing(false);
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

  const handleSync = async () => {
    try {
      await onSync(calendar);
    } catch (error) {
      console.error('Failed to sync calendar:', error);
    }
  };

  const handleToggleEnabled = async (enabled: boolean) => {
    try {
      await onUpdate(calendar.id, { enabled });
    } catch (error) {
      console.error('Failed to toggle calendar:', error);
    }
  };

  const handleDebugPreview = () => {
    if (onDebugPreview) {
      onDebugPreview(calendar.url);
    }
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getSyncStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Syncing...';
      case 'success':
        return 'Synced';
      case 'error':
        return 'Error';
      default:
        return 'Ready';
    }
  };

  return (
    <Card className={`transition-all ${calendar.enabled ? 'border-primary/20' : 'border-muted'}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            {/* Color indicator */}
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: calendar.color }}
            />
            
            {/* Calendar info */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="edit-name" className="text-sm">Name</Label>
                    <Input
                      id="edit-name"
                      value={editData.name}
                      onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-color" className="text-sm">Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="edit-color"
                        type="color"
                        value={editData.color}
                        onChange={(e) => setEditData(prev => ({ ...prev, color: e.target.value }))}
                        className="w-16 h-8"
                      />
                      <span className="text-sm text-muted-foreground">{editData.color}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h4 className="font-medium">{calendar.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {calendar.eventCount || 0} events
                    </span>
                    {calendar.lastSync && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          Last sync: {new Date(calendar.lastSync).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              {getSyncStatusIcon()}
              <span className="text-sm text-muted-foreground">
                {getSyncStatusText()}
              </span>
            </div>
          </div>

          {/* Enable/Disable toggle */}
          <Switch
            checked={calendar.enabled}
            onCheckedChange={handleToggleEnabled}
            disabled={syncStatus === 'syncing'}
          />
        </div>

        {/* URL display */}
        <div className="mb-4 p-2 bg-muted rounded text-sm font-mono break-all">
          {calendar.url}
        </div>

        {/* Metadata */}
        {calendar.metadata && (
          <div className="mb-4 flex flex-wrap gap-2">
            {calendar.metadata.viewType && (
              <Badge variant="outline" className="text-xs">
                {calendar.metadata.viewType}
              </Badge>
            )}
            {calendar.metadata.databaseId && (
              <Badge variant="outline" className="text-xs">
                DB: {calendar.metadata.databaseId.slice(-8)}
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isUpdating || !editData.name.trim()}
              >
                {isUpdating ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Save className="h-3 w-3 mr-1" />
                )}
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSync}
                disabled={syncStatus === 'syncing'}
              >
                {syncStatus === 'syncing' ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Sync
              </Button>
              
              {onDebugPreview && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDebugPreview}
                  className="flex items-center gap-1"
                >
                  <Bug className="h-3 w-3" />
                  Debug
                </Button>
              )}
              
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-3 w-3 mr-1" />
                Edit
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(calendar.url, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open
              </Button>
              
              <Button
                size="sm"
                variant="destructive"
                onClick={handleRemove}
                disabled={isRemoving}
              >
                {isRemoving ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Trash2 className="h-3 w-3 mr-1" />
                )}
                Remove
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
