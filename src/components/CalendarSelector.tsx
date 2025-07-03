
import React, { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';
import CalendarSelectorButton from './calendar/CalendarSelectorButton';
import CalendarSelectorContent from './calendar/CalendarSelectorContent';

const CalendarSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  
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

  const handleButtonClick = () => {
    console.log('CalendarSelector - Button clicked, toggling popover. Current state:', isOpen);
    setIsOpen(!isOpen);
  };

  const handleOpenChange = (open: boolean) => {
    console.log('CalendarSelector - Popover open state changed:', open);
    setIsOpen(open);
  };

  // Add debugging logs
  console.log('CalendarSelector - State:', {
    isLoading,
    calendarsCount: calendarsFromEvents.length,
    selectedCount: selectedCalendarIds.length,
    isOpen,
    calendars: calendarsFromEvents.map(cal => ({ id: cal.id, name: cal.summary, hasEvents: cal.hasEvents }))
  });

  if (isLoading) {
    return (
      <CalendarSelectorButton
        selectedCount={0}
        totalCount={0}
        disabled={true}
        onClick={handleButtonClick}
      />
    );
  }

  console.log('CalendarSelector - Rendering dropdown with calendars:', calendarsFromEvents.length, 'selected:', selectedCalendarIds.length, 'isOpen:', isOpen);

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <CalendarSelectorButton
          selectedCount={selectedCalendarIds.length}
          totalCount={calendarsFromEvents.length}
          disabled={false}
          onClick={handleButtonClick}
        />
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 w-auto z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg" 
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => {
          console.log('CalendarSelector - Popover opened and focused');
        }}
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
