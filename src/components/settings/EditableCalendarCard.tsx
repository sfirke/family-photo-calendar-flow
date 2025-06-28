import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit2, Save, X, RefreshCw, Trash2, ExternalLink } from 'lucide-react';
const CALENDAR_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
interface EditableCalendarCardProps {
  calendar: any;
  isSelected: boolean;
  syncStatus: string;
  onUpdate: (id: string, updates: any) => void;
  onSync: (calendar: any) => void;
  onRemove: (calendar: any) => void;
  onToggleSelection: (id: string, checked: boolean) => void;
}
const EditableCalendarCard = ({
  calendar,
  isSelected,
  syncStatus,
  onUpdate,
  onSync,
  onRemove,
  onToggleSelection
}: EditableCalendarCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: calendar.name,
    url: calendar.url,
    color: calendar.color
  });
  const handleSave = () => {
    onUpdate(calendar.id, editData);
    setIsEditing(false);
  };
  const handleCancel = () => {
    setEditData({
      name: calendar.name,
      url: calendar.url,
      color: calendar.color
    });
    setIsEditing(false);
  };
  const getSyncStatusBadge = () => {
    if (syncStatus === 'syncing') {
      return <Badge variant="secondary">Syncing...</Badge>;
    }
    if (syncStatus === 'error') {
      return <Badge variant="destructive">Error</Badge>;
    }
    if (syncStatus === 'success' || calendar.lastSync) {
      return <Badge variant="default" className="bg-green-700">Synced</Badge>;
    }
    if (calendar.source === 'events') {
      return <Badge variant="outline">From Events</Badge>;
    }
    return <Badge variant="secondary">Not synced</Badge>;
  };
  const hasValidUrl = calendar.url && calendar.url.trim() !== '';
  return <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-4 h-4 rounded-full border cursor-pointer" style={{
          backgroundColor: isEditing ? editData.color : calendar.color
        }} onClick={() => isEditing && setIsEditing(true)} />
          <div className="flex-1">
            {isEditing ? <div className="space-y-2">
                <Input value={editData.name} onChange={e => setEditData(prev => ({
              ...prev,
              name: e.target.value
            }))} className="font-medium" placeholder="Calendar name" />
                <Input value={editData.url} onChange={e => setEditData(prev => ({
              ...prev,
              url: e.target.value
            }))} className="text-sm" placeholder="Calendar URL" />
                <div className="flex gap-1">
                  {CALENDAR_COLORS.map(color => <button key={color} className={`w-6 h-6 rounded-full border-2 ${editData.color === color ? 'border-gray-900 dark:border-gray-100' : 'border-gray-300 dark:border-gray-600'}`} style={{
                backgroundColor: color
              }} onClick={() => setEditData(prev => ({
                ...prev,
                color
              }))} />)}
                </div>
              </div> : <>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  {calendar.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  {hasValidUrl ? calendar.url.length > 50 ? `${calendar.url.substring(0, 50)}...` : calendar.url : 'No URL available'}
                </p>
                {calendar.lastSync && <p className="text-xs text-gray-400 dark:text-gray-500">
                    Last synced: {new Date(calendar.lastSync).toLocaleString()}
                    {calendar.eventCount !== undefined && ` • ${calendar.eventCount} events`}
                  </p>}
              </>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getSyncStatusBadge()}
          {calendar.source === 'config' && <Switch checked={calendar.enabled} onCheckedChange={enabled => onUpdate(calendar.id, {
          enabled
        })} />}
          {isEditing ? <>
              <Button size="sm" variant="outline" onClick={handleSave} className="border-green-300 dark:border-green-600 text-green-600 dark:text-green-400">
                <Save className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} className="border-red-300 dark:border-red-600 text-red-600 dark:text-red-400">
                <X className="h-4 w-4" />
              </Button>
            </> : <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
              <Edit2 className="h-4 w-4" />
            </Button>}
          <Button size="sm" variant="outline" onClick={() => onSync(calendar)} disabled={!hasValidUrl} title={hasValidUrl ? "Sync this calendar" : "No URL available for syncing"} className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
            <RefreshCw className={`h-4 w-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" variant="outline" onClick={() => onRemove(calendar)} title="Remove this calendar" className="border-red-300 dark:border-red-600 text-red-600 dark:text-red-400">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox id={`calendar-selection-${calendar.id}`} checked={isSelected} onCheckedChange={checked => onToggleSelection(calendar.id, checked === true)} />
            <label htmlFor={`calendar-selection-${calendar.id}`} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              Show in calendar view
            </label>
          </div>
          
          {calendar.hasEvents && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200">
              {calendar.eventCount || 0} event{(calendar.eventCount || 0) !== 1 ? 's' : ''}
            </span>}
        </div>
      </div>
    </div>;
};
export default EditableCalendarCard;