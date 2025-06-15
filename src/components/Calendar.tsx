
import React, { useState, useEffect } from 'react';
import CalendarFilters from './CalendarFilters';
import TimelineView from './TimelineView';
import WeekView from './WeekView';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { sampleEvents } from '@/data/sampleEvents';
import { ViewMode, FilterState } from '@/types/calendar';
import { useSettings } from '@/contexts/SettingsContext';
import { useGoogleCalendarEvents } from '@/hooks/useGoogleCalendarEvents';

const Calendar = () => {
  const { defaultView } = useSettings();
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    Personal: true,
    Work: true,
    Family: true,
    Kids: true,
    Holidays: true
  });
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');
  const { googleEvents } = useGoogleCalendarEvents();

  // Update view mode when default view changes
  useEffect(() => {
    setViewMode(defaultView);
  }, [defaultView]);

  // Combine sample events with Google Calendar events
  const allEvents = [...sampleEvents, ...googleEvents];
  const filteredEvents = allEvents.filter(event => activeFilters[event.category]);

  const handlePreviousWeek = () => {
    setWeekOffset(prev => prev - 1);
  };

  const handleNextWeek = () => {
    setWeekOffset(prev => prev + 1);
  };

  const handleCalendarChange = (calendarId: string) => {
    setSelectedCalendarId(calendarId);
    // Here you could filter events by calendar if needed
    console.log('Selected calendar:', calendarId);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <CalendarFilters 
          activeFilters={activeFilters}
          onFiltersChange={setActiveFilters}
          selectedCalendarId={selectedCalendarId}
          onCalendarChange={handleCalendarChange}
        />
        
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => {
            if (value) {
              setViewMode(value as ViewMode);
              if (value === 'timeline') {
                setWeekOffset(0); // Reset week offset when switching to timeline
              }
            }
          }}
          className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-md h-10 dark:bg-gray-800/95 dark:border-gray-700/20"
        >
          <ToggleGroupItem
            value="timeline"
            className="text-gray-900 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 hover:bg-gray-50 hover:text-gray-900 h-8 px-3 dark:text-gray-100 dark:data-[state=on]:bg-gray-700 dark:data-[state=on]:text-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-100"
          >
            Timeline
          </ToggleGroupItem>
          <ToggleGroupItem
            value="week"
            className="text-gray-900 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 hover:bg-gray-50 hover:text-gray-900 h-8 px-3 dark:text-gray-100 dark:data-[state=on]:bg-gray-700 dark:data-[state=on]:text-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-100"
          >
            Week
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="text-sm text-white/70 ml-auto dark:text-gray-300/70">
          Upcoming Events ({filteredEvents.length})
          {googleEvents.length > 0 && (
            <span className="ml-2 text-xs text-green-300">
              • {googleEvents.length} from Google Calendar
            </span>
          )}
        </div>
      </div>

      {/* Events Display */}
      <div className="animate-fade-in">
        {viewMode === 'timeline' ? (
          <TimelineView events={filteredEvents} />
        ) : (
          <WeekView 
            events={filteredEvents}
            weekOffset={weekOffset}
            onPreviousWeek={handlePreviousWeek}
            onNextWeek={handleNextWeek}
          />
        )}
      </div>
    </div>
  );
};

export default Calendar;
