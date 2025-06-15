
import React from 'react';
import { PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import QuickActions from './QuickActions';
import CalendarItem from './CalendarItem';

interface CalendarFromEvents {
  id: string;
  summary: string;
  primary?: boolean;
  eventCount: number;
  hasEvents: boolean;
}

interface CalendarSelectorContentProps {
  calendarsFromEvents: CalendarFromEvents[];
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

  const sortedCalendars = calendarsFromEvents.sort((a, b) => {
    // Sort by: primary first, then by event count (descending), then by name
    if (a.primary && !b.primary) return -1;
    if (!a.primary && b.primary) return 1;
    if (a.eventCount !== b.eventCount) return b.eventCount - a.eventCount;
    return a.summary.localeCompare(b.summary);
  });

  return (
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
        
        <QuickActions
          totalCalendars={calendarsFromEvents.length}
          calendarsWithEventsCount={calendarsWithEventsCount}
          onSelectAll={onSelectAll}
          onSelectWithEvents={onSelectWithEvents}
          onClearAll={onClearAll}
        />
        
        {/* Calendar List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sortedCalendars.map((calendar) => (
            <CalendarItem
              key={calendar.id}
              id={calendar.id}
              summary={calendar.summary}
              primary={calendar.primary}
              eventCount={calendar.eventCount}
              hasEvents={calendar.hasEvents}
              isSelected={selectedCalendarIds.includes(calendar.id)}
              onToggle={onCalendarToggle}
            />
          ))}
        </div>

        {calendarsWithEventsCount === 0 && (
          <div className="text-center py-4 text-sm text-gray-500 border-t border-gray-200">
            No calendars have events. Try syncing your Google Calendar first.
          </div>
        )}
      </div>
    </PopoverContent>
  );
};

export default CalendarSelectorContent;
