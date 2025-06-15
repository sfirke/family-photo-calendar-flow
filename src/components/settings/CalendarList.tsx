
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';

const CalendarList = () => {
  const { 
    selectedCalendarIds, 
    calendarsWithEvents, 
    isLoading: calendarsLoading,
    toggleCalendar,
    selectAllCalendars,
    selectCalendarsWithEvents,
    clearAllCalendars
  } = useCalendarSelection();

  const calendarsWithEventsCount = calendarsWithEvents.filter(cal => cal.hasEvents).length;

  if (calendarsWithEvents.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Available Calendars
        </CardTitle>
        <CardDescription>
          Select which calendars to display in your calendar view. Calendars with events are highlighted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {calendarsLoading ? (
          <div className="flex items-center gap-2 text-gray-600">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading calendars...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="flex gap-2 pb-3 border-b border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllCalendars}
                className="text-xs"
              >
                Select All ({calendarsWithEvents.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={selectCalendarsWithEvents}
                className="text-xs"
                disabled={calendarsWithEventsCount === 0}
              >
                With Events ({calendarsWithEventsCount})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllCalendars}
                className="text-xs"
              >
                Clear All
              </Button>
              <div className="ml-auto text-xs text-gray-500 self-center">
                {selectedCalendarIds.length} of {calendarsWithEvents.length} selected
              </div>
            </div>

            {/* Calendar List */}
            <div className="space-y-3">
              {calendarsWithEvents
                .sort((a, b) => {
                  // Sort by: primary first, then by event count (descending), then by name
                  if (a.primary && !b.primary) return -1;
                  if (!a.primary && b.primary) return 1;
                  if (a.eventCount !== b.eventCount) return b.eventCount - a.eventCount;
                  return a.summary.localeCompare(b.summary);
                })
                .map((calendar) => {
                  const isSelected = selectedCalendarIds.includes(calendar.id);
                  return (
                    <div key={calendar.id} className={`flex items-center space-x-3 p-4 rounded-lg border ${
                      calendar.hasEvents 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-gray-50 border-gray-200'
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
                            className="text-sm font-medium text-gray-900 cursor-pointer"
                          >
                            {calendar.summary}
                          </label>
                          {calendar.primary && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Primary
                            </span>
                          )}
                          {calendar.hasEvents && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              {calendar.eventCount} event{calendar.eventCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          Calendar ID: {calendar.id}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
            
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Note: Calendar selections are automatically applied to the calendar view and dropdown filter.
                Calendars with events are highlighted and sorted by event count.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarList;
