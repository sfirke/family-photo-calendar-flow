
import React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';
import CalendarSelectorButton from './calendar/CalendarSelectorButton';
import CalendarSelectorContent from './calendar/CalendarSelectorContent';

const CalendarSelector = () => {
  const { 
    calendarsFromEvents, 
    isLoading, 
    toggleCalendar, 
    selectAllCalendars, 
    selectCalendarsWithEvents, 
    clearAllCalendars,
    selectedCalendarIds
  } = useCalendarSelection();

  const handleCalendarToggle = (calendarId: string, checked: boolean) => {
    console.log('CalendarSelector - toggling calendar:', { calendarId, checked });
    toggleCalendar(calendarId, checked);
  };

  const handleSelectAll = () => {
    console.log('CalendarSelector - select all calendars');
    selectAllCalendars();
  };

  const handleSelectWithEvents = () => {
    console.log('CalendarSelector - select calendars with events');
    selectCalendarsWithEvents();
  };

  const handleClearAll = () => {
    console.log('CalendarSelector - clear all calendars');
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

  console.log('CalendarSelector render:', {
    selectedCount: selectedCalendarIds.length,
    totalCount: calendarsFromEvents.length,
    calendars: calendarsFromEvents.map(cal => ({ id: cal.id, summary: cal.summary, hasEvents: cal.hasEvents }))
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <CalendarSelectorButton
          selectedCount={selectedCalendarIds.length}
          totalCount={calendarsFromEvents.length}
        />
      </PopoverTrigger>
      <PopoverContent className="p-0 w-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-50" align="start">
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
