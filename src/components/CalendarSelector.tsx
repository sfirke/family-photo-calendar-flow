
import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown } from 'lucide-react';
import { useGoogleCalendars } from '@/hooks/useGoogleCalendars';
import { useAuth } from '@/hooks/useAuth';

const SELECTED_CALENDARS_KEY = 'selectedCalendarIds';

interface CalendarSelectorProps {
  selectedCalendarIds: string[];
  onCalendarChange: (calendarIds: string[]) => void;
}

const CalendarSelector = ({ selectedCalendarIds, onCalendarChange }: CalendarSelectorProps) => {
  const { calendars, isLoading } = useGoogleCalendars();
  const { user } = useAuth();

  const handleCalendarToggle = (calendarId: string, checked: boolean) => {
    console.log('CalendarSelector: Calendar toggle:', calendarId, 'checked:', checked);
    let newSelection: string[];
    
    if (checked) {
      newSelection = [...selectedCalendarIds, calendarId];
    } else {
      newSelection = selectedCalendarIds.filter(id => id !== calendarId);
    }
    
    onCalendarChange(newSelection);
    localStorage.setItem(SELECTED_CALENDARS_KEY, JSON.stringify(newSelection));
    console.log('CalendarSelector: Updated selection:', newSelection);
  };

  const selectAll = () => {
    const allIds = calendars.map(cal => cal.id);
    onCalendarChange(allIds);
    localStorage.setItem(SELECTED_CALENDARS_KEY, JSON.stringify(allIds));
    console.log('CalendarSelector: Selected all calendars:', allIds);
  };

  const clearAll = () => {
    onCalendarChange([]);
    localStorage.setItem(SELECTED_CALENDARS_KEY, JSON.stringify([]));
    console.log('CalendarSelector: Cleared all calendar selections');
  };

  if (!user) {
    return (
      <Button
        variant="outline"
        className="bg-white/95 backdrop-blur-sm border-white/20 text-gray-900 min-w-[200px]"
        disabled
      >
        Sign in to view calendars
      </Button>
    );
  }

  if (isLoading) {
    return (
      <Button
        variant="outline"
        className="bg-white/95 backdrop-blur-sm border-white/20 text-gray-900 min-w-[200px]"
        disabled
      >
        Loading calendars...
      </Button>
    );
  }

  if (calendars.length === 0) {
    return (
      <Button
        variant="outline"
        className="bg-white/95 backdrop-blur-sm border-white/20 text-gray-900 min-w-[200px]"
        disabled
      >
        No calendars available
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="bg-white/95 backdrop-blur-sm border-white/20 text-gray-900 hover:bg-white/100 justify-between min-w-[200px]"
        >
          <span>Calendars ({selectedCalendarIds.length}/{calendars.length})</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 bg-white/95 backdrop-blur-sm border-white/20 z-50" 
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Select Calendars</h3>
          
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {calendars.map((calendar) => {
              const isChecked = selectedCalendarIds.includes(calendar.id);
              console.log('CalendarSelector: Rendering calendar:', calendar.id, 'checked:', isChecked);
              return (
                <div key={calendar.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={calendar.id}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      console.log('CalendarSelector: Checkbox changed for:', calendar.id, 'new state:', checked);
                      handleCalendarToggle(calendar.id, checked === true);
                    }}
                  />
                  <label
                    htmlFor={calendar.id}
                    className="text-sm text-gray-700 cursor-pointer flex-1"
                  >
                    {calendar.summary}
                    {calendar.primary && <span className="ml-2 text-xs text-blue-600">(Primary)</span>}
                  </label>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              className="text-xs flex-1"
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              className="text-xs flex-1"
            >
              Clear All
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CalendarSelector;
