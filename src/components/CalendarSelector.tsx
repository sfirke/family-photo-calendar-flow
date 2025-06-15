
import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, Calendar as CalendarIcon } from 'lucide-react';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';
import { useAuth } from '@/hooks/useAuth';

interface CalendarSelectorProps {
  selectedCalendarIds: string[];
  onCalendarChange: (calendarIds: string[]) => void;
}

const CalendarSelector = ({ selectedCalendarIds, onCalendarChange }: CalendarSelectorProps) => {
  const { calendarsWithEvents, isLoading, toggleCalendar, selectAllCalendars, selectCalendarsWithEvents, clearAllCalendars } = useCalendarSelection();
  const { user } = useAuth();

  const handleCalendarToggle = (calendarId: string, checked: boolean) => {
    toggleCalendar(calendarId, checked);
    // Also update parent component
    let newSelection: string[];
    if (checked) {
      newSelection = [...selectedCalendarIds, calendarId];
    } else {
      newSelection = selectedCalendarIds.filter(id => id !== calendarId);
    }
    onCalendarChange(newSelection);
  };

  if (!user) {
    console.log('CalendarSelector: No user authenticated');
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
    console.log('CalendarSelector: Loading calendars...');
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

  if (calendarsWithEvents.length === 0) {
    console.log('CalendarSelector: No calendars available');
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

  const calendarsWithEventsCount = calendarsWithEvents.filter(cal => cal.hasEvents).length;
  console.log('CalendarSelector: Rendering selector with calendars:', calendarsWithEvents.map(cal => ({ 
    id: cal.id, 
    name: cal.summary, 
    eventCount: cal.eventCount,
    hasEvents: cal.hasEvents 
  })));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="bg-white/95 backdrop-blur-sm border-white/20 text-gray-900 hover:bg-white/100 justify-between min-w-[200px]"
        >
          <span>Calendars ({selectedCalendarIds.length}/{calendarsWithEvents.length})</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 bg-white/95 backdrop-blur-sm border-white/20 z-50" 
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Select Calendars
          </h3>
          
          {/* Quick Actions */}
          <div className="flex gap-2 pt-2 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                selectAllCalendars();
                onCalendarChange(calendarsWithEvents.map(cal => cal.id));
              }}
              className="text-xs flex-1"
            >
              All ({calendarsWithEvents.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                selectCalendarsWithEvents();
                const withEventsIds = calendarsWithEvents.filter(cal => cal.hasEvents).map(cal => cal.id);
                onCalendarChange(withEventsIds);
              }}
              className="text-xs flex-1"
              disabled={calendarsWithEventsCount === 0}
            >
              With Events ({calendarsWithEventsCount})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearAllCalendars();
                onCalendarChange([]);
              }}
              className="text-xs flex-1"
            >
              None
            </Button>
          </div>
          
          {/* Calendar List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {calendarsWithEvents
              .sort((a, b) => {
                // Sort by: primary first, then by event count (descending), then by name
                if (a.primary && !b.primary) return -1;
                if (!a.primary && b.primary) return 1;
                if (a.eventCount !== b.eventCount) return b.eventCount - a.eventCount;
                return a.summary.localeCompare(b.summary);
              })
              .map((calendar) => {
                const isChecked = selectedCalendarIds.includes(calendar.id);
                return (
                  <div key={calendar.id} className={`flex items-center space-x-3 p-3 rounded-lg ${
                    calendar.hasEvents ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                  }`}>
                    <Checkbox
                      id={calendar.id}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        handleCalendarToggle(calendar.id, checked === true);
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={calendar.id}
                        className="text-sm font-medium text-gray-900 cursor-pointer block truncate"
                      >
                        {calendar.summary}
                        {calendar.primary && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Primary
                          </span>
                        )}
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs ${calendar.hasEvents ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                          {calendar.eventCount} event{calendar.eventCount !== 1 ? 's' : ''}
                        </span>
                        {calendar.hasEvents && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {calendarsWithEventsCount === 0 && (
            <div className="text-center py-4 text-sm text-gray-500 border-t border-gray-200">
              No calendars have events. Try syncing your Google Calendar first.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CalendarSelector;
