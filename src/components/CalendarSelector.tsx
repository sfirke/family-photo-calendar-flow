
import React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';
import CalendarSelectorButton from './calendar/CalendarSelectorButton';
import CalendarSelectorContent from './calendar/CalendarSelectorContent';

const CalendarSelector = () => {
  const { 
    calendarsFromEvents, 
    selectedCalendarIds,
    isLoading, 
    toggleCalendar, 
    selectAllCalendars, 
    selectCalendarsWithEvents, 
    clearAllCalendars
  } = useCalendarSelection();

  const handleCalendarToggle = (calendarId: string, checked: boolean) => {
    console.log('CalendarSelector - Toggling calendar:', calendarId, checked);
    toggleCalendar(calendarId, checked);
  };

  const handleSelectAll = () => {
    console.log('CalendarSelector - Select all calendars');
    selectAllCalendars();
  };

  const handleSelectWithEvents = () => {
    console.log('CalendarSelector - Select calendars with events');
    selectCalendarsWithEvents();
  };

  const handleClearAll = () => {
    console.log('CalendarSelector - Clear all calendars');
    clearAllCalendars();
  };

  if (isLoading) {
    return (
      <CalendarSelectorButton
        selectedCount={0}
        totalCount={0}
        disabled={true}
      />
    );
  }

  if (calendarsFromEvents.length === 0) {
    return (
      <CalendarSelectorButton
        selectedCount={0}
        totalCount={0}
        disabled={true}
      />
    );
  }

  console.log('CalendarSelector - Rendering with calendars:', calendarsFromEvents.length, 'selected:', selectedCalendarIds.length);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <CalendarSelectorButton
          selectedCount={selectedCalendarIds.length}
          totalCount={calendarsFromEvents.length}
        />
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 w-auto z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg" 
        align="start"
        sideOffset={4}
      >
        <CalendarSelectorContent
          calendarsFromEvents={calendarsFromEvents}
          selectedCalendarIds={selectedCalendarIds}
          onCalendarToggle={handleCalendarToggle}
          onSelectAll={handleSelectAll}
          onSelectWithEvents={handleSelectWithEvents}
          onClearAll={handleClearAll}
        />
      </PopoverContent>
    </Popover>
  );
};

export default CalendarSelector;
