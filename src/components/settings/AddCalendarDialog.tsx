
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Globe, GitFork } from 'lucide-react';
import { CreateCalendarInput } from '@/services/calendarFeedService';

const CALENDAR_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

interface AddCalendarDialogProps {
  onAdd: (calendar: CreateCalendarInput) => Promise<void>;
  isLoading: boolean;
}

const AddCalendarDialog = ({ onAdd, isLoading }: AddCalendarDialogProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [feedType, setFeedType] = useState<'ical' | 'notion'>('ical');
  const [newCalendar, setNewCalendar] = useState({
    name: '',
    url: '',
    color: CALENDAR_COLORS[0],
    enabled: true,
    databaseId: '' // For Notion calendars
  });

  const handleAdd = async () => {
    if (feedType === 'notion') {
      await onAdd({
        name: newCalendar.name,
        url: newCalendar.url,
        color: newCalendar.color,
        enabled: newCalendar.enabled,
        type: 'notion',
        databaseId: newCalendar.databaseId,
      });
    } else {
      await onAdd({
        name: newCalendar.name,
        url: newCalendar.url,
        color: newCalendar.color,
        enabled: newCalendar.enabled,
        type: 'ical',
      });
    }
    
    setNewCalendar({
      name: '',
      url: '',
      color: CALENDAR_COLORS[0],
      enabled: true,
      databaseId: ''
    });
    setShowDialog(false);
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gray-700 hover:bg-gray-600 dark:bg-slate-900 dark:hover:bg-slate-800 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Calendar Feed
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">Add Calendar Feed</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Choose between iCal feeds or Notion databases to add calendar events.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-gray-700 dark:text-gray-300">Feed Type</Label>
            <Select value={feedType} onValueChange={(value: 'ical' | 'notion') => setFeedType(value)}>
              <SelectTrigger className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ical">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    iCal Feed (.ics)
                  </div>
                </SelectItem>
                <SelectItem value="notion">
                  <div className="flex items-center gap-2">
                    <GitFork className="h-4 w-4" />
                    Notion Database
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="calendar-name" className="text-gray-700 dark:text-gray-300">Calendar Name</Label>
            <Input
              id="calendar-name"
              placeholder="My Calendar"
              value={newCalendar.name}
              onChange={(e) => setNewCalendar(prev => ({ ...prev, name: e.target.value }))}
              className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <Label htmlFor="calendar-url" className="text-gray-700 dark:text-gray-300">
              {feedType === 'ical' ? 'iCal URL' : 'Notion Database URL'}
            </Label>
            <Input
              id="calendar-url"
              placeholder={
                feedType === 'ical' 
                  ? "https://calendar.example.com/feed.ics"
                  : "https://www.notion.so/database-id?v=view-id"
              }
              value={newCalendar.url}
              onChange={(e) => setNewCalendar(prev => ({ ...prev, url: e.target.value }))}
              className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
          </div>
          {feedType === 'notion' && (
            <div>
              <Label htmlFor="database-id" className="text-gray-700 dark:text-gray-300">Database ID</Label>
              <Input
                id="database-id"
                placeholder="Enter Notion database ID"
                value={newCalendar.databaseId}
                onChange={(e) => setNewCalendar(prev => ({ ...prev, databaseId: e.target.value }))}
                className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
          )}
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
              onClick={() => setShowDialog(false)}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={
                isLoading || 
                !newCalendar.name.trim() || 
                !newCalendar.url.trim() ||
                (feedType === 'notion' && !newCalendar.databaseId.trim())
              }
              className="bg-gray-600 hover:bg-gray-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
            >
              Add Calendar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddCalendarDialog;
