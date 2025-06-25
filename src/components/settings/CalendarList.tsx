
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';

const CalendarList = () => {
  const { 
    calendarsFromEvents,
    selectedCalendarIds, 
    toggleCalendar,
    selectAllCalendars,
    clearAllCalendars
  } = useCalendarSelection();

  const handleSelectAll = () => {
    selectAllCalendars();
  };

  const handleSelectWithEvents = () => {
    const calendarsWithEventsIds = calendarsFromEvents
      .filter(cal => cal.hasEvents)
      .map(cal => cal.id);
    
    // Update selected calendars directly
    calendarsWithEventsIds.forEach(calendarId => {
      if (!selectedCalendarIds.includes(calendarId)) {
        toggleCalendar(calendarId, true);
      }
    });
    
    // Remove any selected calendars that don't have events
    selectedCalendarIds.forEach(calendarId => {
      if (!calendarsWithEventsIds.includes(calendarId)) {
        toggleCalendar(calendarId, false);
      }
    });
  };

  const calendarsWithEventsCount = calendarsFromEvents.filter(cal => cal.hasEvents).length;

  if (calendarsFromEvents.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <CalendarIcon className="h-5 w-5" />
          Available Calendars
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Select which calendars to display in your calendar view. Based on calendars found in your local events.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="flex gap-2 pb-3 border-b border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              Select All ({calendarsFromEvents.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectWithEvents}
              className="text-xs border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              disabled={calendarsWithEventsCount === 0}
            >
              With Events ({calendarsWithEventsCount})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllCalendars}
              className="text-xs border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              Clear All
            </Button>
            <div className="ml-auto text-xs text-gray-500 dark:text-gray-400 self-center">
              {selectedCalendarIds.length} of {calendarsFromEvents.length} selected
            </div>
          </div>

          {/* Calendar List */}
          <div className="space-y-3">
            {calendarsFromEvents.map((calendar) => {
              const isSelected = selectedCalendarIds.includes(calendar.id);
              return (
                <div key={calendar.id} className={`flex items-center space-x-3 p-4 rounded-lg border ${
                  calendar.hasEvents 
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' 
                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                }`}>
                  <Checkbox
                    id={`calendar-${calendar.id}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => toggleCalendar(calendar.id, checked === true)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <label
                        htmlFor={`calendar-${calendar.id}`}
                        className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                      >
                        {calendar.summary}
                      </label>
                      {calendar.primary && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                          Primary
                        </span>
                      )}
                      {calendar.hasEvents && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200">
                          {calendar.eventCount} event{calendar.eventCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Calendar ID: {calendar.id}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Note: Calendar selections are automatically applied to the calendar view and dropdown filter.
              All data is stored locally in your browser.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarList;
