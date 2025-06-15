
import React, { useState } from 'react';
import CalendarFilters from './CalendarFilters';
import TimelineView from './TimelineView';
import WeekView from './WeekView';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { sampleEvents } from '@/data/sampleEvents';
import { ViewMode, FilterState } from '@/types/calendar';

const Calendar = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    Personal: true,
    Work: true,
    Family: true,
    Kids: true,
    Holidays: true
  });
  const [weekOffset, setWeekOffset] = useState(0);

  const filteredEvents = sampleEvents.filter(event => activeFilters[event.category]);

  const handlePreviousWeek = () => {
    setWeekOffset(prev => prev - 1);
  };

  const handleNextWeek = () => {
    setWeekOffset(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <CalendarFilters 
          activeFilters={activeFilters}
          onFiltersChange={setActiveFilters}
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
          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-1"
        >
          <ToggleGroupItem
            value="timeline"
            className="text-white data-[state=on]:bg-white/30 data-[state=on]:text-white hover:bg-white/20 hover:text-white"
          >
            Timeline
          </ToggleGroupItem>
          <ToggleGroupItem
            value="week"
            className="text-white data-[state=on]:bg-white/30 data-[state=on]:text-white hover:bg-white/20 hover:text-white"
          >
            Week
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="text-sm text-white/70 ml-auto">
          Upcoming Events ({filteredEvents.length})
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
