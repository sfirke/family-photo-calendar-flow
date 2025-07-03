
import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Settings } from 'lucide-react';

interface Calendar {
  id: string;
  summary: string;
  primary?: boolean;
  eventCount: number;
  hasEvents: boolean;
}

interface CalendarSelectorContentProps {
  calendarsFromEvents: Calendar[];
  selectedCalendarIds: string[];
  onCalendarToggle: (calendarId: string, checked: boolean) => void;
  onSelectAll: () => void;
  onSelectWithEvents: () => void;
  onClearAll: () => void;
}

const CalendarSelectorContent = ({
  calendarsFromEvents,
  selectedCalendarIds,
  onCalendarToggle,
  onSelectAll,
  onSelectWithEvents,
  onClearAll
}: CalendarSelectorContentProps) => {
  const calendarsWithEventsCount = calendarsFromEvents.filter(cal => cal.hasEvents).length;

  // Helper function to get human-readable calendar name
  const getCalendarDisplayName = (calendar: Calendar) => {
    // If summary exists, use it
    if (calendar.summary && calendar.summary !== calendar.id) {
      return calendar.summary;
    }
    
    // Handle common calendar ID patterns
    if (calendar.id === 'primary') {
      return 'Primary Calendar';
    }
    
    // If it's an email address, use just the email
    if (calendar.id.includes('@')) {
      return calendar.id;
    }
    
    // For other cases, try to make it more readable
    return calendar.id.replace(/[@.]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Show empty state when no calendars are configured
  if (calendarsFromEvents.length === 0) {
    return (
      <div className="w-80 p-4 bg-white dark:bg-gray-800 border-0">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Calendar Sources</h3>
        
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No calendars configured</p>
            <p className="text-xs mt-1">Add iCal feeds or Notion databases to get started</p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // This will be handled by the settings modal when it's integrated
              console.log('Open settings to configure calendars');
            }}
            className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30"
          >
            <Settings className="h-3 w-3 mr-1" />
            Configure Calendars
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 p-4 bg-white dark:bg-gray-800 border-0">
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Select Calendars</h3>
      
      {/* Quick Actions */}
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectAll}
          className="text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          All ({calendarsFromEvents.length})
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectWithEvents}
          className="text-xs bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          disabled={calendarsWithEventsCount === 0}
        >
          Active ({calendarsWithEventsCount})
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearAll}
          className="text-xs bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          Clear
        </Button>
      </div>

      {/* Calendar List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {calendarsFromEvents.map((calendar) => {
          const isSelected = selectedCalendarIds.includes(calendar.id);
          const displayName = getCalendarDisplayName(calendar);
          
          return (
            <div 
              key={calendar.id} 
              className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                calendar.hasEvents 
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40' 
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}
              onClick={() => onCalendarToggle(calendar.id, !isSelected)}
            >
              <Checkbox
                id={`calendar-${calendar.id}`}
                checked={isSelected}
                onCheckedChange={(checked) => {
                  console.log('Calendar checkbox toggled:', calendar.id, checked);
                  onCalendarToggle(calendar.id, checked === true);
                }}
                className="data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-600 dark:data-[state=checked]:border-blue-500 border-gray-300 dark:border-gray-600"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex-1 min-w-0">
                <label
                  htmlFor={`calendar-${calendar.id}`}
                  className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer block truncate"
                  title={displayName}
                >
                  {displayName}
                </label>
                <div className="flex items-center gap-2 mt-1">
                  {calendar.primary && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                      Primary
                    </Badge>
                  )}
                  <span className={`text-xs ${
                    calendar.hasEvents 
                      ? 'text-blue-600 dark:text-blue-400 font-medium' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {calendar.eventCount} event{calendar.eventCount !== 1 ? 's' : ''}
                  </span>
                </div>
                {/* Show calendar ID as secondary info if different from display name */}
                {displayName !== calendar.id && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">
                    {calendar.id}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {selectedCalendarIds.length} of {calendarsFromEvents.length} calendars selected
        </p>
      </div>
    </div>
  );
};

export default CalendarSelectorContent;
